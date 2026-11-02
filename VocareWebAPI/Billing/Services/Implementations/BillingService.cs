using Hangfire;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using VocareWebAPI.Billing.Configuration;
using VocareWebAPI.Billing.Constants;
using VocareWebAPI.Billing.Exceptions;
using VocareWebAPI.Billing.Models.Dtos;
using VocareWebAPI.Billing.Models.Entities;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.Billing.Services.Interfaces;
using VocareWebAPI.Data;
using VocareWebAPI.Shared.Exceptions;

namespace VocareWebAPI.Billing.Services.Implementations
{
    public class BillingService : IBillingService
    {
        /// <summary>Po tym czasie rezerwacja eventu bez zakończenia uznawana jest za porzuconą.</summary>
        private static readonly TimeSpan EventLeaseDuration = TimeSpan.FromMinutes(5);

        private readonly AppDbContext _dbContext;
        private readonly IServiceCostRepository _serviceCostRepository;
        private readonly IUserBillingRepository _userBillingRepository;
        private readonly ITokenTransactionRepository _tokenTransactionRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IConsentDiscountService _consentDiscountService;
        private readonly Stripe.SubscriptionService _stripeSubscriptions;
        private readonly string _webhookSecret;
        private readonly ILogger<BillingService> _logger;

        public BillingService(
            AppDbContext context,
            IServiceCostRepository serviceCostRepository,
            IUserBillingRepository userBillingRepository,
            ITokenTransactionRepository tokenTransactionRepository,
            IBackgroundJobClient backgroundJobClient,
            IConsentDiscountService consentDiscountService,
            Stripe.SubscriptionService stripeSubscriptions,
            IConfiguration configuration,
            ILogger<BillingService> logger
        )
        {
            _dbContext = context;
            _serviceCostRepository = serviceCostRepository;
            _userBillingRepository = userBillingRepository;
            _tokenTransactionRepository = tokenTransactionRepository;
            _backgroundJobClient = backgroundJobClient;
            _consentDiscountService = consentDiscountService;
            _stripeSubscriptions = stripeSubscriptions;
            _logger = logger;
            _webhookSecret =
                configuration["Stripe:WebhookSecret"]
                ?? throw new ArgumentNullException(
                    nameof(configuration),
                    "WebhookSecret is not configured."
                );
        }

        public async Task CanAccessServiceAsync(string userId, string serviceName)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(serviceName))
            {
                throw new ArgumentException("User ID and service name cannot be null or empty.");
            }

            var serviceCost = await _serviceCostRepository.GetServiceCostAsync(serviceName);
            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

            if (userBilling.HasPremiumAccess)
                return;
            if (userBilling.TokenBalance >= serviceCost)
                return;

