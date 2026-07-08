using System.Text.Json;
using Microsoft.Extensions.Options;
using VocareWebAPI.Billing.Models.Enums;
using VocareWebAPI.Billing.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Exceptions;
using VocareWebAPI.CvGenerator.Models;
using VocareWebAPI.CvGenerator.Models.Dtos;
using VocareWebAPI.CvGenerator.Repositories.Interfaces;
using VocareWebAPI.CvGenerator.Services.Interfaces;
using VocareWebAPI.Repositories;
using VocareWebAPI.Shared.Results;

namespace VocareWebAPI.CvGenerator.Services.Implementation
{
    public class CvManagementService : ICvManagementService
    {
        private readonly IGeneratedCvRepository _cvRepository;
        private readonly ICvGenerationService _cvGenerationService;
        private readonly ILogger<CvManagementService> _logger;
        private readonly IUserBillingRepository _userBillingRepository;
        private readonly CvLimitsConfig _cvLimits;

        public CvManagementService(
            IGeneratedCvRepository cvRepository,
            ICvGenerationService cvGenerationService,
            ILogger<CvManagementService> logger,
            IUserBillingRepository userBillingRepository,
            IOptions<CvLimitsConfig> cvLimits
        )
        {
            _cvRepository = cvRepository;
            _cvGenerationService = cvGenerationService;
            _logger = logger;
            _userBillingRepository = userBillingRepository;
            _cvLimits = cvLimits.Value;
        }

        public async Task<List<CvListItemDto>> GetUserCvsAsync(string userId)
        {
            _logger.LogInformation("Getting CV list for user: {UserId}", userId);

            var cvs = await _cvRepository.GetUserCvsAsync(userId);

            return cvs.Select(cv => new CvListItemDto
                {
                    Id = cv.Id,
                    Name = cv.Name,
                    TargetPosition = cv.TargetPosition,
                    IsDefault = cv.IsDefault,
                    CreatedAt = cv.CreatedAt,
                    LastModifiedAt = cv.LastModifiedAt,
                    Version = cv.Version,
                    Notes = cv.Notes,
                })
                .ToList();
        }

        public async Task<CvDetailsDto> GetCvDetailsAsync(Guid cvId, string userId)
        {
            var cv = await _cvRepository.GetByIdAsync(cvId);
            if (cv == null)
                throw new CvNotFoundException(cvId);

            // Sprawdzamym, czy CV należy do użytkownika
            if (cv.UserId != userId)
                throw new CvAccessDeniedException(cvId);

            var cvData = JsonSerializer.Deserialize<CvDto>(
                cv.CvJson,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );

            return new CvDetailsDto
            {
                Id = cv.Id,
                Name = cv.Name,
                TargetPosition = cv.TargetPosition,
                CvData = cvData ?? new CvDto(),
                IsDefault = cv.IsDefault,
                CreatedAt = cv.CreatedAt,
                LastModifiedAt = cv.LastModifiedAt,
                Version = cv.Version,
                Notes = cv.Notes,
            };
        }

        public async Task<Result<CvDetailsDto>> CreateCvAsync(string userId, CreateCvDto createDto)
        {
            _logger.LogInformation("Creating new CV for user: {UserId}", userId);

            var currentCount = await _cvRepository.GetUserCvCountAsync(userId);
            var maxLimit = await GetMaxCvLimitAsync(userId);
            if (currentCount >= maxLimit)
            {
                return Result<CvDetailsDto>.Fail(
                    new Error("CV_LIMIT_REACHED", $"CV limit reached: {currentCount}/{maxLimit}.")
                );
            }

            CvDto cvData;

            if (createDto.CreateFromProfile)
            {
                // Generujemy CV na podstawie profilu użytkownika
                cvData = await _cvGenerationService.GenerateCvAsync(
                    userId,
                    createDto.TargetPosition
                );
            }
            else if (createDto.InitialData != null)
            {
                // Używamy dostarczonych danych
                cvData = createDto.InitialData;
            }
            else
            {
                // Tworzymy puste CV
                cvData = CreateEmptyCv();
            }

            var cvJson = JsonSerializer.Serialize(
                cvData,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );

            var generatedCv = new GeneratedCv
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = createDto.Name,
                TargetPosition = createDto.TargetPosition,
                CvJson = cvJson,
                Notes = createDto.Notes,
                IsDefault = false, // Nowe CV nie jest domyślnie ustawione jako default
            };

            // Jeśli to pierwsze CV użytkownika, ustaw jako domyślne
            var existingCvsCount = await _cvRepository.GetUserCvCountAsync(userId);
            if (existingCvsCount == 0)
            {
                generatedCv.IsDefault = true;
            }

