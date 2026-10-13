import 'dart:io';

import 'package:integration_test/integration_test_driver_extended.dart';

/// Saves `binding.takeScreenshot` captures to build/screenshots/.
Future<void> main() => integrationDriver(
  onScreenshot: (name, bytes, [args]) async {
    File('build/screenshots/$name.png')
      ..createSync(recursive: true)
      ..writeAsBytesSync(bytes);
    return true;
  },
);
