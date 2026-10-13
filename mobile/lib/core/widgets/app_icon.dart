import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Icons exported from Figma (`assets/icons`). Several are exported with their
/// 62pt tab frame, so callers size them by the frame, not the glyph.
enum AppIcons {
  sms('sms'),
  lock('lock'),
  user('user'),
  bell('bell'),
  trendingUp('trending_up'),
  map('map'),
  briefcase('briefcase'),
  cv('cv'),
  backButton('back_button'),
  linkedIn('linkedin'),
  marketSalary('market_wynagrodzenie'),
  marketWorkStyle('market_styl_pracy'),
  marketEntry('market_wejscie'),
  marketMotivation('market_motywacja'),
  marketRecommendation('market_rekomendacje'),
  dots('dots');

  const AppIcons(this.file);
  final String file;

  String get path => 'assets/icons/$file.svg';
}

class AppIcon extends StatelessWidget {
  const AppIcon(this.icon, {super.key, required this.size, this.color});

  final AppIcons icon;
  final double size;

  /// Overrides the stroke colour baked into the export.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      icon.path,
      width: size,
      height: size,
      colorFilter: color == null
          ? null
          : ColorFilter.mode(color!, BlendMode.srcIn),
    );
  }
}
