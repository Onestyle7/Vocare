import 'package:flutter/material.dart';
import 'package:vocare/services/biling_api.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'dart:math' as math; // 🔧 DODANY IMPORT

class PricingScreen extends StatefulWidget {
  const PricingScreen({super.key});

  @override
  State<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends State<PricingScreen> {
  int _tokenBalance = 0;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadTokenBalance();
  }

  Future<void> _loadTokenBalance() async {
    final balance = await BillingApi.getTokenBalance() ?? 0;
    setState(() {
      _tokenBalance = balance;
    });
  }

  Future<void> _buyPlan(String planId, String planName, int price) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final success = await BillingApi.createCheckoutSession(planId);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Przekierowanie do płatności za plan $planName...'),
            backgroundColor: const Color(0xFF915EFF),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Błąd podczas inicjalizacji płatności'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Błąd: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0e100f),
      appBar: AppBar(
        backgroundColor: Colors.black87,
        title: const Text('Pricing', style: TextStyle(color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          // Token balance w app bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Center(
              child: Row(
                children: [
                  const Icon(
                    Icons.account_balance_wallet,
                    color: Color(0xFF915EFF),
                    size: 18,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '$_tokenBalance',
                    style: const TextStyle(
                      color: Color(0xFF915EFF),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const ThemeToggleButton(),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Header z gwiazdkami
            Stack(
              children: [
                // Gwiazda po lewej
                const Positioned(
                  left: 0,
                  top: 20,
                  child: _StarWidget(size: 60, color: Color(0xFF915EFF)),
                ),
                // Gwiazda po prawej
                const Positioned(
                  right: 0,
                  bottom: 0,
                  child: _StarWidget(size: 80, color: Color(0xFF915EFF)),
                ),
                // Główny tekst
                Center(
                  child: Column(
                    children: [
                      const SizedBox(height: 40),
                      const Text(
                        'Tailored to',
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          height: 1.1,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const Text(
                        'your needs',
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                          height: 1.1,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 60),
                    ],
                  ),
                ),
              ],
            ),

            // Plany pricing
            LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxWidth > 800) {
                  // Desktop layout - 3 kolumny
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: _buildStarterPlan()),
                      const SizedBox(width: 24),
                      Expanded(child: _buildGrowthPlan()),
                      const SizedBox(width: 24),
                      Expanded(child: _buildUnlimitedPlan()),
                    ],
                  );
                } else {
                  // Mobile layout - kolumna
                  return Column(
                    children: [
                      _buildGrowthPlan(), // Najpopularniejszy na górze
                      const SizedBox(height: 24),
                      _buildStarterPlan(),
                      const SizedBox(height: 24),
                      _buildUnlimitedPlan(),
                    ],
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStarterPlan() {
    return _buildPlanCard(
      title: 'Starter',
      subtitle: 'Perfect for getting started with our platform.',
      price: 9,
      tokens: '1,000 tokens',
      features: [
        '1,000 tokens included',
        'Basic access to AI models',
        'Up to 5 requests per day',
        'Standard response time',
      ],
      buttonText: 'Buy plan',
      isPopular: false,
      onBuy: () => _buyPlan('starter', 'Starter', 9),
    );
  }

  Widget _buildGrowthPlan() {
    return _buildPlanCard(
      title: 'Growth',
      subtitle: 'The best choice for scaling your projects.',
      price: 32,
      tokens: '5,000 tokens',
      features: [
        '5,000 tokens included',
        'Full access to all AI models',
        'Unlimited daily requests',
        'Priority response time',
        'Export results in multiple formats',
      ],
      buttonText: 'Buy plan',
      isPopular: true,
      onBuy: () => _buyPlan('growth', 'Growth', 32),
    );
  }

  Widget _buildUnlimitedPlan() {
    return _buildPlanCard(
      title: 'Unlimited',
      subtitle: 'Unlimited tokens and premium experience for personal use.',
      price: 48,
      tokens: 'Unlimited tokens',
      features: [
        'Unlimited tokens for one user',
        'Access to all advanced AI models',
        'Dedicated premium support',
        'Fastest response time',
        'Personalized onboarding assistance',
      ],
      buttonText: 'Buy plan',
      isPopular: false,
      onBuy: () => _buyPlan('unlimited', 'Unlimited', 48),
    );
  }

  Widget _buildPlanCard({
    required String title,
    required String subtitle,
    required int price,
    required String tokens,
    required List<String> features,
    required String buttonText,
    required bool isPopular,
    required VoidCallback onBuy,
  }) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1E),
        borderRadius: BorderRadius.circular(16),
        border:
            isPopular
                ? Border.all(color: const Color(0xFF915EFF), width: 2)
                : Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Popular badge
          if (isPopular) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Most popular',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Plan title
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),

          // Subtitle
          Text(
            subtitle,
            style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
          ),
          const SizedBox(height: 24),

          // Price
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '\$$price',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  tokens,
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Features
          ...features.map(
            (feature) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  const Icon(Icons.check, color: Color(0xFF915EFF), size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      feature,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 32),

          // Buy button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : onBuy,
              style: ElevatedButton.styleFrom(
                backgroundColor: isPopular ? Colors.white : Colors.transparent,
                foregroundColor: isPopular ? Colors.black : Colors.white,
                side:
                    isPopular
                        ? null
                        : const BorderSide(color: Colors.white, width: 1),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child:
                  _isLoading
                      ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                      : Text(
                        buttonText,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StarWidget extends StatelessWidget {
  final double size;
  final Color color;

  const _StarWidget({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color, color.withOpacity(0.6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: CustomPaint(painter: _StarPainter(color: color)),
    );
  }
}

class _StarPainter extends CustomPainter {
  final Color color;

  _StarPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint =
        Paint()
          ..color = color
          ..style = PaintingStyle.fill;

    final path = Path();
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Create a 4-pointed star shape
    for (int i = 0; i < 8; i++) {
      final angle = (i * 45) * (math.pi / 180); // 🔧 UŻYWAJ math.pi
      final currentRadius = i.isEven ? radius : radius * 0.4;
      final x =
          center.dx + currentRadius * math.cos(angle); // 🔧 UŻYWAJ math.cos
      final y =
          center.dy + currentRadius * math.sin(angle); // 🔧 UŻYWAJ math.sin

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
