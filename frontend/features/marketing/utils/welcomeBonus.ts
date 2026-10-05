import type { GiveMarketingConsentResponse, WelcomeBonusStatus } from '../dal/api';

export type WelcomeBonus = {
  status: WelcomeBonusStatus;
  amount: number;
};

const polishPluralRules = new Intl.PluralRules('pl-PL');

const TOKEN_FORMS: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: 'token',
  few: 'tokeny',
};

// Kwota zależy od configu środowiska (WelcomeTokens), więc odmieniamy ją dynamicznie
const formatTokens = (count: number) =>
  `${count} ${TOKEN_FORMS[polishPluralRules.select(count)] ?? 'tokenów'}`;

// AlreadyClaimed (stare konto lub ponowna zgoda po wycofaniu), Disabled i Failed
// celowo nie wspominają o tokenach
export function getMarketingConsentToastMessage(
  response: Partial<GiveMarketingConsentResponse> | null
) {
  switch (response?.welcomeBonusStatus) {
    case 'Granted': {
      return `Zgody marketingowe włączone, przyznano ${formatTokens(response.welcomeTokensGranted ?? 0)}. Będziemy w kontakcie!`;
    }
    case 'Pending': {
      return 'Zgody marketingowe włączone. Tokeny pojawią się na koncie za chwilę.';
    }
    default: {
      return 'Zgody marketingowe włączone. Będziemy w kontakcie!';
    }
  }
}

export function getRegistrationToastMessage(welcomeBonus: WelcomeBonus | null) {
  switch (welcomeBonus?.status) {
    case 'Granted': {
      return `Rejestracja ukończona, przyznano ${formatTokens(welcomeBonus.amount)}`;
    }
    case 'Pending': {
      return 'Rejestracja ukończona. Tokeny pojawią się na koncie za chwilę.';
    }
    default: {
      return 'Rejestracja ukończona';
    }
  }
}
