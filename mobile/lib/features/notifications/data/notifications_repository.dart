import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';

enum NotificationKind { roadmapCompleted, roadmapFailed, other }

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.kind,
    required this.isRead,
    required this.createdAt,
    this.relatedEntityId,
  });

  final String id;
  final String title;
  final String message;
  final NotificationKind kind;
  final bool isRead;
  final DateTime createdAt;
  final String? relatedEntityId;

  AppNotification markedRead() => AppNotification(
    id: id,
    title: title,
    message: message,
    kind: kind,
    isRead: true,
    createdAt: createdAt,
    relatedEntityId: relatedEntityId,
  );

  factory AppNotification.fromJson(Map json) => AppNotification(
    id: '${json['id']}',
    title: '${json['title'] ?? ''}',
    message: '${json['message'] ?? ''}',
    kind: switch ('${json['type']}') {
      'RoadmapGenerationCompleted' || '0' => NotificationKind.roadmapCompleted,
      'RoadmapGenerationFailed' || '1' => NotificationKind.roadmapFailed,
      _ => NotificationKind.other,
    },
    isRead: json['isRead'] == true,
    createdAt:
        DateTime.tryParse('${json['createdAt']}')?.toLocal() ?? DateTime.now(),
    relatedEntityId: json['relatedEntityId'] as String?,
  );
}

class NotificationsRepository {
  const NotificationsRepository(this._api);

  final ApiClient _api;

  Future<ApiResult<int>> unreadCount() => _api.get(
    '/api/Notification/unread-count',
    decode: (j) => ((j as Map)['unreadCount'] as num?)?.toInt() ?? 0,
  );

  Future<ApiResult<List<AppNotification>>> list({
    int page = 1,
    int pageSize = 30,
  }) => _api.get(
    '/api/Notification/user-notifications',
    query: {'page': page, 'pageSize': pageSize},
    decode: (j) => (j as List? ?? const [])
        .whereType<Map>()
        .map(AppNotification.fromJson)
        .toList(),
  );

  Future<ApiResult<void>> markRead(String id) =>
      _api.patch('/api/Notification/$id/read', decode: (_) {});
}

final notificationsRepositoryProvider = Provider<NotificationsRepository>(
  (ref) => NotificationsRepository(ref.watch(apiClientProvider)),
);

final unreadNotificationsProvider = FutureProvider<int>((ref) async {
  ref.watch(sessionProvider.select((s) => s.userId));
  final result = await ref.watch(notificationsRepositoryProvider).unreadCount();
  return result.valueOrNull ?? 0;
});
