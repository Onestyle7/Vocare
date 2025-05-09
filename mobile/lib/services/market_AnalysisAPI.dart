import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/industry_section.dart';
import '../models/skill_demand.dart';
import '../models/market_trend.dart';

class MarketAnalysisApi {
  static const _base = 'https://localhost:5001/api/MarketAnalysis';

  static Future<Map<String, dynamic>?> _getMarketAnalysisData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken');

      if (token == null) {
        print('Brak tokenu dostępu');
        return null;
      }

      final url = Uri.parse(_base);
      final resp = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (resp.statusCode == 200) {
        final body = jsonDecode(resp.body);
        return body['marketAnalysis'];
      } else {
        print('_getMarketAnalysisData error: ${resp.statusCode}');
      }
    } catch (e) {
      print('_getMarketAnalysisData exception: $e');
    }

    return null;
  }

  static Future<List<IndustrySection>?> fetchIndustryStatistics() async {
    final data = await _getMarketAnalysisData();
    if (data == null) return null;

    try {
      final List<dynamic> stats = data['industryStatistics'];
      return stats.map((e) => IndustrySection.fromJson(e)).toList();
    } catch (e) {
      print('fetchIndustryStatistics parse error: $e');
      return null;
    }
  }

  static Future<List<SkillDemand>?> fetchSkillDemand() async {
    final data = await _getMarketAnalysisData();
    if (data == null) return null;

    try {
      final List<dynamic> skills = data['skillDemand'];
      return skills.map((e) => SkillDemand.fromJson(e)).toList();
    } catch (e) {
      print('fetchSkillDemand parse error: $e');
      return null;
    }
  }

  static Future<List<MarketTrend>?> fetchMarketTrends() async {
    final data = await _getMarketAnalysisData();
    if (data == null) return null;

    try {
      final List<dynamic> trends = data['marketTrends'];
      return trends.map((e) => MarketTrend.fromJson(e)).toList();
    } catch (e) {
      print('fetchMarketTrends parse error: $e');
      return null;
    }
  }
}
