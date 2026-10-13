import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../data/notifications_repository.dart';

final _notificationsProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) async {
      return switch (await ref.watch(notificationsRepositoryProvider).list()) {
        Ok(:final value) => value,
        Err(:final error) => throw error,
      };
    });

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  /// Read locally right away; the server call happens in the background.
  final _readIds = <String>{};

  void _open(AppNotification n) {
    _markRead(n);
    final roadmapId = n.relatedEntityId;
    if (roadmapId != null && n.kind != NotificationKind.other) {
      context.push(Routes.roadmapDetails(roadmapId));
    }
  }

  void _markRead(AppNotification n) {
    if (n.isRead || _readIds.contains(n.id)) return;
    setState(() => _readIds.add(n.id));
    ref.read(notificationsRepositoryProvider).markRead(n.id).then((_) {
      ref.invalidate(unreadNotificationsProvider);
    });
  }

  @override
  Widget build(BuildContext context) {
    final notifications = ref.watch(_notificationsProvider);
    final top = MediaQuery.paddingOf(context).top;

    return Scaffold(
      body: Stack(
        children: [
          RefreshIndicator.adaptive(
            edgeOffset: top + 72,
            onRefresh: () => ref
                .refresh(_notificationsProvider.future)
                .catchError((_) => <AppNotification>[]),
            child: switch (notifications) {
              AsyncData(:final value) when value.isEmpty => ListView(
                children: [
                  SizedBox(height: top + 140),
                  const StateMessage(
                    icon: Icons.notifications_none_rounded,
                    title: 'Wszystko przeczytane',
                    message:
                        'Tu pojawią się informacje o gotowych roadmapach i nowych ofertach.',
                  ),
                ],
              ),
              AsyncData(:final value) => ListView.separated(
                padding: EdgeInsets.fromLTRB(
                  AppSpacing.gutter,
                  top + 80,
                  AppSpacing.gutter,
                  MediaQuery.paddingOf(context).bottom + 24,
                ),
                itemCount: value.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final n = value[i];
                  final read = n.isRead || _readIds.contains(n.id);
                  return _NotificationTile(
                    notification: n,
                    read: read,
                    onTap: () => _open(n),
                  );
                },
              ),
              AsyncError(:final error) => ListView(
                children: [
                  SizedBox(height: top + 120),
                  StateMessage(
                    icon: Icons.cloud_off_rounded,
                    title: 'Nie udało się wczytać powiadomień',
                    message: error is ApiError
                        ? error.message
                        : 'Spróbuj ponownie za chwilę.',
                    actionLabel: 'Spróbuj ponownie',
                    onAction: () => ref.invalidate(_notificationsProvider),
                  ),
                ],
              ),
              _ => const Center(child: CircularProgressIndicator.adaptive()),
            },
          ),
          TopScrollFade(height: top + AppSpacing.navButton + 36),
          Positioned(
            top: top + 8,
            left: AppSpacing.gutter,
            right: AppSpacing.gutter,
            child: Row(
              children: [
                const GlassBackButton(),
                const SizedBox(width: 14),
                Text('Powiadomienia', style: AppTypography.title),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.read,
    required this.onTap,
  });

  final AppNotification notification;
  final bool read;
  final VoidCallback onTap;

  static final _date = DateFormat('d MMM, HH:mm', 'pl');

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (notification.kind) {
      NotificationKind.roadmapCompleted => (
        Icons.map_outlined,
        AppColors.success,
      ),
      NotificationKind.roadmapFailed => (
        Icons.error_outline_rounded,
        AppColors.danger,
      ),
      NotificationKind.other => (
        Icons.notifications_none_rounded,
        AppColors.accent,
      ),
    };
    return SurfaceCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withValues(alpha: 0.14),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notification.title,
                        style: AppTypography.button.copyWith(
                          height: 1.4,
                          fontWeight: read ? FontWeight.w400 : FontWeight.w500,
                        ),
                      ),
                    ),
                    if (!read)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.brandGradient,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  notification.message,
                  style: AppTypography.caption.copyWith(
                    height: 1.5,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _date.format(notification.createdAt),
                  style: AppTypography.label.copyWith(fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
