import 'package:flutter/material.dart';
import 'package:vocare/models/industry_section.dart';
import 'package:vocare/services/market_AnalysisAPI.dart';
import 'package:vocare/services/biling_api.dart';
import 'package:vocare/widgets/industry_section_card.dart'; // 🔄 UŻYWAMY ISTNIEJĄCEGO WIDGETU
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'package:vocare/widgets/token_confirmation_modal.dart';
import 'package:vocare/screens/pricing_screen.dart';
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
  int _tokenBalance = 0;

  @override
  void initState() {
    super.initState();
    _loadTokenBalance();
    _loadExistingAnalysis(); // 🆕 Sprawdź istniejące analizy
  }

  Future<void> _loadTokenBalance() async {
    final balance = await BillingApi.getTokenBalance() ?? 0;
    setState(() {
      _tokenBalance = balance;
    });
  }

  /// 🆕 Sprawdza czy użytkownik ma już wygenerowane analizy
  Future<void> _loadExistingAnalysis() async {
    setState(() {
      _isLoading = true;
      _showTerminalAnimation = false;
    });

    final List<IndustrySection>? result =
        await MarketAnalysisApi.fetchIndustryStatistics();

    setState(() {
      _isLoading = false;
      _hasData = result != null && result.isNotEmpty;
      _sections = result ?? [];
    });

    print(
      '📊 Existing market analysis: ${result != null ? "FOUND ${result.length} industries" : "NOT FOUND"}',
    );
  }

  /// 🔄 Generuje NOWE analizy (kosztuje tokeny)
  Future<void> _generateNewAnalysis() async {
    setState(() {
      _isLoading = true;
      _showTerminalAnimation = true;
      _hasData = false;
      _sections.clear();
    });

    // Minimum 8 sekund animacji + rzeczywisty czas API
    final Future<void> animationDelay = Future.delayed(
      const Duration(seconds: 8),
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

    // Odśwież stan tokenów po generowaniu
    final newBalance = await BillingApi.getTokenBalance() ?? 0;
    setState(() {
      _tokenBalance = newBalance;
    });

    print(
      '🤖 New market analysis generated: ${result != null ? "SUCCESS with ${result.length} industries" : "FAILED"}',
    );
  }

  /// 🔄 Modal tokenów - tylko dla nowych analiz
  Future<void> _showTokenConfirmationModal() async {
    const tokensRequired = 3; // Market analysis kosztuje 3 tokeny

    final confirmed = await TokenConfirmationModal.show(
      context: context,
      tokensRequired: tokensRequired,
      currentBalance: _tokenBalance,
    );

    if (confirmed == true) {
      _generateNewAnalysis();
    }
  }

  Widget _buildTokenBalance() {
    return GestureDetector(
      onTap: () {
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
                actions: [_buildTokenBalance(), const ThemeToggleButton()],
              ),
      body:
          _showTerminalAnimation
              ? _buildTerminalAnimationView()
              : _buildMainContent(),
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
        const MarketAnalysisTerminal(),

        const SizedBox(height: 40),

        // Status text
        Text(
          'Generating your personalized market analysis...',
          style: TextStyle(color: Colors.grey.shade400, fontSize: 16),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildMainContent() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Column(
          children: [
            Expanded(
              child: Container(
                width: constraints.maxWidth,
                height:
                    constraints.maxHeight - 100, // Rezerwuj miejsce na przycisk
                child:
                    _isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : _hasData
                        ? _buildAnalysisContent()
                        : _buildEmptyState(),
              ),
            ),
            // Przycisk na dole - FIXED HEIGHT
            Container(
              width: constraints.maxWidth,
              height: 100,
              padding: const EdgeInsets.all(16),
              color: Theme.of(context).scaffoldBackgroundColor,
              child: Center(child: _buildGenerateButton()),
            ),
          ],
        );
      },
    );
  }

  Widget _buildAnalysisContent() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return AnimatedOpacity(
          opacity: _hasData ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 500),
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight,
                maxWidth: constraints.maxWidth,
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // 🆕 NAGŁÓWEK "Market Analysis"
                    const Text(
                      'Market Analysis',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF915EFF),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),

                    // 🔧 UŻYWAMY ISTNIEJĄCEGO IndustrySectionCard - TYLKO 3 PIERWSZE
                    ...(_sections.take(3).toList()).asMap().entries.map((
                      entry,
                    ) {
                      final index = entry.key; // 0, 1, 2
                      final industrySection = entry.value;

                      return TweenAnimationBuilder<double>(
                        duration: Duration(milliseconds: 800 + (index * 200)),
                        tween: Tween(begin: 0.0, end: 1.0),
                        builder: (context, value, child) {
                          return Transform.translate(
                            offset: Offset(0, 20 * (1 - value)),
                            child: Opacity(
                              opacity: value,
                              child: IndustrySectionCard(
                                index: index, // 🔢 Indexy 0, 1, 2
                                industry: industrySection.industry,
                                averageSalary: industrySection.averageSalary,
                                employmentRate: industrySection.employmentRate,
                                growthForecast: industrySection.growthForecast,
                              ),
                            ),
                          );
                        },
                      );
                    }).toList(),

                    // Dodatkowo space na dole żeby przycisk nie nachodzi
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.analytics, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 20),
          Text(
            'Ready to analyze the job market?',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            'Click the button below to generate personalized market insights based on current trends.',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildGenerateButton() {
    return _isLoading
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
              Text(
                _showTerminalAnimation
                    ? 'Generating new market analysis...'
                    : 'Loading existing analysis...',
              ),
            ],
          ),
        )
        : CustomButton(
          text:
              _hasData
                  ? "Generate new analysis (3 tokens)" // Ma już analizy - generuj nowe za tokeny
                  : "Generate market analysis (3 tokens)", // Nie ma analiz - pierwsza generacja za tokeny
          onPressed:
              _hasData
                  ? _showTokenConfirmationModal // Ma analizy - pokaż modal tokenów
                  : _generateNewAnalysis, // Nie ma analiz - generuj od razu (ale dalej za tokeny)
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
    {
      'delay': 6200,
      'text': 'Preparing detailed insights...',
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