            var savedCv = await _cvRepository.AddAsync(generatedCv);

            return Result<CvDetailsDto>.Ok(
                new CvDetailsDto
                {
                    Id = savedCv.Id,
                    Name = savedCv.Name,
                    TargetPosition = savedCv.TargetPosition,
                    CvData = cvData,
                    IsDefault = savedCv.IsDefault,
                    CreatedAt = savedCv.CreatedAt,
                    LastModifiedAt = savedCv.LastModifiedAt,
                    Version = savedCv.Version,
                    Notes = savedCv.Notes,
                }
            );
        }

        public async Task<CvDetailsDto> UpdateCvAsync(string userId, UpdateCvDto updateDto)
        {
            _logger.LogInformation("Updating CV: {CvId} for user: {UserId}", updateDto.Id, userId);

            var cv = await _cvRepository.GetByIdAsync(updateDto.Id);
            if (cv == null)
                throw new CvNotFoundException(updateDto.Id);

            if (cv.UserId != userId)
                throw new CvAccessDeniedException(updateDto.Id);

            // Aktualizujemy dane
            cv.Name = updateDto.Name;
            cv.TargetPosition = updateDto.TargetPosition;
            cv.Notes = updateDto.Notes;
            cv.CvJson = JsonSerializer.Serialize(
                updateDto.CvData,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );

            var updatedCv = await _cvRepository.UpdateAsync(cv);

            return new CvDetailsDto
            {
                Id = updatedCv.Id,
                Name = updatedCv.Name,
                TargetPosition = updatedCv.TargetPosition,
                CvData = updateDto.CvData,
                IsDefault = updatedCv.IsDefault,
                CreatedAt = updatedCv.CreatedAt,
                LastModifiedAt = updatedCv.LastModifiedAt,
                Version = updatedCv.Version,
                Notes = updatedCv.Notes,
            };
        }

        public async Task DeleteCvAsync(Guid cvId, string userId)
        {
            _logger.LogInformation("Deleting CV: {CvId} for user: {UserId}", cvId, userId);

            var cv = await _cvRepository.GetByIdAsync(cvId);
            if (cv == null)
                throw new CvNotFoundException(cvId);

            if (cv.UserId != userId)
                throw new CvAccessDeniedException(cvId);

            // Jeśli usuwamy domyślne CV, musimy ustawić inne jako domyślne
            if (cv.IsDefault)
            {
                var userCvs = await _cvRepository.GetUserCvsAsync(userId);
                var otherCv = userCvs.FirstOrDefault(c => c.Id != cvId);
                if (otherCv != null)
                {
                    await _cvRepository.SetDefaultAsync(otherCv.Id, userId);
                }
            }

            await _cvRepository.DeactivateAsync(cvId);
        }

        public async Task SetDefaultCvAsync(string userId, Guid cvId)
        {
            _logger.LogInformation("Setting default CV: {CvId} for user: {UserId}", cvId, userId);

            if (!await _cvRepository.BelongsToUserAsync(cvId, userId))
                throw new CvAccessDeniedException(cvId);

            await _cvRepository.SetDefaultAsync(cvId, userId);
        }

        public async Task<bool> CanCreateNewCvAsync(string userId)
        {
            var currentCount = await _cvRepository.GetUserCvCountAsync(userId);
            var maxLimit = await GetMaxCvLimitAsync(userId);

            return currentCount < maxLimit;
        }

        public async Task<int> GetMaxCvLimitAsync(string userId)
        {
            var billing = await _userBillingRepository.GetByUserIdAsync(userId);

            if (billing?.SubscriptionStatus == SubscriptionStatus.Active)
            {
                return _cvLimits.PremiumTierLimit;
            }

            return _cvLimits.FreeTierLimit;
        }

        private CvDto CreateEmptyCv()
        {
            return new CvDto
            {
                Basics = new CvBasicsDto
                {
                    FirstName = string.Empty,
                    LastName = string.Empty,
                    Email = string.Empty,
                    PhoneNumber = string.Empty,
                    Summary = string.Empty,
                    Location = new CvLocationDto { City = string.Empty, Country = string.Empty },
                },
                Work = new List<CvWorkEntryDto>(),
                Education = new List<CvEducationEntryDto>(),
                Certificates = new List<CvCertificateEntryDto>(),
                Skills = new List<string>(),
                Languages = new List<CvLanguageEntryDto>(),
                Projects = new List<CvProjectDto>(),
                Social = new List<CvSocialDto>(),
            };
        }
    }
}