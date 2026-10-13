import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_error.dart';
import '../../../core/network/result.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/feedback.dart';
import '../../../core/widgets/generating_view.dart';
import '../../../core/widgets/glass_widgets.dart';
import '../../billing/data/billing_repository.dart';
import '../../billing/presentation/service_cost_sheet.dart';
import '../../profile/data/profile_repository.dart';
import '../../shell/main_shell.dart';
import '../data/assistant_repository.dart';
import 'widgets/assistant_widgets.dart';

/// "Asystent" tab — AI career advisor (web: /dashboard/assistant).
class AssistantScreen extends ConsumerStatefulWidget {
  const AssistantScreen({super.key});

  @override
  ConsumerState<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends ConsumerState<AssistantScreen> {
  bool _generating = false;

  Future<void> _generate({required bool first}) async {
    final confirmed = await confirmServiceCost(
      context,
      title: first
          ? 'Wygenerować rekomendacje?'
          : 'Wygenerować nowe rekomendacje?',
      tokenCost: ServiceCosts.analyzeProfile,
      icon: Icons.work_outline_rounded,
    );
    if (!confirmed || !mounted) return;

    setState(() => _generating = true);
    final result = await ref.read(assistantProvider.notifier).generate();
    if (!mounted) return;
    setState(() => _generating = false);

    switch (result) {
      case Ok():
        showToast(
          context,
          first
              ? 'Rekomendacje zostały wygenerowane'
              : 'Nowe rekomendacje zostały wygenerowane',
          kind: ToastKind.success,
        );
      case Err(:final error):
        showToast(context, error.message, kind: ToastKind.error);
    }
  }

  Future<void> _refresh() async {
    ref.invalidate(profileProvider);
    await ref.read(assistantProvider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(profileProvider);
    final assistant = ref.watch(assistantProvider);

    final Widget body;
    if (_generating) {
      body = const GeneratingView.recommendations(key: ValueKey('generating'));
    } else if (profile.isLoading && !profile.hasValue ||
        assistant.isLoading && !assistant.hasValue) {
      body = const _Skeleton(key: ValueKey('loading'));
    } else if (profile.value?.hasRequiredFields != true && !profile.hasError) {
      body = AssistantNoProfile(
        key: const ValueKey('no-profile'),
        onOpenProfile: () => context.push(Routes.profile),
      );
    } else if (assistant case AsyncError(
      :final error,
    ) when !assistant.hasValue) {
      body = StateMessage(
        key: const ValueKey('error'),
        icon: Icons.cloud_off_rounded,
        title: 'Nie udało się wczytać rekomendacji',
        message: error is ApiError
            ? error.message
            : 'Spróbuj ponownie za chwilę.',
        actionLabel: 'Spróbuj ponownie',
        onAction: () => ref.invalidate(assistantProvider),
      );
    } else if (assistant.value?.recommendation == null) {
      body = AssistantNoRecommendation(
        key: const ValueKey('empty'),
        onGenerate: () => _generate(first: true),
      );
    } else {
      body = _Results(
        key: const ValueKey('results'),
        data: assistant.requireValue,
        onRegenerate: () => _generate(first: false),
      );
    }

    return RefreshIndicator.adaptive(
      edgeOffset: shellHeaderExtent(context),
      onRefresh: _refresh,
      notificationPredicate: (_) => !_generating,
      child: ListView(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.gutter,
          shellHeaderExtent(context) + 8,
          AppSpacing.gutter,
          shellBottomExtent(context),
        ),
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 350),
            child: body,
          ),
        ],
      ),
    );
  }
}

class _Results extends StatelessWidget {
  const _Results({super.key, required this.data, required this.onRegenerate});

  final AssistantData data;
  final VoidCallback onRegenerate;

  @override
  Widget build(BuildContext context) {
    final recommendation = data.recommendation!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const AdvisorBadge(),
        const SizedBox(height: 20),
        PrimaryRecommendationCard(recommendation: recommendation),
        if (recommendation.careerPaths.isNotEmpty) ...[
          const SizedBox(height: 28),
          const SectionHeader(title: 'Ścieżki kariery'),
          for (var i = 0; i < recommendation.careerPaths.length; i++) ...[
            CareerPathCard(
              path: recommendation.careerPaths[i],
              index: i,
              offerCount: data
                  .matchFor(recommendation.careerPaths[i])
                  ?.offers
                  .length,
              onTap: () => context.push(
                Routes.careerPath(recommendation.careerPaths[i].id),
                extra: i,
              ),
            ),
            const SizedBox(height: 12),
          ],
        ],
        const SizedBox(height: 16),
        RegenerateButton(onPressed: onRegenerate),
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
        SkeletonBox(height: 34, width: 160, radius: 999),
        SizedBox(height: 20),
        SkeletonBox(height: 260, radius: AppSpacing.cardRadius),
        SizedBox(height: 28),
        SkeletonBox(height: 170, radius: AppSpacing.cardRadius),
        SizedBox(height: 12),
        SkeletonBox(height: 170, radius: AppSpacing.cardRadius),
      ],
    );
  }
}
