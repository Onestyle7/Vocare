import 'package:flutter/material.dart';
import 'package:vocare/models/industry_section.dart';
import 'package:vocare/models/market_trend.dart';
import 'package:vocare/models/skill_demand.dart';
import 'package:vocare/services/market_AnalysisAPI.dart';
import 'package:vocare/services/biling_api.dart';
import 'package:vocare/services/profile_api.dart';
import 'package:vocare/widgets/industry_section_card.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'package:vocare/widgets/token_confirmation_modal.dart';
import 'package:vocare/widgets/create_future_view.dart';
import 'package:vocare/screens/pricing_screen.dart';
import 'package:vocare/screens/home_screen.dart';
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
  bool _hasProfile = false;
  bool _isCheckingProfile = true;
  List<IndustrySection> _industryData = [];
  int _tokenBalance = 0;

  @override
  void initState() {
    super.initState();
    _checkProfileAndTokens();
  }

  Future<void> _checkProfileAndTokens() async {
    final profile = await ProfileApi.getUserProfile();
    final hasProfile =
        profile != null &&
        profile['firstName'] != null &&
        profile['firstName'].toString().trim().isNotEmpty;

    final balance = await BillingApi.getTokenBalance() ?? 0;

    setState(() {
      _hasProfile = hasProfile;
      _tokenBalance = balance;
      _isCheckingProfile = false;
    });

    if (hasProfile) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadAnalysis();
      });
    }
  }

  Future<void> _loadAnalysis() async {
    setState(() {
      _isLoading = true;
      _showTerminalAnimation = true;
      _industryData = [];
    });

    final Future<void> animationDelay = Future.delayed(
      const Duration(seconds: 8),
    );

    print('🔍 Sprawdzanie czy istnieją ostatnie analizy rynku...');

    final Future<List<IndustrySection>?> lastAnalysisCheck =
        MarketAnalysisApi.fetchLastAnalysis();

    final List<IndustrySection>? existingAnalysis = await lastAnalysisCheck;

    List<IndustrySection> finalResult;

    if (existingAnalysis != null && existingAnalysis.isNotEmpty) {
      print('✅ Znaleziono istniejące analizy rynku - wyświetlam');
      finalResult = existingAnalysis;
      await animationDelay;
    } else {
      print('❌ Brak istniejących analiz - generuję nowe');

      final Future<List<IndustrySection>?> newAnalysisCall =
          MarketAnalysisApi.generateNewAnalysis();

      final results = await Future.wait([animationDelay, newAnalysisCall]);
      finalResult = results[1] as List<IndustrySection>? ?? [];

      if (finalResult.isNotEmpty) {
        print('✅ Wygenerowano nowe analizy rynku');
      } else {
        print('❌ Błąd generowania nowych analiz');
      }
    }

    setState(() {
      _isLoading = false;
      _showTerminalAnimation = false;
      _industryData = finalResult;
    });

    if (existingAnalysis == null || existingAnalysis.isEmpty) {
      final newBalance = await BillingApi.getTokenBalance() ?? 0;
      setState(() {
        _tokenBalance = newBalance;
      });
      print('🔄 Odświeżono stan tokenów: $newBalance');
    }

    print('🔍 DEBUG Final Analysis Result: ${finalResult.length} industries');
  }

  Future<void> _showTokenConfirmationModal() async {
    const tokensRequired = 3;

    final confirmed = await TokenConfirmationModal.show(
      context: context,
      tokensRequired: tokensRequired,
      currentBalance: _tokenBalance,
    );

    if (confirmed == true) {
      _generateNewAnalysis();
    }
  }

  Future<void> _generateNewAnalysis() async {
    setState(() {
      _isLoading = true;
      _showTerminalAnimation = true;
      _industryData = [];
    });

    final Future<void> animationDelay = Future.delayed(
      const Duration(seconds: 8),
    );

    print('🤖 Wymuszanie generacji nowych analiz rynku...');
    final Future<List<IndustrySection>?> newAnalysisCall =
        MarketAnalysisApi.generateNewAnalysis();

    final results = await Future.wait([animationDelay, newAnalysisCall]);
    final List<IndustrySection>? result = results[1] as List<IndustrySection>?;

    setState(() {
      _isLoading = false;
      _showTerminalAnimation = false;
      _industryData = result ?? [];
    });

    final newBalance = await BillingApi.getTokenBalance() ?? 0;
    setState(() {
      _tokenBalance = newBalance;
    });

    print(
      result != null && result.isNotEmpty
          ? '✅ Wygenerowano nowe analizy rynku'
          : '❌ Błąd generowania',
    );
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
    if (_isCheckingProfile) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!_hasProfile) {
      return const CreateFutureView();
    }

    return Scaffold(
      backgroundColor:
          _showTerminalAnimation ? Colors.black : const Color(0xFF0e0e0e),
      appBar:
          _showTerminalAnimation
              ? null
              : AppBar(
                title: const Text(
                  "Market Analysis",
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
                backgroundColor: const Color(0xFF0e0e0e),
                elevation: 0,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  onPressed:
                      () => Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (_) => const HomeScreen()),
                      ),
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
        Image.asset(
          'assets/img/vocare.png',
          height: 100,
          fit: BoxFit.contain,
          color: Colors.white,
        ),
        const SizedBox(height: 40),
        const MarketAnalysisTerminal(),
        const SizedBox(height: 40),
        Text(
          'Generating your personalized market analysis...',
          style: TextStyle(color: Colors.grey.shade400, fontSize: 16),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildMainContent() {
    return Container(
      color: const Color(0xFF0e0e0e),
      child: LayoutBuilder(
        builder: (context, constraints) {
          return Column(
            children: [
              Expanded(
                child:
                    _isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : _industryData.isNotEmpty
                        ? _buildAnalysisContent()
                        : _buildEmptyState(),
              ),
              Container(
                width: constraints.maxWidth,
                height: 100,
                padding: const EdgeInsets.all(16),
                color: const Color(0xFF0e0e0e),
                child: Center(child: _buildGenerateButton()),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAnalysisContent() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return AnimatedOpacity(
          opacity: _industryData.isNotEmpty ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 500),
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: Container(
              color: const Color(0xFF0e0e0e),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Header - identyczny jak webówka
                    const Text(
                      'Market Analysis',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF915EFF),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),

                    // Industry Cards - identyczne jak webówka (już gotowe)
                    ...(_industryData).asMap().entries.map((entry) {
                      final index = entry.key;
                      final industrySection = entry.value;

                      return TweenAnimationBuilder<double>(
                        duration: Duration(milliseconds: 800 + (index * 200)),
                        tween: Tween(begin: 0.0, end: 1.0),
                        builder: (context, value, child) {
                          return Transform.translate(
                            offset: Offset(0, 20 * (1 - value)),
                            child: Opacity(
                              opacity: value,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                child: IndustrySectionCard(
                                  index: index,
                                  industry: industrySection.industry,
                                  averageSalary: industrySection.averageSalary,
                                  employmentRate:
                                      industrySection.employmentRate,
                                  growthForecast:
                                      industrySection.growthForecast,
                                ),
                              ),
                            ),
                          );
                        },
                      );
                    }).toList(),

                    const SizedBox(height: 40),

                    // Current Market Trends - DOKŁADNIE jak webówka
                    _buildCurrentMarketTrends(),

                    const SizedBox(height: 40),

                    // In-Demand Skills - DOKŁADNIE jak webówka
                    _buildInDemandSkills(),

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  // 🎯 Current Market Trends - DOKŁADNIE jak na webówce
  Widget _buildCurrentMarketTrends() {
    return FutureBuilder<List<MarketTrend>?>(
      future: _getMarketTrends(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox.shrink();
        }

        final trends = snapshot.data!;

        return TweenAnimationBuilder<double>(
          duration: const Duration(milliseconds: 1000),
          tween: Tween(begin: 0.0, end: 1.0),
          builder: (context, value, child) {
            return Transform.translate(
              offset: Offset(0, 20 * (1 - value)),
              child: Opacity(
                opacity: value,
                child: Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(maxWidth: 1200),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1a1a1a),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF2a2a2a)),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header sekcji
                      const Text(
                        'Current Market Trends',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Grid trendów - DOKŁADNIE jak webówka
                      LayoutBuilder(
                        builder: (context, constraints) {
                          return _buildTrendsWebGrid(trends, constraints);
                        },
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  // 🎯 Grid identyczny z webówką
  Widget _buildTrendsWebGrid(
    List<MarketTrend> trends,
    BoxConstraints constraints,
  ) {
    if (constraints.maxWidth > 600) {
      // Desktop/tablet - 2 kolumny jak webówka
      List<Widget> rows = [];
      for (int i = 0; i < trends.length; i += 2) {
        rows.add(
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildWebTrendCard(trends[i])),
              const SizedBox(width: 16),
              if (i + 1 < trends.length)
                Expanded(child: _buildWebTrendCard(trends[i + 1]))
              else
                const Expanded(child: SizedBox()),
            ],
          ),
        );
        if (i + 2 < trends.length) {
          rows.add(const SizedBox(height: 16));
        }
      }
      return Column(children: rows);
    } else {
      // Mobile - jedna kolumna
      return Column(
        children:
            trends
                .map(
                  (trend) => Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: _buildWebTrendCard(trend),
                  ),
                )
                .toList(),
      );
    }
  }

  // 🎯 Karta trendu - DOKŁADNIE jak webówka
  Widget _buildWebTrendCard(MarketTrend trend) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF2a2a2a),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFF3a3a3a)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Nagłówek z emoji - identyczny jak webówka
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 20,
                height: 20,
                alignment: Alignment.center,
                child: Text(
                  _getTrendEmoji(trend.trendName),
                  style: const TextStyle(fontSize: 14),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  trend.trendName,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    height: 1.3,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Opis trendu
          Text(
            trend.description,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFFa0a0a0),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),

          // Impact box - DOKŁADNIE jak webówka
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF915EFF).withOpacity(0.15),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: const Color(0xFF915EFF).withOpacity(0.3),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 1),
                  child: const Icon(
                    Icons.trending_up,
                    color: Color(0xFF915EFF),
                    size: 14,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    trend.impact,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF915EFF),
                      fontWeight: FontWeight.w500,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 🎯 In-Demand Skills - DOKŁADNIE jak webówka
  Widget _buildInDemandSkills() {
    return FutureBuilder<List<SkillDemand>?>(
      future: _getSkillDemands(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox.shrink();
        }

        final skills = snapshot.data!;

        return TweenAnimationBuilder<double>(
          duration: const Duration(milliseconds: 1200),
          tween: Tween(begin: 0.0, end: 1.0),
          builder: (context, value, child) {
            return Transform.translate(
              offset: Offset(0, 20 * (1 - value)),
              child: Opacity(
                opacity: value,
                child: Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(maxWidth: 1200),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1a1a1a),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF2a2a2a)),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header sekcji
                      const Text(
                        'In-Demand Skills',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Grid umiejętności - DOKŁADNIE jak webówka
                      LayoutBuilder(
                        builder: (context, constraints) {
                          return _buildSkillsWebGrid(skills, constraints);
                        },
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  // 🎯 Skills grid identyczny z webówką
  Widget _buildSkillsWebGrid(
    List<SkillDemand> skills,
    BoxConstraints constraints,
  ) {
    if (constraints.maxWidth > 800) {
      // Desktop - 4 kolumny jak webówka
      List<Widget> rows = [];
      for (int i = 0; i < skills.length; i += 4) {
        List<Widget> rowChildren = [];
        for (int j = 0; j < 4; j++) {
          if (i + j < skills.length) {
            rowChildren.add(Expanded(child: _buildWebSkillCard(skills[i + j])));
            if (j < 3 && i + j + 1 < skills.length) {
              rowChildren.add(const SizedBox(width: 16));
            }
          } else {
            rowChildren.add(const Expanded(child: SizedBox()));
          }
        }
        rows.add(
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: rowChildren,
          ),
        );
        if (i + 4 < skills.length) {
          rows.add(const SizedBox(height: 16));
        }
      }
      return Column(children: rows);
    } else if (constraints.maxWidth > 400) {
      // Tablet - 2 kolumny
      List<Widget> rows = [];
      for (int i = 0; i < skills.length; i += 2) {
        rows.add(
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildWebSkillCard(skills[i])),
              const SizedBox(width: 16),
              if (i + 1 < skills.length)
                Expanded(child: _buildWebSkillCard(skills[i + 1]))
              else
                const Expanded(child: SizedBox()),
            ],
          ),
        );
        if (i + 2 < skills.length) {
          rows.add(const SizedBox(height: 16));
        }
      }
      return Column(children: rows);
    } else {
      // Mobile - jedna kolumna
      return Column(
        children:
            skills
                .map(
                  (skill) => Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: _buildWebSkillCard(skill),
                  ),
                )
                .toList(),
      );
    }
  }

  // 🎯 Skill card - DOKŁADNIE jak webówka
  Widget _buildWebSkillCard(SkillDemand skill) {
    final color = _getDemandColor(skill.demandLevel);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF2a2a2a),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFF3a3a3a)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Nazwa umiejętności z API + emoji
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 20,
                height: 20,
                alignment: Alignment.center,
                child: Text(
                  _getSkillEmoji(skill.skill),
                  style: const TextStyle(fontSize: 14),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  skill.skill, // Bezpośrednio z API
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Poziom popytu z API
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'Demand level: ${skill.demandLevel}', // Z API
              style: const TextStyle(
                fontSize: 11,
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Branża z API
          Text(
            skill.industry, // Bezpośrednio z API
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFFa0a0a0),
              fontStyle: FontStyle.italic,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // HELPER: Emoji dla trendów na podstawie danych z API
  String _getTrendEmoji(String trendName) {
    final title = trendName.toLowerCase();

    if (title.contains('hybrid') ||
        title.contains('hybrydowy') ||
        title.contains('zdalne') ||
        title.contains('remote') ||
        title.contains('praca')) {
      return '🏠';
    } else if (title.contains('ci/cd') ||
        title.contains('pipeline') ||
        title.contains('quality') ||
        title.contains('standaryzacja')) {
      return '🚀';
    } else if (title.contains('api') ||
        title.contains('microservices') ||
        title.contains('mikroserw') ||
        title.contains('kontraktów')) {
      return '🔗';
    } else if (title.contains('playwright') ||
        title.contains('cypress') ||
        title.contains('dominacja') ||
        title.contains('typescript')) {
      return '🎭';
    } else if (title.contains('sdet') || title.contains('shift')) {
      return '⚡';
    } else {
      return '📈';
    }
  }

  // HELPER: Emoji dla umiejętności na podstawie danych z API
  String _getSkillEmoji(String skillName) {
    final skill = skillName.toLowerCase();

    if (skill.contains('typescript') || skill.contains('javascript')) {
      return '💻';
    } else if (skill.contains('docker') || skill.contains('kubernetes')) {
      return '🐳';
    } else if (skill.contains('ci/cd') ||
        skill.contains('jenkins') ||
        skill.contains('github')) {
      return '🚀';
    } else if (skill.contains('cypress') || skill.contains('playwright')) {
      return '🎭';
    } else if (skill.contains('api') ||
        skill.contains('rest') ||
        skill.contains('graphql') ||
        skill.contains('postman')) {
      return '🔗';
    } else if (skill.contains('observability') ||
        skill.contains('monitoring') ||
        skill.contains('grafana')) {
      return '📊';
    } else if (skill.contains('pact') || skill.contains('kontraktowe')) {
      return '🤝';
    } else if (skill.contains('continuous') || skill.contains('integration')) {
      return '🔄';
    } else if (skill.contains('java') && !skill.contains('javascript')) {
      return '☕';
    } else if (skill.contains('automation') ||
        skill.contains('automatyzacja')) {
      return '🤖';
    } else {
      return '🛠️';
    }
  }

  // HELPER: Kolory dla poziomów popytu - DOKŁADNIE jak webówka
  Color _getDemandColor(String demandLevel) {
    switch (demandLevel.toLowerCase()) {
      case 'bardzo wysoki':
        return const Color(0xFFDC2626); // Czerwony jak webówka
      case 'wysoki':
        return const Color(0xFFEA580C); // Pomarańczowy jak webówka
      case 'średni/wysoki':
        return const Color(0xFFEA580C); // Pomarańczowy jak webówka
      case 'średni':
        return const Color(0xFF2563EB); // Niebieski jak webówka
      case 'niski':
        return const Color(0xFF6B7280); // Szary jak webówka
      default:
        return const Color(0xFF2563EB); // Niebieski domyślny
    }
  }

  // HELPER: Pobierz trendy z API
  Future<List<MarketTrend>?> _getMarketTrends() async {
    try {
      return await MarketAnalysisApi.fetchMarketTrends();
    } catch (e) {
      print('Error fetching market trends: $e');
      return null;
    }
  }

  // HELPER: Pobierz umiejętności z API z sortowaniem
  Future<List<SkillDemand>?> _getSkillDemands() async {
    try {
      final skills = await MarketAnalysisApi.fetchSkillDemand();

      if (skills != null && skills.isNotEmpty) {
        return _sortSkillsByDemand(skills);
      }

      return skills;
    } catch (e) {
      print('Error fetching skill demands: $e');
      return null;
    }
  }

  // HELPER: Sortowanie umiejętności według poziomu popytu
  List<SkillDemand> _sortSkillsByDemand(List<SkillDemand> skills) {
    final demandOrder = {
      'bardzo wysoki': 5,
      'wysoki': 4,
      'średni/wysoki': 3,
      'średni': 2,
      'niski': 1,
    };

    skills.sort((a, b) {
      final aValue = demandOrder[a.demandLevel.toLowerCase()] ?? 0;
      final bValue = demandOrder[b.demandLevel.toLowerCase()] ?? 0;
      return bValue.compareTo(aValue);
    });

    return skills;
  }

  Widget _buildEmptyState() {
    return Container(
      color: const Color(0xFF0e0e0e),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.analytics, size: 80, color: Colors.grey.shade400),
            const SizedBox(height: 20),
            Text(
              'Ready to analyze the job market?',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade300,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              'Click the button below to generate personalized market insights based on current trends.',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade400),
              textAlign: TextAlign.center,
            ),
          ],
        ),
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
              const Text(
                'Generating market analysis...',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        )
        : CustomButton(
          text:
              _industryData.isNotEmpty
                  ? "Generate new analysis (3 tokens)"
                  : "Generate market analysis (3 tokens)",
          onPressed:
              _industryData.isNotEmpty
                  ? _showTokenConfirmationModal
                  : _loadAnalysis,
        );
  }
}

// Terminal Animation - bez zmian
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
