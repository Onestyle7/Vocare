import 'package:flutter/material.dart';
import 'package:vocare/models/industry_section.dart';
import 'package:vocare/services/market_AnalysisAPI.dart';
import 'package:vocare/services/biling_api.dart'; // 🆕 DODANY IMPORT
import 'package:vocare/widgets/industry_section_card.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart'; // 🆕 DODANY IMPORT
import 'package:vocare/screens/pricing_screen.dart'; // 🆕 DODANY IMPORT
import 'dart:async';

class MarketAnalysisPage extends StatefulWidget {
  const MarketAnalysisPage({super.key});

  @override
  State<MarketAnalysisPage> createState() => _MarketAnalysisPageState();
}

class _MarketAnalysisPageState extends State<MarketAnalysisPage>
    with TickerProviderStateMixin {
  bool _isLoading = false;
  bool _showTerminalAnimation = false;
  bool _hasData = false;
  List<IndustrySection> _sections = [];
  int _tokenBalance = 0; // 🆕 DODANY TOKEN BALANCE

  @override
  void initState() {
    super.initState();
    _loadTokenBalance(); // 🆕 DODANE
    // Nie ładujemy automatycznie - czekamy na kliknięcie
  }

  // 🆕 DODANA FUNKCJA
  Future<void> _loadTokenBalance() async {
    final balance = await BillingApi.getTokenBalance() ?? 0;
    setState(() {
      _tokenBalance = balance;
    });
  }

  Future<void> _generateMarketAnalysis() async {
    setState(() {
      _isLoading = true;
      _showTerminalAnimation = true;
      _hasData = false;
      _sections.clear();
    });

    // Minimum 6 sekund animacji + rzeczywisty czas API
    final Future<void> animationDelay = Future.delayed(
      const Duration(seconds: 6),
    );
    final Future<List<IndustrySection>?> apiCall =
        MarketAnalysisApi.fetchIndustryStatistics();

    // Czekaj na oba - animację i API
    final results = await Future.wait([animationDelay, apiCall]);
    final List<IndustrySection>? result = results[1] as List<IndustrySection>?;

    setState(() {
      _isLoading = false;
      _showTerminalAnimation = false;
      _hasData = result != null && result.isNotEmpty;
      _sections = result ?? [];
    });

    // 🆕 DODANE: Odśwież token balance po analizie
    _loadTokenBalance();
  }

  // 🆕 DODANA FUNKCJA - identyczna jak w AI Assistant
  Widget _buildTokenBalance() {
    return GestureDetector(
      onTap: () {
        // Przejście do pricing screen po kliknięciu w token balance
        Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (context) => const PricingScreen()));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF915EFF).withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF915EFF), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.account_balance_wallet,
              color: Color(0xFF915EFF),
              size: 18,
            ),
            const SizedBox(width: 6),
            Text(
              '$_tokenBalance',
              style: const TextStyle(
                color: Color(0xFF915EFF),
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.add, color: Color(0xFF915EFF), size: 16),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _showTerminalAnimation ? Colors.black : null,
      appBar:
          _showTerminalAnimation
              ? null
              : AppBar(
                title: const Text("Market Analysis"),
                backgroundColor: Colors.black87,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => Navigator.pop(context),
                ),
                // 🆕 DODANE: Token balance i theme toggle w AppBar
                actions: [_buildTokenBalance(), const ThemeToggleButton()],
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
        // Logo Vocare z gradientem
        ShaderMask(
          shaderCallback:
              (bounds) => const LinearGradient(
                colors: [Color(0xFF00D4FF), Color(0xFF915EFF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ).createShader(bounds),
          child: Image.asset(
            'assets/img/vocare.png',
            height: 100,
            fit: BoxFit.contain,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 40),

        // Terminal Animation
        const MarketAnalysisTerminal(),

        const SizedBox(height: 40),

        // Status text
        Text(
          'Analyzing current job market trends...',
          style: TextStyle(color: Colors.grey.shade400, fontSize: 16),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildMainContent() {
    if (!_hasData && !_isLoading) {
      // Welcome screen
      return _buildWelcomeScreen();
    } else if (_hasData) {
      // Results screen
      return _buildResultsScreen();
    } else {
      // Loading screen (fallback)
      return const Center(child: CircularProgressIndicator());
    }
  }

  Widget _buildWelcomeScreen() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Top navigation bar dla welcome screen
          Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  color:
                      Theme.of(context).brightness == Brightness.dark
                          ? Colors.grey.shade800
                          : Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, size: 24),
                  onPressed: () => Navigator.pop(context),
                  color:
                      Theme.of(context).brightness == Brightness.dark
                          ? Colors.white
                          : Colors.grey.shade700,
                ),
              ),
              const SizedBox(width: 16),
              const Text(
                "Market Analysis",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
            ],
          ),

          const Spacer(),

          // Główny tekst z gradientem
          ShaderMask(
            shaderCallback:
                (bounds) => const LinearGradient(
                  colors: [Colors.white, Color(0xFF915EFF)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ).createShader(bounds),
            child: const Text(
              'Generate',
              style: TextStyle(
                fontSize: 72,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                height: 0.9,
              ),
              textAlign: TextAlign.center,
            ),
          ),

          // "future" z ikoną
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF00D4FF), Color(0xFF915EFF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.trending_up,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              const Text(
                'future',
                style: TextStyle(
                  fontSize: 72,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                  height: 0.9,
                ),
              ),
            ],
          ),

          const SizedBox(height: 32),

          // Subtitle
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Get valuable insights about current job market trends',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
                letterSpacing: 0.5,
              ),
            ),
          ),

          const Spacer(),

          // Generate button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: CustomButton(
                    text: "Recommendation first",
                    onPressed: _generateMarketAnalysis,
                    backgroundColor: const Color(0xFF915EFF),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF915EFF),
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_forward, color: Colors.white),
                    onPressed: _generateMarketAnalysis,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildResultsScreen() {
    return Column(
      children: [
        // Header z przyciskiem refresh
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.analytics, color: Color(0xFF915EFF)),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  "Market Analysis Results",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, color: Color(0xFF915EFF)),
                onPressed: _generateMarketAnalysis,
                tooltip: "Generate new analysis",
              ),
            ],
          ),
        ),

        // Results list
        Expanded(
          child: AnimatedOpacity(
            opacity: _hasData ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 500),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _sections.length,
              itemBuilder: (context, index) {
                final industry = _sections[index];

                return TweenAnimationBuilder<double>(
                  duration: Duration(milliseconds: 300 + (index * 100)),
                  tween: Tween(begin: 0.0, end: 1.0),
                  builder: (context, value, child) {
                    return Transform.translate(
                      offset: Offset(0, 20 * (1 - value)),
                      child: Opacity(
                        opacity: value,
                        child: IndustrySectionCard(
                          index: index,
                          industry: industry.industry,
                          averageSalary: industry.averageSalary,
                          employmentRate: industry.employmentRate,
                          growthForecast: industry.growthForecast,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

// Terminal Demo Component dla Market Analysis
class MarketAnalysisTerminal extends StatefulWidget {
  const MarketAnalysisTerminal({super.key});

  @override
  State<MarketAnalysisTerminal> createState() => _MarketAnalysisTerminalState();
}

class _MarketAnalysisTerminalState extends State<MarketAnalysisTerminal>
    with TickerProviderStateMixin {
  final List<AnimationController> _controllers = [];
  final List<Animation<double>> _animations = [];
  final List<String> _displayedTexts = [];

  // Kroki dla Market Analysis
  final List<Map<String, dynamic>> _steps = [
    {
      'delay': 0,
      'text': '> vocare market-analysis --generate',
      'type': 'typing',
    },
    {
      'delay': 800,
      'text': '✔ Connecting to market data sources',
      'type': 'success',
    },
    {
      'delay': 1400,
      'text': '✔ Fetching industry statistics',
      'type': 'success',
    },
    {'delay': 2000, 'text': '✔ Analyzing employment trends', 'type': 'success'},
    {
      'delay': 2600,
      'text': '✔ Processing salary benchmarks',
      'type': 'success',
    },
    {'delay': 3200, 'text': '✔ Evaluating growth forecasts', 'type': 'success'},
    {
      'delay': 3800,
      'text': '✔ Scanning skill demand patterns',
      'type': 'success',
    },
    {'delay': 4400, 'text': '✔ Compiling market insights', 'type': 'success'},
    {'delay': 5000, 'text': 'ℹ Market analysis complete', 'type': 'info'},
    {
      'delay': 5600,
      'text': 'Success! Market trends ready for review.',
      'type': 'typing',
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
        return const Color(0xFF22C55E);
      case 'info':
        return const Color(0xFF3B82F6);
      case 'loading':
        return const Color(0xFF9CA3AF);
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
                'Market Analysis Terminal',
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

// Typing text animation - reused from AI Assistant
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
