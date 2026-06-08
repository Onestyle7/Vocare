import { BriefcaseBusinessIcon, FileCheck, Map, TrendingUp } from 'lucide-react';

import { PaymentHistoryItem } from '@/features/billing/dal/api';
import AttributesCard from '@/features/dashboard/components/attributes-card';
import ProgressDoubleCard from '@/features/dashboard/components/progress-double-card';
import SummaryCard from '@/features/dashboard/components/summary-card';
import TransactionCard from '@/features/dashboard/components/transaction-card';

export const PROFILE_SUMMARY_MOCK = [
  {
    icon: BriefcaseBusinessIcon,
    name: 'Rekomendacje',
    value: 67,
  },
  {
    icon: TrendingUp,
    name: 'Analizy',
    value: 123,
  },
  {
    icon: Map,
    name: 'Roadmapy',
    value: 67,
  },
  {
    icon: FileCheck,
    name: 'CV',
    value: 67,
  },
];

export const PAYMENT_HISTORY_MOCK: PaymentHistoryItem[] = [
  {
    type: 'Zakup pro',
    amount: 26,
    currency: 'zł',
    status: 'succesful',
    createdAt: new Date().toISOString(),
    description: null,
    tokenAmount: null,
  },
  {
    type: 'Zakup tokenów',
    amount: 10,
    currency: 'zł',
    status: 'succesful',
    createdAt: new Date().toISOString(),
    description: null,
    tokenAmount: null,
  },
  {
    type: 'Zakup tokenów',
    amount: 15,
    currency: 'zł',
    status: 'succesful',
    createdAt: new Date().toISOString(),
    description: null,
    tokenAmount: null,
  },
];

export const PROFILE_ATTRIBUTES_MOCK = [
  { attribute: 'Doświadczenie praktyczne', score: 85 },
  { attribute: 'Kompetencje twarde', score: 90 },
  { attribute: 'Kreatywność', score: 65 },
  { attribute: 'Zespół', score: 70 },
  { attribute: 'Samodzielność', score: 95 },
  { attribute: 'Kompetencje miękkie', score: 75 },
  { attribute: 'Certyfikacja', score: 50 },
  { attribute: 'Umiejętności techniczne', score: 80 },
];

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-5 lg:grid-rows-[minmax(0,390px)_minmax(0,390px)] lg:overflow-hidden">
      <SummaryCard data={PROFILE_SUMMARY_MOCK} className="lg:col-span-2" />
      <AttributesCard data={PROFILE_ATTRIBUTES_MOCK} className="lg:col-span-3" />
      <ProgressDoubleCard className="lg:col-span-3" />
      <TransactionCard data={PAYMENT_HISTORY_MOCK} className="lg:col-span-2" />
    </div>
  );
}
