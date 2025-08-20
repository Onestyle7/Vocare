import 'package:flutter/material.dart';
import 'package:vocare/models/ai_career_response.dart';
import 'package:vocare/services/ai_api.dart';
import 'package:vocare/services/profile_api.dart';
import 'package:vocare/services/biling_api.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/expandable_career_path_card.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'package:vocare/widgets/token_confirmation_modal.dart';
import 'package:vocare/widgets/create_future_view.dart';
import 'package:vocare/screens/pricing_screen.dart';
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
  bool _hasProfile = false;
  bool _isCheckingProfile = true;
  AiCareerResponse? _recommendation;
  int _tokenBalance = 0;

  @override
  void initState() {
    super.initState();
    _checkProfileAndTokens();
  }

  Future<void> _checkProfileAndTokens() async {
    // Sprawdź czy użytkownik ma profil
    final profile = await ProfileApi.getUserProfile();
    final hasProfile =
        profile != null &&
        profile['firstName'] != null &&
        profile['firstName'].toString().trim().isNotEmpty;

    // Pobierz stan tokenów
    final balance = await BillingApi.getTokenBalance() ?? 0;

    setState(() {
      _hasProfile = hasProfile;
      _tokenBalance = balance;
      _isCheckingProfile = false;
    });

    // 🔄 ZMIANA: Jeśli ma profil, sprawdź czy ma już rekomendacje
    if (hasProfile) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadExistingRecommendation(); // 🆕 Sprawdź istniejące zamiast generować nowe
      });
    }
  }

  /// 🆕 Sprawdza czy użytkownik ma już wygenerowane rekomendacje
  Future<void> _loadExistingRecommendation() async {
    setState(() {
      _isLoading = true;
      _showTerminalAnimation =
          false; // 🔄 Nie pokazuj animacji dla istniejących
      _recommendation = null;
    });

    // Sprawdź ostatnie rekomendacje (bez kosztów)
    final AiCareerResponse? result = await AiApi.fetchLastRecommendation();

    setState(() {
      _isLoading = false;
      _recommendation = result;
    });

    // 🔍 DEBUG: Sprawdź ile wyników otrzymujemy
    if (result != null) {
      print('🔍 DEBUG API Response:');
      print(
        '   - mainCareerPath: ${result.mainCareerPath?.careerName ?? "NULL"}',
      );
      print('   - careerPaths.length: ${result.careerPaths.length}');
      print(
        '   - additionalCareerPaths.length: ${result.additionalCareerPaths.length}',
      );
      print('   - careerPaths names:');
      for (int i = 0; i < result.careerPaths.length; i++) {
        print('     ${i + 1}. ${result.careerPaths[i].careerName}');
      }
    }

    print(
      '📊 Existing recommendations: ${result != null ? "FOUND" : "NOT FOUND"}',
    );
  }

  /// 🔄 Generuje NOWE rekomendacje (kosztuje tokeny)
  Future<void> _generateNewRecommendation() async {
    setState(() {
      _isLoading = true;
      _showTerminalAnimation = true; // 🔄 Pokaż animację dla nowych
      _recommendation = null;
    });

    // Minimum 8 sekund animacji + rzeczywisty czas API
    final Future<void> animationDelay = Future.delayed(
      const Duration(seconds: 8),
    );
    final Future<AiCareerResponse?> apiCall =
        AiApi.generateNewRecommendation(); // 🆕 Nowa metoda

    // Czekaj na oba - animację i API
    final results = await Future.wait([animationDelay, apiCall]);
    final AiCareerResponse? result = results[1] as AiCareerResponse?;

    setState(() {
      _isLoading = false;
      _showTerminalAnimation = false;
      _recommendation = result;
    });

    // Odśwież stan tokenów po generowaniu
    final newBalance = await BillingApi.getTokenBalance() ?? 0;
    setState(() {
      _tokenBalance = newBalance;
    });

    // 🔍 DEBUG: Sprawdź ile wyników otrzymujemy
    if (result != null) {
      print('🔍 DEBUG NEW API Response:');
      print(
        '   - mainCareerPath: ${result.mainCareerPath?.careerName ?? "NULL"}',
      );
      print('   - careerPaths.length: ${result.careerPaths.length}');
      print(
        '   - additionalCareerPaths.length: ${result.additionalCareerPaths.length}',
      );
      print('   - careerPaths names:');
      for (int i = 0; i < result.careerPaths.length; i++) {
        print('     ${i + 1}. ${result.careerPaths[i].careerName}');
      }
    }

    print(
      '🤖 New recommendations generated: ${result != null ? "SUCCESS" : "FAILED"}',
    );
  }

  /// 🔄 Modal tokenów - tylko dla nowych rekomendacji
  Future<void> _showTokenConfirmationModal() async {
    const tokensRequired = 5;

    final confirmed = await TokenConfirmationModal.show(
      context: context,
      tokensRequired: tokensRequired,
      currentBalance: _tokenBalance,
    );

    if (confirmed == true) {
      _generateNewRecommendation(); // 🆕 Użyj nowej metody
    }
  }

  @override
  Widget build(BuildContext context) {
    // Jeśli sprawdzamy profil, pokaż loading
    if (_isCheckingProfile) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // Jeśli użytkownik nie ma profilu, pokaż stronę "Create future"
    if (!_hasProfile) {
      return const CreateFutureView();
    }

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
                actions: [
                  // Token balance w app bar
                  _buildTokenBalance(),
                  const ThemeToggleButton(),
                ],
              ),
      body:
          _showTerminalAnimation
              ? _buildTerminalAnimationView()
              : _buildMainContent(),
    );
  }

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

        // Terminal Animation (używamy istniejący widget)
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
    return LayoutBuilder(
      builder: (context, constraints) {
        return Column(
          children: [
            Expanded(
              child: Container(
                width: constraints.maxWidth,
                height:
                    constraints.maxHeight -
                    100, // 🔧 Rezerwuj miejsce na przycisk
                child:
                    _isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : _recommendation != null
                        ? _buildRecommendationContent()
                        : _buildEmptyState(),
              ),
            ),
            // 🔧 Przycisk na dole - FIXED HEIGHT
            Container(
              width: constraints.maxWidth,
              height: 100, // 🔧 STAŁA WYSOKOŚĆ
              padding: const EdgeInsets.all(16),
              color: Theme.of(context).scaffoldBackgroundColor,
              child: Center(child: _buildGenerateButton()),
            ),
          ],
        );
      },
    );
  }

  Widget _buildRecommendationContent() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return AnimatedOpacity(
          opacity: _recommendation != null ? 1.0 : 0.0,
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
                    // 🆕 NAGŁÓWEK "Career Recommendation"
                    const Text(
                      'Career Recommendation',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF915EFF),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),

                    // 🔧 KARTA 1 - Główna rekomendacja (mainCareerPath)
                    if (_recommendation!.mainCareerPath != null)
                      TweenAnimationBuilder<double>(
                        duration: const Duration(milliseconds: 800),
                        tween: Tween(begin: 0.0, end: 1.0),
                        builder: (context, value, child) {
                          return Transform.translate(
                            offset: Offset(0, 20 * (1 - value)),
                            child: Opacity(
                              opacity: value,
                              child: ExpandableCareerPathCard(
                                number: 1,
                                careerPath: _recommendation!.mainCareerPath!,
                                mainRecommendation:
                                    _recommendation!.recommendation,
                                isMainRecommendation: true,
                              ),
                            ),
                          );
                        },
                      ),

                    // 🔧 KARTY 2, 3, 4 - DOKŁADNIE 3 dodatkowe rekomendacje
                    ...(() {
                      // 🔍 DEBUG: Sprawdź strukturę danych
                      print('🔍 DEBUG Recommendation Structure:');
                      print(
                        '   - mainCareerPath: ${_recommendation!.mainCareerPath?.careerName ?? "NULL"}',
                      );
                      print(
                        '   - careerPaths.length: ${_recommendation!.careerPaths.length}',
                      );
                      print('   - Wszystkie careerPaths:');
                      for (
                        int i = 0;
                        i < _recommendation!.careerPaths.length;
                        i++
                      ) {
                        print(
                          '     $i. ${_recommendation!.careerPaths[i].careerName}',
                        );
                      }

                      // 🔧 Logika: Pomiń pierwszą jeśli to duplikat mainCareerPath
                      List<CareerPath> additionalPaths;
                      if (_recommendation!.mainCareerPath != null &&
                          _recommendation!.careerPaths.isNotEmpty &&
                          _recommendation!.careerPaths.first.careerName ==
                              _recommendation!.mainCareerPath!.careerName) {
                        // Pierwsza to duplikat - pomiń ją i weź następne 3
                        additionalPaths =
                            _recommendation!.careerPaths
                                .skip(1)
                                .take(3)
                                .toList();
                        print('   - DUPLIKAT wykryty - pomijam pierwszą');
                      } else {
                        // Brak duplikatu - weź pierwsze 3
                        additionalPaths =
                            _recommendation!.careerPaths.take(3).toList();
                        print('   - BRAK duplikatu - biorę pierwsze 3');
                      }

                      print(
                        '   - Wyświetlam ${additionalPaths.length} dodatkowych kart',
                      );

                      return additionalPaths;
                    })().asMap().entries.map((entry) {
                      final index = entry.key; // 0, 1, 2
                      final careerPath = entry.value;

                      return TweenAnimationBuilder<double>(
                        duration: Duration(milliseconds: 1000 + (index * 200)),
                        tween: Tween(begin: 0.0, end: 1.0),
                        builder: (context, value, child) {
                          return Transform.translate(
                            offset: Offset(0, 20 * (1 - value)),
                            child: Opacity(
                              opacity: value,
                              child: ExpandableCareerPathCard(
                                number: index + 2, // 🔢 Numery 2, 3, 4
                                careerPath: careerPath,
                                isMainRecommendation:
                                    false, // 📋 Dodatkowe rekomendacje
                              ),
                            ),
                          );
                        },
                      );
                    }).toList(),

                    // 🔧 Dodatkowo space na dole żeby przycisk nie nachodzi
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
                    ? 'Generating new recommendations...'
                    : 'Loading existing recommendations...',
              ),
            ],
          ),
        )
        : CustomButton(
          text:
              _recommendation != null
                  ? "Generate new recommendation (5 tokens)" // 🔄 Ma już rekomendacje - generuj nowe za tokeny
                  : "Generate AI recommendation (5 tokens)", // 🔄 Nie ma rekomendacji - pierwsza generacja za tokeny
          onPressed:
              _recommendation != null
                  ? _showTokenConfirmationModal // 🔄 Ma rekomendacje - pokaż modal tokenów
                  : _generateNewRecommendation, // 🔄 Nie ma rekomendacji - generuj od razu (ale dalej za tokeny)
        );
  }
}

// Pozostałe komponenty (TerminalDemo, TypingText) zachowują swoją obecną implementację
// z poprzedniego pliku - nie zmieniam ich, bo działają dobrze

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
