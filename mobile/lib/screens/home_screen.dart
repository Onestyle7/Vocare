import 'package:flutter/material.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'package:vocare/widgets/vocare_hanging_tag.dart';
import 'package:vocare/widgets/profile_status_indicator.dart';
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/screens/market_analysis.dart';
import 'package:vocare/screens/pricing_screen.dart';
import 'package:vocare/services/profile_api.dart';
import 'package:vocare/services/biling_api.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  bool _isCheckingProfile = true;
  bool _hasProfile = false;
  int _tokenBalance = 0;
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _checkUserProfile();
    _loadTokenBalance();
  }

  void _initAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _fadeController, curve: Curves.easeOut));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _slideController, curve: Curves.easeOut));

    _fadeController.forward();
    _slideController.forward();
  }

  Future<void> _checkUserProfile() async {
    final profile = await ProfileApi.getUserProfile();
    final hasProfile =
        profile != null &&
        profile['firstName'] != null &&
        profile['firstName'].toString().trim().isNotEmpty;

    setState(() {
      _hasProfile = hasProfile;
      _isCheckingProfile = false;
    });
  }

  Future<void> _loadTokenBalance() async {
    final balance = await BillingApi.getTokenBalance() ?? 0;
    setState(() {
      _tokenBalance = balance;
    });
  }

  void _handleTryItOut() async {
    if (_isCheckingProfile) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Sprawdzanie profilu...')));
      return;
    }

    if (_hasProfile) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const AIAsistentPageScreen()),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const FillProfileScreen()),
      );
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: AnimatedBuilder(
          animation: Listenable.merge([_fadeAnimation, _slideAnimation]),
          builder: (context, child) {
            return FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      // Header z tokenami
                      _buildHeader(),

                      const SizedBox(height: 40),

                      // Hero Section
                      _buildHeroSection(isDark),

                      const SizedBox(height: 40),

                      // Quick Actions
                      _buildQuickActions(),

                      const SizedBox(height: 40),

                      // Features Overview
                      _buildFeaturesOverview(),

                      const SizedBox(height: 40),

                      // Statistics
                      if (_hasProfile) _buildUserStats(),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
      bottomNavigationBar: _buildBottomNavigation(),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          // Logo/Title
          const Text(
            'VOCARE',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              fontFamily: 'Poppins',
            ),
          ),
          const Spacer(),

          // Token Balance
          _buildTokenBalance(),
          const SizedBox(width: 16),

          // Theme Toggle
          const ThemeToggleButton(),
        ],
      ),
    );
  }

  Widget _buildTokenBalance() {
    return GestureDetector(
      onTap:
          () => Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const PricingScreen()),
          ),
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
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.add, color: Color(0xFF915EFF), size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Column(
        children: [
          // Main heading
          const Text(
            'UNLOCK \nYOUR \nGROWTH',
            style: TextStyle(
              fontSize: 42,
              fontWeight: FontWeight.bold,
              fontFamily: 'Poppins',
              height: 1.1,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 20),

          // Hanging Tag Animation
          VocareHangingTag(
            width: 240,
            height: 280,
            bandColor: const Color(0xFF915EFF),
            cardColor:
                isDark ? const Color(0xFF1E1E1E) : const Color(0xFFFFFFFF),
          ),

          const SizedBox(height: 15),

          // Dynamic subtitle
          Text(
            _isCheckingProfile
                ? 'Checking your profile...'
                : _hasProfile
                ? 'Continue your career journey with AI-powered insights.'
                : 'Discover your ideal career path with AI-powered recommendations tailored just for you.',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade600,
              height: 1.5,
              fontFamily: 'Poppins',
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 30),

          // Main CTA
          _isCheckingProfile
              ? const CircularProgressIndicator()
              : CustomButton(
                text: _hasProfile ? 'Continue to AI Assistant' : 'Try it out',
                onPressed: _handleTryItOut,
              ),

          // Additional button for users with profile
          if (!_isCheckingProfile && _hasProfile) ...[
            const SizedBox(height: 12),
            TextButton(
              onPressed:
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const FillProfileScreen(),
                    ),
                  ),
              child: const Text(
                'Edit Profile',
                style: TextStyle(
                  color: Color(0xFF915EFF),
                  fontSize: 16,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
          ],

          const SizedBox(height: 20),

          // Profile status
          ProfileStatusIndicator(
            isLoading: _isCheckingProfile,
            hasProfile: _hasProfile,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildActionCard(
                  icon: Icons.psychology,
                  title: 'AI Assistant',
                  subtitle: 'Get personalized recommendations',
                  color: const Color(0xFF915EFF),
                  onTap:
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const AIAsistentPageScreen(),
                        ),
                      ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildActionCard(
                  icon: Icons.analytics,
                  title: 'Market Analysis',
                  subtitle: 'Explore industry trends',
                  color: const Color(0xFF00D4FF),
                  onTap:
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const MarketAnalysisPage(),
                        ),
                      ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins',
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturesOverview() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Features',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 16),

          _buildFeatureItem(
            icon: Icons.auto_awesome,
            title: 'AI-Powered Recommendations',
            description:
                'Get personalized career suggestions based on your profile and preferences.',
          ),
          _buildFeatureItem(
            icon: Icons.trending_up,
            title: 'Market Analysis',
            description:
                'Stay updated with industry trends and salary benchmarks.',
          ),
          _buildFeatureItem(
            icon: Icons.person,
            title: 'Profile Management',
            description:
                'Comprehensive profile building with skills, experience, and goals.',
          ),
          _buildFeatureItem(
            icon: Icons.security,
            title: 'Secure & Private',
            description:
                'Your data is protected with enterprise-grade security.',
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF915EFF).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: const Color(0xFF915EFF), size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF915EFF).withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF915EFF).withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your Activity',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    'Profile',
                    'Complete',
                    Icons.check_circle,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    'Tokens',
                    '$_tokenBalance',
                    Icons.account_balance_wallet,
                  ),
                ),
                Expanded(
                  child: _buildStatItem('Analyses', '2', Icons.analytics),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF915EFF), size: 24),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'Poppins',
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
            fontFamily: 'Poppins',
          ),
        ),
      ],
    );
  }

  Widget _buildBottomNavigation() {
    return Container(
      height: 60,
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              ThemeToggleButton(),
              NavBarButtons(
                destinations: [
                  NavDestination.home,
                  NavDestination.profile,
                  NavDestination.logout,
                  NavDestination.assistent,
                  NavDestination.marketAnalysis,
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
