import { forceLoginRedirect } from '@/features/auth/utils/login-redirect';
import { getPaymentHistoryQuery } from '@/features/billing/dal/queries';
import AttributesCard from '@/features/dashboard/components/attributes-card';
import ProgressDoubleCard from '@/features/dashboard/components/progress-double-card';
import SummaryCard from '@/features/dashboard/components/summary-card';
import TransactionCard from '@/features/dashboard/components/transaction-card';
import {
  getUserAttributesQuery,
  getUserProfileSummaryQuery,
} from '@/features/dashboard/dal/queries';
import {
  parsePaymentHistory,
  parseProfileAttributesForChart,
  parseProfileSummary,
} from '@/features/dashboard/dashboard-utils';

export default async function DashboardPage() {
  const [userProfileSummaryError, userProfileSummaryData] = await getUserProfileSummaryQuery();
  const [userAttibutesError, userAttributesData] = await getUserAttributesQuery();
  const [paymentError, paymentsData] = await getPaymentHistoryQuery(50);

  if (paymentError) {
    switch (paymentError.type) {
      case 'Unauthorized': {
        await forceLoginRedirect();
      }
      default: {
        throw new Error(paymentError.message);
      }
    }
  }

  if (userProfileSummaryError) {
    switch (userProfileSummaryError.type) {
      case 'Unauthorized': {
        await forceLoginRedirect();
        break;
      }
      case 'EmptyProfile': {
        break;
      }
      default: {
        throw new Error(userProfileSummaryError.message);
      }
    }
  }

  if (userAttibutesError) {
    switch (userAttibutesError.type) {
      case 'Unauthorized': {
        await forceLoginRedirect();
        break;
      }
      case 'EmptyProfile': {
        break;
      }
      default: {
        throw new Error(userAttibutesError.message);
      }
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-5 lg:grid-rows-[minmax(0,390px)_minmax(0,390px)] lg:overflow-hidden">
      <SummaryCard data={parseProfileSummary(userProfileSummaryData)} className="lg:col-span-2" />
      {/* TODO: To zajmuje długo - dodać loading.tsx albo rozbić na serverowy + kliencki i użyć suspense */}
      <AttributesCard
        data={parseProfileAttributesForChart(userAttributesData)}
        className="lg:col-span-3"
      />
      <ProgressDoubleCard
        profileCompletionPercentage={userProfileSummaryData?.profileCompletionPercentage || 0}
        salaryStats={userProfileSummaryData?.salaryProgressDto}
        className="lg:col-span-3"
      />
      <TransactionCard data={parsePaymentHistory(paymentsData)} className="lg:col-span-2" />
    </div>
  );
}
