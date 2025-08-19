import 'package:flutter/material.dart';
import 'package:vocare/models/ai_career_response.dart';
import 'package:vocare/services/ai_api.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/expandable_career_path_card.dart';
import 'package:vocare/widgets/main_recommendation_card.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'dart:async';

class AIAsistentPageScreen extends StatefulWidget {
  const AIAsistentPageScreen({super.key});

  @override
  State<AIAsistentPageScreen> createState() => _AIAsistentPageScreenState();
}

class _AIAsistentPageScreenState extends State<AIAsistentPageScreen>
    with TickerProviderStateMixin {
  bool _isLoading = false;
  bool _showTerminalAnimation = false;
  AiCareerResponse? _recommendation;

  @override
  void initState() {
    super.initState();
    // Automatycznie załaduj rekomendację przy pierwszym uruchomieniu
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadRecommendation();
    });
  }

  Future<void> _loadRecommendation() async {
    setState(() {
      _isLoading = true;
      _showTerminalAnimation = true;
      _recommendation = null; // Wyczyść poprzednie dane
    });

    // Minimum 8 sekund animacji + rzeczywisty czas API
    final Future<void> animationDelay = Future.delayed(
      const Duration(seconds: 8),
    );
    final Future<AiCareerResponse?> apiCall = AiApi.fetchFullRecommendation();

    // Czekaj na oba - animację i API
    final results = await Future.wait([animationDelay, apiCall]);
    final AiCareerResponse? result = results[1] as AiCareerResponse?;

    setState(() {
      _isLoading = false;
      _showTerminalAnimation = false;
      _recommendation = result;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _showTerminalAnimation ? Colors.black : null,
      appBar:
          _showTerminalAnimation
              ? null
              : AppBar(
                title: const Text("AI Assistant"),
                backgroundColor: Colors.black87,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => Navigator.pop(context),
                ),
                actions: const [ThemeToggleButton()],
              ),
      body: SafeArea(
        child:
            _showTerminalAnimation
                ? _buildTerminalAnimationView()
                : _buildMainContent(),
      ),
    );
  }

  Widget _buildTerminalAnimationView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Logo Vocare
        Image.asset(
          'assets/img/vocare.png',
          height: 100,
          fit: BoxFit.contain,
          color: Colors.white,
        ),
        const SizedBox(height: 40),

        // Terminal Animation
        const TerminalDemo(),

        const SizedBox(height: 40),

        // Status text
        Text(
          'Generating your personalized career recommendations...',
          style: TextStyle(color: Colors.grey.shade400, fontSize: 16),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildMainContent() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Expanded(
            child:
                _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _recommendation != null
                    ? _buildRecommendationContent()
                    : _buildEmptyState(),
          ),
          const SizedBox(height: 16),
          _buildGenerateButton(),
        ],
      ),
    );
  }

  Widget _buildRecommendationContent() {
    return AnimatedOpacity(
      opacity: _recommendation != null ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 500),
      child: ListView(
        children: [
          // Smooth fade-in animation dla głównej rekomendacji
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 800),
            tween: Tween(begin: 0.0, end: 1.0),
            builder: (context, value, child) {
              return Transform.translate(
                offset: Offset(0, 20 * (1 - value)),
                child: Opacity(
                  opacity: value,
                  child: MainRecommendationCard(
                    recommendation: _recommendation!.recommendation,
                  ),
                ),
              );
            },
          ),

          // Animowane career paths z opóźnieniem
          ..._recommendation!.careerPaths.asMap().entries.map((entry) {
            final index = entry.key;
            final careerPath = entry.value;

            return TweenAnimationBuilder<double>(
              duration: Duration(milliseconds: 800 + (index * 200)),
              tween: Tween(begin: 0.0, end: 1.0),
              builder: (context, value, child) {
                return Transform.translate(
                  offset: Offset(0, 20 * (1 - value)),
                  child: Opacity(
                    opacity: value,
                    child: ExpandableCareerPathCard(careerPath: careerPath),
                  ),
                );
              },
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.psychology, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 20),
          Text(
            'Ready to discover your ideal career path?',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            'Click the button below to generate personalized recommendations based on your profile.',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildGenerateButton() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      child:
          _isLoading
              ? Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Theme.of(context).primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text('Generating recommendations...'),
                  ],
                ),
              )
              : CustomButton(
                text:
                    _recommendation != null
                        ? "Generate new recommendation"
                        : "Generate AI recommendation",
                onPressed: _loadRecommendation,
              ),
    );
  }
}

// Terminal Demo Component - taki sam jak wcześniej ale z małymi optymalizacjami
class TerminalDemo extends StatefulWidget {
  const TerminalDemo({super.key});

  @override
  State<TerminalDemo> createState() => _TerminalDemoState();
}

