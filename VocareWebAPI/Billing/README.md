Płatności stripe - testowanie

1. Zainstaluj ngrok -> https://ngrok.com/docs/getting-started/?os=windows

zamiast komendy z docs do odpalenia użyj -> ngrok http https://localhost:5001 -host-header=localhost:5001

2. Konfiguracja Stripe

- Zaloguj się na dashboard Stripe: https://dashboard.stripe.com (włącz Test mode)
- Utwórz Produkt (Products → + Add product):
- Nazwa: Token Pack lub cokolwiek na co masz ochote
- Dodaj do produktu cennik (Pricing):
- Typ: Standard pricing
- Ceny: np. 50zł za 50 tokenów (jednorazowe)
- Skopiuj Price ID i wklej go do body endpointu którym wywołujesz płatności np:
  {
  "priceId": "price_1RDpyOLs2ndSVWb2TVahQNgY"
  }

3. Konfiguracja webhooków
   Przez Stripe Dashboard
   W Dashboard Stripe przejdź do Developers → Webhooks
   Dodaj nowy endpoint:
   URL: https://<your-ngrok>.ngrok.io/api/Billing/webhook
   Events to send: zaznacz checkout.session.completed, customer.subscription.created, customer.subscription.updated, invoice.payment_failed.

Testujemy w postmanie, żeby zasymulować płatność uzyj testowej karty 4242 4242 4242 4242, losowa przyszła data waznosci losowy CV
