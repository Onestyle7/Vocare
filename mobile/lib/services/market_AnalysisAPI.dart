import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/industry_section.dart';
import '../models/skill_demand.dart';
import '../models/market_trend.dart';

class MarketAnalysisApi {
  static const _base = 'http://localhost:8080/api/MarketAnalysis';

  /// 🆕 Pobiera ostatnie analizy rynku (jeśli istnieją)
  static Future<List<IndustrySection>?> fetchLastAnalysis() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_base/latest');

    print('🔍 CHECKING LAST MARKET ANALYSIS:');
    print('📦 URL: $url');
    print(
      '🔑 Token: ${token.isNotEmpty ? 'PRESENT (${token.substring(0, 10)}...)' : 'MISSING'}',
    );

    try {
      final response = await http
          .get(
            url,
            headers: {
              'Authorization': 'Bearer $token',
              'accept': 'application/json',
            },
          )
          .timeout(Duration(seconds: 10));

      print('📥 Last Analysis Status: ${response.statusCode}');
      print('📄 Response Headers: ${response.headers}');
      print('💬 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Found existing market analysis');
        print('🔍 Data structure: ${data.runtimeType}');
        print('🔍 Data keys: ${data is Map ? data.keys : 'Not a Map'}');

        // 🔧 NAPRAWIONA LOGIKA PARSOWANIA
        List<IndustrySection> industries = [];

        if (data is Map<String, dynamic>) {
          if (data.containsKey('marketAnalysis')) {
            final marketAnalysis = data['marketAnalysis'];
            print('🔍 marketAnalysis type: ${marketAnalysis.runtimeType}');

            if (marketAnalysis is Map<String, dynamic> &&
                marketAnalysis.containsKey('industryStatistics')) {
              final List<dynamic> stats = marketAnalysis['industryStatistics'];
              print('✅ Found industryStatistics with ${stats.length} items');
              industries =
                  stats.map((e) => IndustrySection.fromJson(e)).toList();
            }
          } else if (data.containsKey('industryStatistics')) {
            // Bezpośrednio w głównym obiekcie
            final List<dynamic> stats = data['industryStatistics'];
            print(
              '✅ Found direct industryStatistics with ${stats.length} items',
            );
            industries = stats.map((e) => IndustrySection.fromJson(e)).toList();
          }
        } else if (data is List) {
          // Bezpośrednio lista
          print('✅ Direct list with ${data.length} items');
          industries = data.map((e) => IndustrySection.fromJson(e)).toList();
        }

        if (industries.isNotEmpty) {
          print('✅ Successfully parsed ${industries.length} industries');
          for (int i = 0; i < industries.length; i++) {
            print('   ${i + 1}. ${industries[i].industry}');
          }
          return industries;
        } else {
          print('⚠️ No industries found in response');
          return null;
        }
      } else if (response.statusCode == 404) {
        print('ℹ️ No existing market analysis found (404)');
        return null; // Brak poprzednich analiz
      } else {
        print("❌ Last Analysis Error: ${response.statusCode}");
        print("❌ Error body: ${response.body}");
        return null;
      }
    } catch (e) {
      print("💥 Last Analysis Connection error: $e");
      return null;
    }
  }

  /// 🔄 Generuje nowe analizy rynku (kosztuje tokeny)
  static Future<List<IndustrySection>?> generateNewAnalysis() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse(_base);

    print('🤖 GENERATING NEW MARKET ANALYSIS:');
    print('📦 URL: $url');
    print(
      '🔑 Token: ${token.isNotEmpty ? 'PRESENT (${token.substring(0, 10)}...)' : 'MISSING'}',
    );
    print('💰 This will cost tokens');

    try {
      final response = await http
          .get(
            url,
            headers: {
              'Authorization': 'Bearer $token',
              'accept': 'application/json',
            },
          )
          .timeout(Duration(minutes: 5)); // Longer timeout for generation

      print('📥 New Analysis Status: ${response.statusCode}');
      print('📄 Response Headers: ${response.headers}');
      print('💬 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ New market analysis generated successfully');
        print('🔍 Data structure: ${data.runtimeType}');
        print('🔍 Data keys: ${data is Map ? data.keys : 'Not a Map'}');

        // 🔧 NAPRAWIONA LOGIKA PARSOWANIA - identyczna jak w fetchLastAnalysis
        List<IndustrySection> industries = [];

        if (data is Map<String, dynamic>) {
          if (data.containsKey('marketAnalysis')) {
            final marketAnalysis = data['marketAnalysis'];
            print('🔍 marketAnalysis type: ${marketAnalysis.runtimeType}');

            if (marketAnalysis is Map<String, dynamic> &&
                marketAnalysis.containsKey('industryStatistics')) {
              final List<dynamic> stats = marketAnalysis['industryStatistics'];
              print('✅ Found industryStatistics with ${stats.length} items');
              industries =
                  stats.map((e) => IndustrySection.fromJson(e)).toList();
            }
          } else if (data.containsKey('industryStatistics')) {
            // Bezpośrednio w głównym obiekcie
            final List<dynamic> stats = data['industryStatistics'];
            print(
              '✅ Found direct industryStatistics with ${stats.length} items',
            );
            industries = stats.map((e) => IndustrySection.fromJson(e)).toList();
          }
        } else if (data is List) {
          // Bezpośrednio lista
          print('✅ Direct list with ${data.length} items');
          industries = data.map((e) => IndustrySection.fromJson(e)).toList();
        }

        if (industries.isNotEmpty) {
          print('✅ Successfully parsed ${industries.length} industries');
          for (int i = 0; i < industries.length; i++) {
            print('   ${i + 1}. ${industries[i].industry}');
          }
          return industries;
        } else {
          print('⚠️ No industries found in generated response');
          return null;
        }
      } else {
        print("❌ New Analysis Error: ${response.statusCode}");
        print("❌ Error body: ${response.body}");
        return null;
      }
    } catch (e) {
      print("💥 New Analysis Connection error: $e");
      return null;
    }
  }

  /// 🔄 DEPRECATED: Stara metoda - zastąpiona przez fetchLastAnalysis/generateNewAnalysis
  @deprecated
  static Future<List<IndustrySection>?> fetchIndustryStatistics() async {
    print('⚠️ DEPRECATED METHOD CALLED - redirecting to fetchLastAnalysis');
    return await fetchLastAnalysis();
  }

  /// Stare metody dla skill demand i market trends - aktualizowane
  static Future<List<SkillDemand>?> fetchSkillDemand() async {
    final data = await _getMarketAnalysisDataFromLatest();
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
    final data = await _getMarketAnalysisDataFromLatest();
    if (data == null) return null;

    try {
      final List<dynamic> trends = data['marketTrends'];
      return trends.map((e) => MarketTrend.fromJson(e)).toList();
    } catch (e) {
      print('fetchMarketTrends parse error: $e');
      return null;
    }
  }

  /// 🆕 Helper method - najpierw próbuj z /latest, potem z głównego endpoint
  static Future<Map<String, dynamic>?>
  _getMarketAnalysisDataFromLatest() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken');

      if (token == null) {
        print('Brak tokenu dostępu');
        return null;
      }

      // Spróbuj najpierw z /latest
      final latestUrl = Uri.parse('$_base/latest');
      print('🔍 Trying latest data from: $latestUrl');

      try {
        final latestResp = await http
            .get(
              latestUrl,
              headers: {
                'Authorization': 'Bearer $token',
                'Content-Type': 'application/json',
              },
            )
            .timeout(Duration(seconds: 10));

        if (latestResp.statusCode == 200) {
          final latestData = jsonDecode(latestResp.body);
          if (latestData is Map<String, dynamic> &&
              latestData.containsKey('marketAnalysis')) {
            print('✅ Found latest market analysis data');
            return latestData['marketAnalysis'];
          }
        }
      } catch (e) {
        print('⚠️ Latest endpoint failed: $e');
      }

      // Fallback do głównego endpoint
      print('🔄 Falling back to main endpoint');
      final url = Uri.parse(_base);
      final resp = await http
          .get(
            url,
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          )
          .timeout(Duration(minutes: 5));

      if (resp.statusCode == 200) {
        final body = jsonDecode(resp.body);
        if (body is Map<String, dynamic> &&
            body.containsKey('marketAnalysis')) {
          return body['marketAnalysis'];
        }
        return body;
      } else {
        print('_getMarketAnalysisDataFromLatest error: ${resp.statusCode}');
      }
    } catch (e) {
      print('_getMarketAnalysisDataFromLatest exception: $e');
    }

    return null;
  }

  /// Metoda do sprawdzania kosztów generowania
  static Future<Map<String, dynamic>?> getGenerationCost() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_base/generation-cost');

    try {
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print("Error getting generation cost: $e");
    }

    // Fallback - domyślny koszt
    return {'tokensRequired': 3, 'description': 'Generate market analysis'};
  }
}
