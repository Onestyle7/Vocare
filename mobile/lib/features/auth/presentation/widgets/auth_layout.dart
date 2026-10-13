import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/feedback.dart';
import '../../../../core/widgets/glass_widgets.dart';

/// Shared frame of the Figma auth screens: logo badge, 32pt title,
/// ExtraLight subtitle, then a 370pt-wide column of controls.
class AuthLayout extends StatelessWidget {
  const AuthLayout({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
    this.showBack = false,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    // The Figma frames are 874pt tall; tighten the vertical rhythm on shorter
    // phones so the footer link stays on screen without scrolling.
    final compact = MediaQuery.sizeOf(context).height < 880;
    return Scaffold(
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Stack(
          children: [
            SafeArea(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: SingleChildScrollView(
                    keyboardDismissBehavior:
                        ScrollViewKeyboardDismissBehavior.onDrag,
                    padding: EdgeInsets.fromLTRB(
                      AppSpacing.gutter,
                      compact ? 4 : 26,
                      AppSpacing.gutter,
                      16,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Center(
                          child: Hero(
                            tag: 'vocare-logo',
                            child: VocareLogo(
                              size: compact ? 84 : AppSpacing.logo,
                            ),
                          ),
                        ),
                        SizedBox(height: compact ? 24 : 35),
                        Text(
                          title,
                          style: AppTypography.display,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 10),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 46),
                          child: Text(
                            subtitle,
                            style: AppTypography.bodyLight.copyWith(
                              color: AppColors.textSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        SizedBox(height: compact ? 24 : 32),
                        ...children,
                      ],
                    ),
                  ),
                ),
              ),
            ),
            if (showBack)
              Positioned(
                top: MediaQuery.paddingOf(context).top + 8,
                left: AppSpacing.gutter,
                child: const GlassBackButton(),
              ),
          ],
        ),
      ),
    );
  }
}

/// Space between stacked controls (16pt in Figma).
const fieldGap = SizedBox(height: AppSpacing.fieldGap);
