// Jedno źródło danych identyfikujących Usługodawcę i wersji dokumentów prawnych.
// Regulamin, polityka prywatności, stopka i checkout czytają je stąd.

export const SERVICE_PROVIDER = {
  name: 'Kacper Jóźwik',
  email: 'kontakt@vocare.pl',
  // TODO(prawne): adres do doręczeń jest wymagany przez art. 5 ust. 2 pkt 1 UŚUDE
  // i art. 12 ust. 1 pkt 2 UoPK. Uzupełnić przed publikacją nowej wersji regulaminu.
  address: null as string | null,
} as const;

// publishedDate – dzień publikacji; od niego regulamin wiąże nowe umowy.
// effectiveDate – od tego dnia wiąże dotychczasowych Użytkowników; co najmniej 14 dni po mailingu
// z informacją o zmianach (§ 18 ust. 2). Obie daty ustawić przy wdrożeniu – razem z datami
// w termsOfService20251222Validity i w migracji LegalDocuments w backendzie.
export const TERMS_VERSION = {
  publishedDate: '13.10.2026',
  effectiveDate: '28.10.2026',
  previousVersion: { effectiveDate: '22.12.2025', href: '/terms-of-service/2025-12-22' },
} as const;

export const PRIVACY_POLICY_LAST_UPDATED = '13 października 2026 r.';
