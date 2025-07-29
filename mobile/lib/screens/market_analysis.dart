import 'package:flutter/material.dart';
import 'package:vocare/models/industry_section.dart';
import 'package:vocare/services/market_AnalysisAPI.dart';
import 'package:vocare/widgets/industry_section_card.dart';

class MarketAnalysisPage extends StatefulWidget {
  const MarketAnalysisPage({super.key});

  @override
  State<MarketAnalysisPage> createState() => _MarketAnalysisPageState();
}

class _MarketAnalysisPageState extends State<MarketAnalysisPage> {
  bool _loading = true;
  List<IndustrySection> _sections = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final result = await MarketAnalysisApi.fetchIndustryStatistics();

    if (result != null) {
      setState(() {
        _sections = result;
        _loading = false;
      });
    } else {
      setState(() => _loading = false);
    }
  }

  Future<void> _generateNewAnalysis() async {
    // Jeśli masz POST /api/MarketAnalysis/generate – możesz go tu wywołać
    // await MarketAnalysisApi.generateNewAnalysis();
    await _loadData(); // Na razie tylko ponowne pobranie
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Job Market Analysis"),
        backgroundColor: Colors.black87,
      ),
      body: Column(
        children: [
          Expanded(
            child:
                _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _sections.isEmpty
                    ? const Center(child: Text("Brak danych do wyświetlenia"))
                    : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _sections.length,
                      itemBuilder: (context, index) {
                        final industry = _sections[index];
                        return IndustrySectionCard(
                          index: index,
                          industry: industry.industry,
                          averageSalary: industry.averageSalary,
                          employmentRate: industry.employmentRate,
                          growthForecast: industry.growthForecast,
                        );
                      },
                    ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF915EFF),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 14,
                ),
              ),
              onPressed: _generateNewAnalysis,
              child: const Text(
                "Generuj nową analizę rynku",
                style: TextStyle(fontSize: 16, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
