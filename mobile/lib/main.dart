import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/glass/liquid_glass.dart';
import 'core/providers.dart';
import 'core/storage/token_store.dart';
import 'core/theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(AppTheme.overlayStyle);
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  final tokenStore = TokenStore();
  final (prefs, _, _, _) = await (
    SharedPreferences.getInstance(),
    tokenStore.load(),
    LiquidGlassSupport.init(),
    initializeDateFormatting('pl'),
  ).wait;

  // The shader fallback is only needed where native Liquid Glass isn't.
  if (!LiquidGlassSupport.isNative) {
    await LiquidGlassWidgets.initialize(enablePerformanceMonitor: false);
  }

  runApp(
    ProviderScope(
      overrides: [
        tokenStoreProvider.overrideWithValue(tokenStore),
        preferencesProvider.overrideWithValue(prefs),
      ],
      child: LiquidGlassWidgets.wrap(
        adaptiveQuality: true,
        brightnessResolver: Theme.maybeBrightnessOf,
        child: const VocareApp(),
      ),
    ),
  );
}
