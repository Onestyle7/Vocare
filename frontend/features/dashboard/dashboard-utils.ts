import { BriefcaseBusinessIcon, FileCheck, Map, TrendingUp } from 'lucide-react';

import { PaymentHistoryResult } from '../billing/dal/api';
import { UserAttributesResult, UserProfileSummaryResult } from './dal/api';

export function parseProfileSummary(profileSummaryResult?: UserProfileSummaryResult | null) {
  if (!profileSummaryResult) return null;

  const { recommendationsCount, analysisCount, roadmapsCount, cvsCount } = profileSummaryResult;
  return [
    {
      icon: BriefcaseBusinessIcon,
      name: 'Wygenerowane aekomendacje',
      value: recommendationsCount,
    },
    {
      icon: TrendingUp,
      name: 'Wygenerowane analizy',
      value: analysisCount,
    },
    {
      icon: Map,
      name: 'Utworzone roadmapy',
      value: roadmapsCount,
    },
    {
      icon: FileCheck,
      name: 'Utworzone CV',
      value: cvsCount,
    },
  ];
}

export function parseProfileAttributesForChart(
  profileAttributesResult?: UserAttributesResult | null
) {
  if (!profileAttributesResult) return null;

  const {
    certification,
    hardCompetencies,
    creativity,
    independence,
    practicalExperience,
    softCompetencies,
    teamwork,
    technicalSkills,
  } = profileAttributesResult;

  return [
    { attribute: 'Doświadczenie praktyczne', score: practicalExperience },
    { attribute: 'Kompetencje twarde', score: hardCompetencies },
    { attribute: 'Kreatywność', score: creativity },
    { attribute: 'Zespół', score: teamwork },
    { attribute: 'Samodzielność', score: independence },
    { attribute: 'Kompetencje miękkie', score: softCompetencies },
    { attribute: 'Certyfikacja', score: certification },
    { attribute: 'Umiejętności techniczne', score: technicalSkills },
  ];
}

export function parsePaymentHistory(paymentHistoryResult: PaymentHistoryResult) {
  return paymentHistoryResult.payments;
}