class _TerminalDemoState extends State<TerminalDemo>
    with TickerProviderStateMixin {
  final List<AnimationController> _controllers = [];
  final List<Animation<double>> _animations = [];
  final List<String> _displayedTexts = [];

  // Dostosowane kroki dla Vocare AI Assistant
  final List<Map<String, dynamic>> _steps = [
    {'delay': 0, 'text': '> vocare analyze profile', 'type': 'typing'},
    {'delay': 800, 'text': '✔ Loading user profile data', 'type': 'success'},
    {
      'delay': 1400,
      'text': '✔ Analyzing skills and experience',
      'type': 'success',
    },
    {'delay': 2000, 'text': '✔ Scanning job market trends', 'type': 'success'},
    {
      'delay': 2600,
      'text': '✔ Matching career opportunities',
      'type': 'success',
    },
    {'delay': 3200, 'text': '✔ Evaluating personality fit', 'type': 'success'},
    {
      'delay': 3800,
      'text': '✔ Computing salary predictions',
      'type': 'success',
    },
    {'delay': 4400, 'text': '✔ Generating career paths', 'type': 'success'},
    {'delay': 5000, 'text': '✔ Creating SWOT analysis', 'type': 'success'},
    {'delay': 5600, 'text': '✔ Compiling recommendations', 'type': 'success'},
    {'delay': 6200, 'text': 'ℹ AI analysis complete', 'type': 'info'},
    {
      'delay': 6800,
      'text': 'Success! Your career recommendations are ready.',
      'type': 'typing',
    },
    {
      'delay': 7400,
      'text': 'Preparing personalized insights...',
      'type': 'loading',
    },
  ];

  @override
  void initState() {
    super.initState();
    _startAnimation();
  }

  void _startAnimation() {
    for (int i = 0; i < _steps.length; i++) {
      final controller = AnimationController(
        duration: const Duration(milliseconds: 600),
        vsync: this,
      );

      final animation = Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(parent: controller, curve: Curves.easeOut));

      _controllers.add(controller);
      _animations.add(animation);

      Timer(Duration(milliseconds: _steps[i]['delay']), () {
        if (mounted) {
          setState(() {
            _displayedTexts.add(_steps[i]['text']);
          });
          controller.forward();
        }
      });
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  Color _getTextColor(String type) {
    switch (type) {
      case 'success':
        return const Color(0xFF22C55E); // Green-500
      case 'info':
        return const Color(0xFF3B82F6); // Blue-500
      case 'loading':
        return const Color(0xFF9CA3AF); // Gray-400
      default:
        return Colors.white;
    }
  }

  Widget _buildTerminalLine(int index) {
    if (index >= _displayedTexts.length) return const SizedBox.shrink();

    final step = _steps[index];
    final text = _displayedTexts[index];
    final type = step['type'];

    return AnimatedBuilder(
      animation: _animations[index],
      builder: (context, child) {
        return Opacity(
          opacity: _animations[index].value,
          child: Transform.translate(
            offset: Offset(0, 10 * (1 - _animations[index].value)),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (type == 'loading') ...[
                    SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Colors.grey.shade400,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child:
                        type == 'typing'
                            ? TypingText(
                              text: text,
                              textColor: _getTextColor(type),
                              delay: 40,
                            )
                            : Text(
                              text,
                              style: TextStyle(
                                color: _getTextColor(type),
                                fontFamily: 'monospace',
                                fontSize: 13,
                                height: 1.3,
                              ),
                            ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1117),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF30363D)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Terminal header
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: Color(0xFFFF5F57),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: Color(0xFFFFBD2E),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: Color(0xFF28CA42),
                  shape: BoxShape.circle,
                ),
              ),
              const Spacer(),
              Text(
                'AI Assistant Terminal',
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 11,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Terminal content
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (int i = 0; i < _steps.length; i++) _buildTerminalLine(i),
            ],
          ),
        ],
      ),
    );
  }
}

// Typing text animation - taka sama jak wcześniej
class TypingText extends StatefulWidget {
  final String text;
  final Color textColor;
  final int delay;

  const TypingText({
    super.key,
    required this.text,
    required this.textColor,
    this.delay = 50,
  });

  @override
  State<TypingText> createState() => _TypingTextState();
}

class _TypingTextState extends State<TypingText> {
  String _displayedText = '';
  Timer? _timer;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _startTyping();
  }

  void _startTyping() {
    _timer = Timer.periodic(Duration(milliseconds: widget.delay), (timer) {
      if (_currentIndex < widget.text.length) {
        setState(() {
          _displayedText = widget.text.substring(0, _currentIndex + 1);
          _currentIndex++;
        });
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            _displayedText,
            style: TextStyle(
              color: widget.textColor,
              fontFamily: 'monospace',
              fontSize: 13,
              height: 1.3,
            ),
          ),
        ),
        if (_currentIndex < widget.text.length)
          Container(
            width: 6,
            height: 14,
            margin: const EdgeInsets.only(left: 2),
            color: widget.textColor,
          ),
      ],
    );
  }
}
