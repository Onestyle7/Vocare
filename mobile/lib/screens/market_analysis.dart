import 'package:flutter/material.dart';
import 'package:vocare/services/market_AnalysisAPI.dart';
import 'package:vocare/widgets/expandable_service_card.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'package:vocare/widgets/nav_bar_button.dart';

class MarketAnalysisPageScreen extends StatefulWidget {
  const MarketAnalysisPageScreen({Key? key}) : super(key: key);

  @override
  State<MarketAnalysisPageScreen> createState() =>
      _MarketAnalysisPageScreenState();
}

class _MarketAnalysisPageScreenState extends State<MarketAnalysisPageScreen> {
  final key1 = GlobalKey<ExpandableServiceCardState>();
  final key2 = GlobalKey<ExpandableServiceCardState>();
  final key3 = GlobalKey<ExpandableServiceCardState>();
  final key4 = GlobalKey<ExpandableServiceCardState>();

  bool _loading = false;
  bool _hasData = false;

  Future<void> _loadAnalysis() async {
    setState(() => _loading = true);

    final all = await MarketAnalysisApi.fetchAll();
    ();

    setState(() {
      _loading = false;
      _hasData = all != null && all.length >= 4;
    });

    if (_hasData) {
      key1.currentState?.loadExternalData({
        'subtitle': 'Insight 1',
        'content': all![0],
      });
      key2.currentState?.loadExternalData({
        'subtitle': 'Insight 2',
        'content': all![1],
      });
      key3.currentState?.loadExternalData({
        'subtitle': 'Insight 3',
        'content': all![2],
      });
      key4.currentState?.loadExternalData({
        'subtitle': 'Insight 4',
        'content': all![3],
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Market Analysis'),
        backgroundColor: const Color.fromARGB(222, 16, 14, 14),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              _loading
                  ? const Center(child: CircularProgressIndicator())
                  : !_hasData
                  ? Center(
                    child: ElevatedButton(
                      onPressed: _loadAnalysis,
                      child: const Text('Load Market Analysis'),
                    ),
                  )
                  : SingleChildScrollView(
                    child: Column(
                      children: [
                        ExpandableServiceCard(
                          key: key1,
                          number: 1,
                          title: 'Insight 1',
                        ),
                        ExpandableServiceCard(
                          key: key2,
                          number: 2,
                          title: 'Insight 2',
                        ),
                        ExpandableServiceCard(
                          key: key3,
                          number: 3,
                          title: 'Insight 3',
                        ),
                        ExpandableServiceCard(
                          key: key4,
                          number: 4,
                          title: 'Insight 4',
                        ),
                      ],
                    ),
                  ),
        ),
      ),
      bottomNavigationBar: Container(
        height: 60,
        decoration: const BoxDecoration(
          color: Color.fromARGB(222, 16, 14, 14),
          borderRadius: BorderRadius.only(
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
      ),
    );
  }
}
