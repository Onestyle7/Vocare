import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

class VocareApp extends ConsumerStatefulWidget {
  const VocareApp({super.key});

  @override
  ConsumerState<VocareApp> createState() => _VocareAppState();
}

class _VocareAppState extends ConsumerState<VocareApp> {
  StreamSubscription<Uri>? _links;

  @override
  void initState() {
    super.initState();
    // Password-reset e-mails link to `vocare.pl/reset-password?token=…` (or the
    // `vocare://reset-password` scheme); route them into the app.
    _links = AppLinks().uriLinkStream.listen(_handleLink);
  }

  void _handleLink(Uri uri) {
    final isReset =
        uri.host == 'reset-password' || uri.path.endsWith('/reset-password');
    if (!isReset) return;
    ref
        .read(routerProvider)
        .go(
          Uri(
            path: Routes.resetPassword,
            queryParameters: uri.queryParameters,
          ).toString(),
        );
  }

  @override
  void dispose() {
    _links?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Vocare',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: ref.watch(routerProvider),
      locale: const Locale('pl'),
      supportedLocales: const [Locale('pl')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
    );
  }
}
