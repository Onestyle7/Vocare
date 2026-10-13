import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';

/// Token prices of paid AI actions — same values as
/// `frontend/features/billing/constants.ts` and the `ServiceCosts` table.
abstract final class ServiceCosts {
  static const analyzeProfile = 60;
  static const marketAnalysis = 50;
  static const generateCv = 20;
  static const tailorCv = 20;
  static const analyzeCv = 10;
}

class AccessStatus {
  const AccessStatus({
    required this.tokenBalance,
    required this.subscriptionStatus,
  });

  final int tokenBalance;
  final String subscriptionStatus;

  bool get hasActiveSubscription => subscriptionStatus == 'Active';

  bool canAfford(int cost) => hasActiveSubscription || tokenBalance >= cost;
}

/// `/api/Billing/*`, read-only — purchases are out of scope on mobile.
class BillingRepository {
  const BillingRepository(this._api);

  final ApiClient _api;

  Future<ApiResult<AccessStatus>> accessStatus() => _api.get(
    '/api/Billing/access-status',
    decode: (j) {
      final json = j as Map;
      return AccessStatus(
        tokenBalance: (json['tokenBalance'] as num?)?.toInt() ?? 0,
        subscriptionStatus: '${json['subscriptionStatus'] ?? 'None'}',
      );
    },
  );
}

final billingRepositoryProvider = Provider<BillingRepository>(
  (ref) => BillingRepository(ref.watch(apiClientProvider)),
);
