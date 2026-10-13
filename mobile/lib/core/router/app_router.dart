import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/assistant/presentation/assistant_screen.dart';
import '../../features/assistant/presentation/career_path_screen.dart';
import '../../features/auth/application/session_controller.dart';
import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/auth/presentation/reset_password_screen.dart';
import '../../features/auth/presentation/sign_in_screen.dart';
import '../../features/auth/presentation/sign_up_screen.dart';
import '../../features/cv/presentation/cv_analysis_screen.dart';
import '../../features/cv/presentation/cv_editor_screen.dart';
import '../../features/cv/presentation/cv_list_screen.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/legal/presentation/consents_screen.dart';
import '../../features/market/presentation/market_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/onboarding/onboarding_state.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/roadmap/presentation/roadmap_detail_screen.dart';
import '../../features/roadmap/presentation/roadmap_list_screen.dart';
import '../../features/shell/main_shell.dart';
import '../../features/splash/splash_screen.dart';

abstract final class Routes {
  static const splash = '/splash';
  static const onboarding = '/onboarding';
  static const signIn = '/sign-in';
  static const signUp = '/sign-up';
  static const forgotPassword = '/forgot-password';
  static const resetPassword = '/reset-password';
  static const consents = '/consents';
  static const home = '/home';
  static const market = '/market';
  static const roadmap = '/roadmap';
  static const assistant = '/assistant';
  static const cv = '/cv';
  static const profile = '/profile';
  static const notifications = '/notifications';
  static String careerPath(String id) => '/career-path/$id';
  static String roadmapDetails(String id) => '/roadmaps/$id';
  static String cvEditor(String id) => '/cvs/$id';
  static String cvAnalysis(String id) => '/cvs/$id/analysis';

  static const _public = {signIn, signUp, forgotPassword, resetPassword};
}

/// Where a session should land; the splash screen uses it after its intro.
String landingFor(SessionState session, {required bool onboardingSeen}) {
  return switch (session.status) {
    SessionStatus.signedIn => Routes.home,
    SessionStatus.consentsRequired => Routes.consents,
    SessionStatus.signedOut =>
      onboardingSeen ? Routes.signIn : Routes.onboarding,
  };
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefresh(ref);
  ref.onDispose(refresh.dispose);

  final router = GoRouter(
    initialLocation: Routes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final location = state.matchedLocation;
      if (location == Routes.splash) return null;

      final session = ref.read(sessionProvider);
      final onboardingSeen = ref.read(onboardingSeenProvider);

      switch (session.status) {
        case SessionStatus.signedOut:
          if (location == Routes.onboarding) return null;
          if (!onboardingSeen && location != Routes.resetPassword) {
            return Routes.onboarding;
          }
          return Routes._public.contains(location) ? null : Routes.signIn;
        case SessionStatus.consentsRequired:
          return location == Routes.consents ? null : Routes.consents;
        case SessionStatus.signedIn:
          final onEntry =
              Routes._public.contains(location) ||
              location == Routes.onboarding ||
              location == Routes.consents;
          // A password-reset link stays reachable while signed in.
          if (location == Routes.resetPassword) return null;
          return onEntry ? Routes.home : null;
      }
    },
    routes: [
      GoRoute(path: Routes.splash, builder: (_, _) => const SplashScreen()),
      GoRoute(
        path: Routes.onboarding,
        pageBuilder: (_, state) => _fade(state, const OnboardingScreen()),
      ),
      GoRoute(
        path: Routes.signIn,
        pageBuilder: (_, state) => _fade(state, const SignInScreen()),
      ),
      GoRoute(path: Routes.signUp, builder: (_, _) => const SignUpScreen()),
      GoRoute(
        path: Routes.forgotPassword,
        builder: (_, _) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: Routes.resetPassword,
        builder: (_, state) => ResetPasswordScreen(
          token: state.uri.queryParameters['token'] ?? '',
          email: state.uri.queryParameters['email'] ?? '',
        ),
      ),
      GoRoute(
        path: Routes.consents,
        pageBuilder: (_, state) => _fade(state, const ConsentsScreen()),
      ),
      StatefulShellRoute.indexedStack(
        pageBuilder: (_, state, shell) => _fade(state, MainShell(shell: shell)),
        branches: [
          _branch(Routes.home, const DashboardScreen()),
          _branch(Routes.market, const MarketScreen()),
          _branch(Routes.roadmap, const RoadmapListScreen()),
          _branch(Routes.assistant, const AssistantScreen()),
          _branch(Routes.cv, const CvListScreen()),
        ],
      ),
      GoRoute(path: Routes.profile, builder: (_, _) => const ProfileScreen()),
      GoRoute(
        path: '/roadmaps/:id',
        builder: (_, state) =>
            RoadmapDetailScreen(roadmapId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/career-path/:id',
        builder: (_, state) => CareerPathScreen(
          pathId: state.pathParameters['id']!,
          index: state.extra is int ? state.extra! as int : null,
        ),
      ),
      GoRoute(
        path: '/cvs/:id',
        builder: (_, state) => CvEditorScreen(
          cvId: state.pathParameters['id']!,
          // `true` when a freshly tailored copy opens on its preview.
          startInPreview: state.extra == true,
        ),
        routes: [
          GoRoute(
            path: 'analysis',
            // Slides up like a sheet; closes back into the editor.
            pageBuilder: (_, state) => MaterialPage<AuditJump>(
              key: state.pageKey,
              fullscreenDialog: true,
              child: CvAnalysisScreen(cvId: state.pathParameters['id']!),
            ),
          ),
        ],
      ),
      GoRoute(
        path: Routes.notifications,
        builder: (_, _) => const NotificationsScreen(),
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});

StatefulShellBranch _branch(String path, Widget screen) => StatefulShellBranch(
  routes: [GoRoute(path: path, builder: (_, _) => screen)],
);

CustomTransitionPage<void> _fade(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 420),
    transitionsBuilder: (_, animation, _, child) => FadeTransition(
      opacity: CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
      child: child,
    ),
  );
}

/// Bridges Riverpod state into go_router's `refreshListenable`.
class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(Ref ref) {
    ref.listen(sessionProvider, (previous, next) {
      if (previous?.status != next.status) notifyListeners();
    });
    ref.listen(onboardingSeenProvider, (_, _) => notifyListeners());
  }
}
