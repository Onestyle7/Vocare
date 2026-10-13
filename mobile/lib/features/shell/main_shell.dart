import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/app_icon.dart';
import '../../core/widgets/glass_widgets.dart';
import '../auth/application/session_controller.dart';
import '../legal/presentation/ai_consent_sheet.dart';
import '../notifications/data/notifications_repository.dart';
import '../profile/data/profile_repository.dart';
import 'glass_tab_bar.dart';

const _tabs = [
  GlassTab(label: 'Pulpit', icon: TabIcons.dashboard),
  GlassTab(label: 'Analiza rynku', icon: TabIcons.trending),
  GlassTab(label: 'Roadmapa', icon: TabIcons.map),
  GlassTab(label: 'Asystent', icon: TabIcons.assistant),
  GlassTab(label: 'CV', icon: TabIcons.cv),
];

/// Height of the floating header, used by tabs to pad their content.
double shellHeaderExtent(BuildContext context) =>
    MediaQuery.paddingOf(context).top + AppSpacing.headerButton + 20;

/// Bottom padding tabs need so content can scroll above the tab bar.
double shellBottomExtent(BuildContext context) =>
    MediaQuery.paddingOf(context).bottom + GlassTabBar.height + 36;

/// Floating chrome around the five tabs: glass header + glass tab bar, with
/// content scrolling underneath both (the iOS 26 layering).
class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final padding = MediaQuery.paddingOf(context);

    return AiConsentLaunchPrompt(
      child: Scaffold(
        body: Stack(
          children: [
            Positioned.fill(child: shell),
            TopScrollFade(height: shellHeaderExtent(context) + 28),
            Positioned(
              top: padding.top + 10,
              left: AppSpacing.gutter,
              right: AppSpacing.gutter,
              child: _Header(index: shell.currentIndex),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: (padding.bottom > 0 ? padding.bottom : 16) + 12,
              child: Center(
                child: GlassTabBar(
                  tabs: _tabs,
                  currentIndex: shell.currentIndex,
                  onSelect: (i) => shell.goBranch(
                    i,
                    initialLocation: i == shell.currentIndex,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends ConsumerWidget {
  const _Header({required this.index});

  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider).value;
    final email = ref.watch(sessionProvider.select((s) => s.email));
    final unread = ref.watch(unreadNotificationsProvider).value ?? 0;

    final name = profile?.firstName.isNotEmpty == true
        ? profile!.firstName
        : email?.split('@').first;
    final title = index == 0
        ? (name == null || name.isEmpty ? 'Cześć!' : 'Cześć, $name')
        : _tabs[index].label;

    return Row(
      children: [
        GlassIconButton(
          semanticLabel: 'Profil',
          onPressed: () => context.push(Routes.profile),
          child: profile != null && profile.initials.isNotEmpty
              ? Text(profile.initials, style: AppTypography.button)
              : const AppIcon(AppIcons.user, size: 24),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            layoutBuilder: (current, previous) => Stack(
              alignment: Alignment.centerLeft,
              children: [...previous, ?current],
            ),
            child: Text(
              title,
              key: ValueKey(title),
              style: AppTypography.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
        GlassIconButton(
          semanticLabel: unread > 0
              ? 'Powiadomienia, $unread nowych'
              : 'Powiadomienia',
          badge: unread > 0,
          onPressed: () => context.push(Routes.notifications),
          child: const AppIcon(AppIcons.bell, size: 24),
        ),
      ],
    );
  }
}
