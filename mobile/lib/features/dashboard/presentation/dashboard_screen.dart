import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_error.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../notifications/data/notifications_repository.dart';
import '../../profile/data/profile_repository.dart';
import '../../profile/presentation/cv_import.dart';
import '../../shell/main_shell.dart';
import '../data/dashboard_repository.dart';
import 'widgets/dashboard_cards.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref
      ..invalidate(profileProvider)
      ..invalidate(unreadNotificationsProvider);
    await ref
        .refresh(dashboardProvider.future)
        .catchError((_) => const DashboardData());
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);
    final top = shellHeaderExtent(context);

    return RefreshIndicator.adaptive(
      edgeOffset: top,
      onRefresh: () => _refresh(ref),
      child: ListView(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.gutter,
          top + 8,
          AppSpacing.gutter,
          shellBottomExtent(context),
        ),
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 350),
            child: switch (dashboard) {
              AsyncData(:final value) => _Content(
                key: const ValueKey('data'),
                data: value,
              ),
              AsyncError(:final error) => StateMessage(
                key: const ValueKey('error'),
                icon: Icons.cloud_off_rounded,
                title: 'Nie udało się wczytać pulpitu',
                message: error is ApiError
                    ? error.message
                    : 'Spróbuj ponownie za chwilę.',
                actionLabel: 'Spróbuj ponownie',
                onAction: () => ref.invalidate(dashboardProvider),
              ),
              _ => const _Skeleton(key: ValueKey('loading')),
            },
          ),
        ],
      ),
    );
  }
}

class _Content extends ConsumerWidget {
  const _Content({super.key, required this.data});

  final DashboardData data;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = data.summary;
    if (summary == null) {
      return StartProfileCard(
        onFillProfile: () => context.push(Routes.profile),
        onImportCv: () => importCvFlow(context, ref),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ProfileAndBalanceRow(
          completion: summary.profileCompletion,
          access: data.access,
          onOpenProfile: () => context.push(Routes.profile),
        ),
        const SizedBox(height: 28),
        SectionHeader(
          title: 'Twoje postępy',
          trailing: JourneyProgress(summary: summary),
        ),
        JourneyCard(summary: summary),
        if (data.attributes case final attributes?
            when attributes.any((a) => a.score > 0)) ...[
          const SizedBox(height: 28),
          const SectionHeader(title: 'Atrybuty profilu'),
          AttributesRadarCard(attributes: attributes),
        ],
        const SizedBox(height: 28),
        const SectionHeader(title: 'Postęp w wynagrodzeniu'),
        SalaryProgressCard(salary: summary.salary),
      ],
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Row(
          children: [
            Expanded(
              child: SkeletonBox(height: 200, radius: AppSpacing.cardRadius),
            ),
            SizedBox(width: 12),
            Expanded(
              child: SkeletonBox(height: 200, radius: AppSpacing.cardRadius),
            ),
          ],
        ),
        SizedBox(height: 28),
        SkeletonBox(height: 300, radius: AppSpacing.cardRadius),
      ],
    );
  }
}