            throw new InsufficientTokensException(userId, userBilling.TokenBalance, serviceCost);
        }

        public async Task DeductTokensForServiceAsync(string userId, string serviceName)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(serviceName))
                throw new ArgumentException("User ID and service name cannot be null or empty.");

            var serviceCost = await _serviceCostRepository.GetServiceCostAsync(serviceName);
            if (serviceCost <= 0)
                throw new InvalidServiceCostException(serviceName, serviceCost);

            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

            if (userBilling.HasPremiumAccess)
                return;

            if (userBilling.TokenBalance < serviceCost)
                throw new InsufficientTokensException(
                    userId,
                    userBilling.TokenBalance,
                    serviceCost
                );

            var isInMemory =
                _dbContext.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory";

            if (isInMemory)
            {
                await ProcessTokenDeductionAsync(userBilling, userId, serviceName, serviceCost);
            }
            else
            {
                await using var trx = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    await ProcessTokenDeductionAsync(userBilling, userId, serviceName, serviceCost);
                    await trx.CommitAsync();
                }
                catch (Exception ex) when (ex is not DomainException)
                {
                    await trx.RollbackAsync();
                    throw;
                }
            }
        }

        private async Task ProcessTokenDeductionAsync(
            UserBilling userBilling,
            string userId,
            string serviceName,
            int serviceCost
        )
        {
            userBilling.TokenBalance -= serviceCost;
            userBilling.LastTokenPurchaseDate = DateTime.UtcNow;

            var tokenTransaction = new TokenTransaction
            {
                UserId = userId,
                ServiceName = serviceName,
                Type = TransactionType.Usage,
                Amount = -serviceCost,
                CreatedAt = DateTime.UtcNow,
            };
            await _dbContext.TokenTransactions.AddAsync(tokenTransaction);

            await _dbContext.SaveChangesAsync();
        }

        public async Task HandleWebhookAsync(string json, string stripeSignature)
        {
            _logger.LogInformation($"=== WEBHOOK RECEIVED ===");
            _logger.LogInformation($"Signature: {stripeSignature?.Substring(0, 20)}...");

            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(stripeSignature))
                throw new ArgumentException("Invalid webhook payload or missing signature.");

            var stripeEvent = Stripe.EventUtility.ConstructEvent(
                json,
                stripeSignature,
                _webhookSecret,
                throwOnApiVersionMismatch: false
            );
            _logger.LogInformation($"Event type: {stripeEvent.Type}");
            _logger.LogInformation($"Event ID: {stripeEvent.Id}");

            // Stripe ponawia webhooki (timeout, błąd 5xx) i może dostarczyć ten sam event kilka
            // razy, także równolegle – bez tego tokeny i maile byłyby przyznawane wielokrotnie
            if (!await TryClaimEventAsync(stripeEvent))
            {
                _logger.LogInformation(
                    "Stripe event {EventId} ({EventType}) already processed, skipping",
                    stripeEvent.Id,
                    stripeEvent.Type
                );
                return;
            }

            try
            {
                await DispatchEventAsync(stripeEvent);
            }
            catch
            {
                // Zwalniamy event, żeby ponowienie od Stripe mogło go obsłużyć
                await ReleaseEventAsync(stripeEvent.Id);
                throw;
            }

            await MarkEventCompletedAsync(stripeEvent.Id);
        }

        /// <summary>
        /// Rezerwuje event do obsługi. Zwraca false, gdy event został już obsłużony. Rzuca
        /// <see cref="StripeEventInProgressException"/> (409 – Stripe ponowi później), gdy obsługuje
        /// go równolegle inna dostawa. Rezerwacja porzucona przez ubity proces (deploy, restart)
        /// wygasa po <see cref="EventLeaseDuration"/> i może zostać przejęta.
        /// </summary>
        private async Task<bool> TryClaimEventAsync(Stripe.Event stripeEvent)
        {
            var now = DateTime.UtcNow;
            var existing = await _dbContext.ProcessedStripeEvents.FirstOrDefaultAsync(e =>
                e.Id == stripeEvent.Id
            );

            if (existing is not null)
            {
                if (existing.CompletedAt is not null)
                    return false;

                if (existing.ProcessedAt > now - EventLeaseDuration)
                    throw new StripeEventInProgressException(stripeEvent.Id);

                _logger.LogWarning(
                    "Taking over abandoned Stripe event {EventId} claimed at {ClaimedAt}",
                    stripeEvent.Id,
                    existing.ProcessedAt
                );
                existing.ProcessedAt = now;
                try
                {
                    // ProcessedAt jest tokenem współbieżności – przy równoległym przejęciu
                    // tylko jedna dostawa zapisze zmianę
                    await _dbContext.SaveChangesAsync();
                    return true;
                }
                catch (DbUpdateConcurrencyException)
                {
                    _dbContext.Entry(existing).State = EntityState.Detached;
                    throw new StripeEventInProgressException(stripeEvent.Id);
                }
            }

            var processedEvent = new ProcessedStripeEvent
            {
                Id = stripeEvent.Id,
                Type = stripeEvent.Type,
                ProcessedAt = now,
            };
            _dbContext.ProcessedStripeEvents.Add(processedEvent);

            try
            {
                await _dbContext.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateException ex)
                when (ex.InnerException
                        is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation }
                )
            {
                // Równoległa dostawa tego samego eventu zdążyła go zarezerwować
                _dbContext.Entry(processedEvent).State = EntityState.Detached;
                throw new StripeEventInProgressException(stripeEvent.Id);
            }
        }

        private async Task MarkEventCompletedAsync(string eventId)
        {
            try
            {
                // Handlery mogły zostawić w kontekście śledzone encje – czyścimy go, żeby zapisać
                // wyłącznie znacznik zakończenia
                _dbContext.ChangeTracker.Clear();
                var processedEvent = await _dbContext.ProcessedStripeEvents.FirstOrDefaultAsync(e =>
                    e.Id == eventId
                );
                if (processedEvent is null)
                    return;

                processedEvent.CompletedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Efekty są już zapisane – bez znacznika ponowienie od Stripe po wygaśnięciu
                // dzierżawy obsłużyłoby event drugi raz, więc to błąd do monitorowania
                _logger.LogError(ex, "Failed to mark Stripe event {EventId} as completed", eventId);
            }
        }

        private async Task ReleaseEventAsync(string eventId)
        {
            try
            {
                // Po błędzie obsługi kontekst może śledzić wycofane zmiany – czyścimy go, żeby
                // usunięcie rezerwacji nie zapisało ich ponownie
                _dbContext.ChangeTracker.Clear();
                // Wczytujemy rezerwację zamiast usuwać po samym Id – ProcessedAt jest tokenem
                // współbieżności i musi zgadzać się z wartością w bazie
                var processedEvent = await _dbContext.ProcessedStripeEvents.FirstOrDefaultAsync(e =>
                    e.Id == eventId
                );
                if (processedEvent is null)
                    return;

                _dbContext.ProcessedStripeEvents.Remove(processedEvent);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to release Stripe event {EventId}", eventId);
            }
        }

        private async Task DispatchEventAsync(Stripe.Event stripeEvent)
        {
            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                if (session?.Mode == "payment")
                {
                    // Metody z opóźnionym rozliczeniem kończą sesję ze statusem „unpaid” –
                    // tokeny przyznajemy dopiero po checkout.session.async_payment_succeeded
                    if (session.PaymentStatus == "paid")
                        await CreditTokenPurchaseAsync(session);
                    else
                        _logger.LogInformation(
                            "Checkout session {SessionId} completed with payment status {PaymentStatus}, waiting for async payment",
                            session.Id,
                            session.PaymentStatus
                        );
                }

                if (session?.Mode == "subscription")
                    await AlignTrialWithWithdrawalPeriodAsync(session, stripeEvent.Created);

                // Umowa jest zawarta w chwili zakończenia checkoutu (event), nie otwarcia sesji
                if (session != null)
                    EnqueuePurchaseConfirmation(session, stripeEvent.Created);
            }
            else if (stripeEvent.Type == "checkout.session.async_payment_succeeded")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                if (session?.Mode == "payment")
                    await CreditTokenPurchaseAsync(session);
            }
            else if (stripeEvent.Type == "checkout.session.async_payment_failed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                _logger.LogWarning(
                    "Async payment failed for checkout session {SessionId}, no tokens granted",
                    session?.Id
                );
            }
            else if (stripeEvent.Type == "customer.subscription.created")
            {
                await HandleSubscriptionCreatedAsync(stripeEvent);
            }
            else if (stripeEvent.Type == "customer.subscription.updated")
            {
                await HandleSubscriptionUpdatedAsync(stripeEvent);
            }
            else if (stripeEvent.Type == "customer.subscription.deleted")
            {
                await HandleSubscriptionDeletedAsync(stripeEvent);
            }
            else if (stripeEvent.Type == "invoice.payment_succeeded")
            {
                await HandleInvoicePaymentSucceededAsync(stripeEvent);
            }
            else if (stripeEvent.Type == "invoice.payment_failed")
            {
                await HandleInvoicePaymentFailedAsync(stripeEvent);
            }
            else
            {
                _logger.LogInformation($"Unhandled webhook event type: {stripeEvent.Type}");
            }
        }

        /// <summary>
        /// Przesuwa koniec okresu próbnego na pierwszą chwilę po upływie terminu na odstąpienie
        /// (§ 11 Regulaminu). Stripe kończy trial o tej samej godzinie, o której się zaczął, a termin
        /// na odstąpienie trwa do północy ostatniego dnia (i dłużej w weekendy i święta) – bez tego
        /// pierwsza płatność wypadałaby jeszcze w terminie na odstąpienie z prawem do zwrotu całej
        /// ceny. Wywołanie jest idempotentne – ponowienie eventu niczego nie zmienia.
        /// </summary>
        private async Task AlignTrialWithWithdrawalPeriodAsync(
            Stripe.Checkout.Session session,
            DateTime concludedAtUtc
        )
        {
            if (string.IsNullOrEmpty(session.SubscriptionId))
                return;

            var subscription = await _stripeSubscriptions.GetAsync(session.SubscriptionId);
            if (subscription.Status != "trialing" || subscription.TrialEnd is null)
                return;

            var withdrawalDeadline = WithdrawalPeriodCalculator.GetDeadlineUtc(concludedAtUtc);
            if (subscription.TrialEnd.Value >= withdrawalDeadline)
                return;

            await _stripeSubscriptions.UpdateAsync(
                subscription.Id,
                new Stripe.SubscriptionUpdateOptions
                {
                    TrialEnd = withdrawalDeadline,
                    ProrationBehavior = "none",
                }
            );

            _logger.LogInformation(
                "Extended trial of {SubscriptionId} from {OldTrialEnd} to {NewTrialEnd} (end of withdrawal period)",
                subscription.Id,
                subscription.TrialEnd,
                withdrawalDeadline
            );
        }

        /// <summary>
        /// Dolicza tokeny z opłaconej sesji Checkout i oznacza wykorzystanie rabatu za zgodę.
        /// </summary>
        private async Task CreditTokenPurchaseAsync(Stripe.Checkout.Session session)
        {
            // ---------- Pobieranie danych z metadanych ----------
            var userId =
                session.Metadata?["userId"]
                ?? throw new InvalidOperationException("userId missing in metadata");

            if (!session.Metadata.TryGetValue("tokenAmount", out var tokenAmountStr))
            {
                _logger.LogError(
                    "tokenAmount missing in metadata for session {SessionId}, userId {UserId}",
                    session.Id,
                    userId
                );
                throw new InvalidOperationException("tokenAmount missing in metadata");
            }

            if (!int.TryParse(tokenAmountStr, out var tokensToAdd))
            {
                _logger.LogError(
                    "Invalid tokenAmount value '{TokenAmountStr}' for session {SessionId}, userId {UserId}",
                    tokenAmountStr,
                    session.Id,
                    userId
                );
                throw new InvalidOperationException($"Invalid tokenAmount value: {tokenAmountStr}");
            }

            var packageName = session.Metadata?.GetValueOrDefault("packageName", "Unknown Package");

            _logger.LogInformation(
                "Processing payment for userId={UserId}, package={PackageName}, tokens={TokenAmount}",
                userId,
                packageName,
                tokensToAdd
            );

            var ub = await _userBillingRepository.GetByUserIdAsync(userId);

            await using var tx = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                await _userBillingRepository.AddTokensAsync(userId, tokensToAdd);

                var tt = new TokenTransaction
                {
                    UserId = userId,
                    ServiceName = $"TokenPurchase-{packageName}",
                    Type = TransactionType.Purchase,
                    Amount = tokensToAdd,
                    CreatedAt = DateTime.UtcNow,
                };
                await _tokenTransactionRepository.AddTransactionAsync(tt);

                var consentDiscountUsed = session.Metadata?.GetValueOrDefault(
                    CheckoutMetadataKeys.ConsentDiscount
                );
                if (consentDiscountUsed == "true")
                {
                    await _consentDiscountService.MarkRedeemedAsync(userId);
                }

                await tx.CommitAsync();

                _logger.LogInformation(
                    "Successfully added {TokenAmount} tokens to userId={UserId} for package={PackageName}",
                    tokensToAdd,
                    userId,
                    packageName
                );
            }
            catch (Exception ex) when (ex is not DomainException)
            {
                await tx.RollbackAsync();
                _logger.LogError(
                    ex,
                    "Failed to process token purchase for userId={UserId}, session={SessionId}",
                    userId,
                    session.Id
                );
                throw;
            }
        }

        /// <summary>
        /// Zleca wysyłkę potwierdzenia zawarcia umowy na trwałym nośniku.
        /// Błąd zlecenia nie może przerwać obsługi webhooka – Stripe ponowiłby zdarzenie
        /// i ponownie doliczył tokeny.
        /// </summary>
        private void EnqueuePurchaseConfirmation(
            Stripe.Checkout.Session session,
            DateTime concludedAtUtc
        )
        {
            var email = session.CustomerDetails?.Email ?? session.CustomerEmail;
            if (string.IsNullOrEmpty(email))
            {
                _logger.LogWarning(
                    "No customer email for session {SessionId}, purchase confirmation not sent",
                    session.Id
                );
                return;
            }

            var metadata = session.Metadata ?? new Dictionary<string, string>();
            var confirmation = new PurchaseConfirmationDto
            {
                Email = email,
                SessionId = session.Id,
                CheckoutMode = session.Mode,
                PackageName = metadata.GetValueOrDefault("packageName", "Vocare"),
                AmountTotal = session.AmountTotal,
                Currency = session.Currency,
                PurchasedAtUtc = concludedAtUtc == default ? DateTime.UtcNow : concludedAtUtc,
                SubscriptionId = session.SubscriptionId,
            };

            try
            {
                _backgroundJobClient.Enqueue<IPurchaseConfirmationService>(s =>
                    s.SendPurchaseConfirmationAsync(confirmation)
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to enqueue purchase confirmation for session {SessionId}",
                    session.Id
                );
            }
        }

        public async Task<UserBilling> GetUserBillingAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
                throw new ArgumentException("User ID cannot be null or empty.", nameof(userId));

            var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

            return userBilling!; // sprawdzamy w repozytorium
        }

        /// <summary>
        /// Obsługuje utworzenie nowej subskrypcji w Stripe
        /// Aktualizuje status subskrypcji użytkownika w bazie danych na Active
        /// </summary>
        /// <param name="stripeEvent"></param>
        /// <returns></returns>
        private async Task HandleSubscriptionCreatedAsync(Stripe.Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null)
            {
                _logger.LogError(
                    "Invalid subscription object in webhook {EventId}",
                    stripeEvent.Id
                );
                return;
            }

            _logger.LogInformation(
                "Processing subscription.created for subscriptionId={SubscriptionId}, customerId={CustomerId}",
                subscription.Id,
                subscription.CustomerId
            );

            var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(
                subscription.CustomerId
            );
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError(
                    "No userId found for customerId={CustomerId}",
                    subscription.CustomerId
                );
                return;
            }

            // Stripe nie gwarantuje kolejności eventów – stan subskrypcji bierzemy aktualny,
            // a nie z ładunku eventu
            subscription = await _stripeSubscriptions.GetAsync(subscription.Id);

            var subscriptionLevel = DetermineSubscriptionLevel(subscription);

            DateTime? subscriptionEndDate = null;
            if (subscription.Items?.Data?.Any() == true)
            {
                subscriptionEndDate = subscription.Items.Data.First().CurrentPeriodEnd;
            }

            await using var tx = await _dbContext.Database.BeginTransactionAsync();
            try
            {
                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                if (
                    userBilling.HasPremiumAccess
                    && userBilling.StripeSubscriptionId is not null
                    && userBilling.StripeSubscriptionId != subscription.Id
                )
                {
                    // Nie gubimy śledzonej, wciąż aktywnej subskrypcji – druga wymaga ręcznej
                    // decyzji (zwrot / anulowanie w Stripe)
                    _logger.LogError(
                        "Duplicate subscription {NewSubscriptionId} for userId={UserId}, keeping tracked {TrackedSubscriptionId}",
                        subscription.Id,
                        userId,
                        userBilling.StripeSubscriptionId
                    );
                }
                else
                {
                    userBilling.StripeSubscriptionId = subscription.Id;
                    userBilling.SubscriptionStatus = MapStripeStatusToOurStatus(
                        subscription.Status
                    );
                    userBilling.SubscriptionLevel = subscriptionLevel;
                    userBilling.SubscriptionEndDate = subscriptionEndDate;

                    await _userBillingRepository.UpdateAsync(userBilling);
                }

                var transaction = new TokenTransaction
                {
                    UserId = userId,
                    ServiceName =
                        $"{TransactionServiceNames.SubscriptionActivatedPrefix}{subscriptionLevel}",
                    Type = TransactionType.Purchase,
                    Amount = 0,
                    CreatedAt = DateTime.UtcNow,
                };
                await _tokenTransactionRepository.AddTransactionAsync(transaction);

                await tx.CommitAsync();

                _logger.LogInformation(
                    "Successfully activated subscription for userId={UserId}, level={SubscriptionLevel}, endDate={EndDate}",
                    userId,
                    subscriptionLevel,
                    subscriptionEndDate
                );
            }
            catch (Exception ex) when (ex is not DomainException)
            {
                await tx.RollbackAsync();
                _logger.LogError(
                    ex,
                    "Failed to process subscription.created for userId={UserId}, subscriptionId={SubscriptionId}",
                    userId,
                    subscription.Id
                );
                throw;
            }
        }

        /// <summary>
        /// Obsługuje aktualizację subskrypcji (odnowienie, zmiana statusu, etc.)
        /// </summary>
        /// <param name="stripeEvent"></param>
        /// <returns></returns>
        private async Task HandleSubscriptionUpdatedAsync(Stripe.Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null)
            {
                _logger.LogError(
                    "Invalid subscription object in webhook {EventId}",
                    stripeEvent.Id
                );
                return;
            }

            _logger.LogInformation(
                "Processing subscription.updated for subscriptionId={SubscriptionId}, status={Status}",
                subscription.Id,
                subscription.Status
            );

            var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(
                subscription.CustomerId
            );
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError(
                    "No userId found for customerId={CustomerId}",
                    subscription.CustomerId
                );
                return;
            }

            try
            {
                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                if (IsOtherThanTrackedSubscription(userBilling, subscription.Id))
                {
                    _logger.LogWarning(
                        "Ignoring subscription.updated for {SubscriptionId} – userId={UserId} tracks {TrackedSubscriptionId}",
                        subscription.Id,
                        userId,
                        userBilling.StripeSubscriptionId
                    );
                    return;
                }

                // Spóźniony event mógłby przywrócić nieaktualny status (np. Trialing po
                // anulowaniu) – zapisujemy aktualny stan ze Stripe
                subscription = await _stripeSubscriptions.GetAsync(subscription.Id);
                userBilling.SubscriptionStatus = MapStripeStatusToOurStatus(subscription.Status);

                if (subscription.Items?.Data?.Any() == true)
                {
                    userBilling.SubscriptionEndDate = subscription
                        .Items.Data.First()
                        .CurrentPeriodEnd;
                }

                if (
                    subscription.CancelAtPeriodEnd == true
                    && userBilling.SubscriptionStatus == SubscriptionStatus.Active
                )
                {
                    _logger.LogInformation(
                        "Subscription {SubscriptionId} for userId={UserId} will be canceled at period end: {EndDate}",
                        subscription.Id,
                        userId,
                        userBilling.SubscriptionEndDate
                    );
                }

                await _userBillingRepository.UpdateAsync(userBilling);

                _logger.LogInformation(
                    "Successfully updated subscription for userId={UserId}, newStatus={NewStatus}",
                    userId,
                    userBilling.SubscriptionStatus
                );
            }
            catch (Exception ex) when (ex is not DomainException)
            {
                _logger.LogError(
                    ex,
                    "Failed to process subscription.updated for userId={UserId}, subscriptionId={SubscriptionId}",
                    userId,
                    subscription.Id
                );
                throw;
            }
        }

        /// <summary>
        /// Obsługuje usunięcie/anulowanie subskrypcji w Stripe
        /// </summary>
        /// <param name="stripeEvent"></param>
        /// <returns></returns>
        private async Task HandleSubscriptionDeletedAsync(Stripe.Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (subscription == null)
                return;

            _logger.LogInformation(
                "Processing subscription.deleted for subscriptionId={SubscriptionId}",
                subscription.Id
            );

            var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(
                subscription.CustomerId
            );
            if (string.IsNullOrEmpty(userId))
                return;

            try
            {
                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                if (IsOtherThanTrackedSubscription(userBilling, subscription.Id))
                {
                    // Usunięcie starej subskrypcji nie może odebrać dostępu z bieżącej
                    _logger.LogWarning(
                        "Ignoring subscription.deleted for {SubscriptionId} – userId={UserId} tracks {TrackedSubscriptionId}",
                        subscription.Id,
                        userId,
                        userBilling.StripeSubscriptionId
                    );
                    return;
                }

                userBilling.SubscriptionStatus = SubscriptionStatus.Canceled;
                userBilling.SubscriptionLevel = SubscriptionLevel.None;
                userBilling.SubscriptionEndDate = DateTime.UtcNow;

                await _userBillingRepository.UpdateAsync(userBilling);

                _logger.LogInformation(
                    "Successfully canceled subscription for userId={UserId}",
                    userId
                );
            }
            catch (Exception ex) when (ex is not DomainException)
            {
                _logger.LogError(
                    ex,
                    "Failed to process subscription.deleted for userId={UserId}",
                    userId
                );
                throw;
            }
        }

        /// <summary>
        /// Obsługuje nieudaną płatność faktury
        /// </summary>
        private async Task HandleInvoicePaymentSucceededAsync(Stripe.Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Stripe.Invoice;
            if (invoice == null)
            {
                _logger.LogError("Invalid invoice object in webhook {EventId}", stripeEvent.Id);
                return;
            }

            var customerId = invoice.CustomerId;
            if (string.IsNullOrEmpty(customerId))
            {
                _logger.LogWarning("Invoice {InvoiceId} has no customerId. Skipping.", invoice.Id);
                return;
            }

            _logger.LogInformation(
                "Processing invoice.payment_succeeded for customerId={CustomerId}",
                customerId
            );

            try
            {
                var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(customerId);
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogError("No userId found for customerId={CustomerId}", customerId);
                    return;
                }

                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                await SyncTrackedSubscriptionAsync(userBilling);

                await _userBillingRepository.UpdateAsync(userBilling);

                _logger.LogInformation(
                    "Successfully processed invoice.payment_succeeded for userId={UserId}, newEndDate={EndDate}",
                    userId,
                    userBilling.SubscriptionEndDate
                );
            }
            catch (Exception ex) when (ex is not DomainException)
            {
                _logger.LogError(
                    ex,
                    "Failed to process invoice.payment_succeeded for customerId={CustomerId}",
                    customerId
                );
                throw;
            }
        }

        /// <summary>
        /// Faktury traktujemy wyłącznie jako sygnał do odświeżenia – status i koniec okresu bierzemy
        /// z aktualnej, śledzonej subskrypcji w Stripe. Spóźniona faktura (np. sprzed anulowania)
        /// nie może przywrócić dostępu, a faktura 0 zł przy starcie triala nie zmienia Trialing.
        /// </summary>
        private async Task SyncTrackedSubscriptionAsync(UserBilling userBilling)
        {
            if (string.IsNullOrEmpty(userBilling.StripeSubscriptionId))
                return;

            var subscription = await _stripeSubscriptions.GetAsync(
                userBilling.StripeSubscriptionId
            );
            userBilling.SubscriptionStatus = MapStripeStatusToOurStatus(subscription.Status);

            var item = subscription.Items?.Data?.FirstOrDefault();
            if (item is not null && item.CurrentPeriodEnd != default)
                userBilling.SubscriptionEndDate = item.CurrentPeriodEnd;
        }

        /// <summary>
        /// Mapuje status subskrypcji ze Stripe na nasze SubscriptionStatus enum
        /// </summary>
        private SubscriptionStatus MapStripeStatusToOurStatus(string stripeStatus)
        {
            return stripeStatus switch
            {
                "active" => SubscriptionStatus.Active,
                "trialing" => SubscriptionStatus.Trialing,
                "canceled" => SubscriptionStatus.Canceled,
                "past_due" => SubscriptionStatus.PastDue,
                "unpaid" => SubscriptionStatus.PastDue,
                "incomplete" => SubscriptionStatus.None,
                "incomplete_expired" => SubscriptionStatus.Canceled,
                _ => SubscriptionStatus.None,
            };
        }

        /// <summary>
        /// Określa poziom subskrypcji na podstawie danych ze Stripe
        /// </summary>
        private static bool IsOtherThanTrackedSubscription(
            UserBilling userBilling,
            string subscriptionId
        ) =>
            userBilling.StripeSubscriptionId is not null
            && userBilling.StripeSubscriptionId != subscriptionId;

        private SubscriptionLevel DetermineSubscriptionLevel(Stripe.Subscription subscription)
        {
            if (subscription.Metadata?.TryGetValue("subscriptionLevel", out var levelStr) == true)
            {
                if (Enum.TryParse<SubscriptionLevel>(levelStr, out var level))
                    return level;
            }

            if (subscription.Items?.Data?.Any() == true)
            {
                var priceId = subscription.Items.Data.First().Price.Id;
                var package = SubscriptionPackagesConfiguration.GetPackageByPriceId(priceId);
                if (package != null)
                    return package.Level;
            }

            return SubscriptionLevel.Monthly;
        }

        private async Task HandleInvoicePaymentFailedAsync(Stripe.Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Stripe.Invoice;
            if (invoice == null)
            {
                _logger.LogError("Invalid invoice object in webhook {EventId}", stripeEvent.Id);
                return;
            }

            var customerId = invoice.CustomerId;

            if (string.IsNullOrEmpty(customerId))
            {
                _logger.LogWarning(
                    "No customer found in failed invoice for webhook {EventId}",
                    stripeEvent.Id
                );
                return;
            }

            _logger.LogWarning(
                "Processing invoice.payment_failed for customerId={CustomerId}",
                customerId
            );

            try
            {
                var userId = await _userBillingRepository.GetUserIdByCustomerIdAsync(customerId);
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogError("No userId found for customerId={CustomerId}", customerId);
                    return;
                }

                var userBilling = await _userBillingRepository.GetByUserIdAsync(userId);

                await SyncTrackedSubscriptionAsync(userBilling);

                await _userBillingRepository.UpdateAsync(userBilling);

                _logger.LogWarning(
                    "Marked subscription as past due for userId={UserId}, customerId={CustomerId}",
                    userId,
                    customerId
                );
            }
            catch (Exception ex) when (ex is not DomainException)
            {
                _logger.LogError(
                    ex,
                    "Failed to process invoice.payment_failed for customerId={CustomerId}",
                    customerId
                );
                throw;
            }
        }
    }
}
