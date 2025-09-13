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

  /// 🔧 POPRAWIONA metoda fetchMarketTrends
  static Future<List<MarketTrend>?> fetchMarketTrends() async {
    final data = await _getMarketAnalysisDataFromLatest();
    if (data == null) {
      print('❌ No market analysis data available for trends');
      return null;
    }

    try {
      print('🔍 Looking for marketTrends in data...');
      print('🔍 Available keys: ${data.keys}');

      List<dynamic>? trendsData;

      // Sprawdź różne możliwe struktury
      if (data.containsKey('marketTrends')) {
        trendsData = data['marketTrends'] as List<dynamic>?;
        print('✅ Found marketTrends directly');
      } else if (data.containsKey('marketAnalysis')) {
        final marketAnalysis = data['marketAnalysis'] as Map<String, dynamic>?;
        if (marketAnalysis?.containsKey('marketTrends') == true) {
          trendsData = marketAnalysis!['marketTrends'] as List<dynamic>?;
          print('✅ Found marketTrends in marketAnalysis');
        }
      }

      if (trendsData != null && trendsData.isNotEmpty) {
        final trends = trendsData.map((e) => MarketTrend.fromJson(e)).toList();
        print('✅ Successfully parsed ${trends.length} market trends');
        return trends;
      } else {
        print('⚠️ No marketTrends found in response');
        return null;
      }
    } catch (e) {
      print('❌ fetchMarketTrends parse error: $e');
      return null;
    }
  }

  /// 🔧 POPRAWIONA metoda fetchSkillDemand
  static Future<List<SkillDemand>?> fetchSkillDemand() async {
    final data = await _getMarketAnalysisDataFromLatest();
    if (data == null) {
      print('❌ No market analysis data available for skills');
      return null;
    }

    try {
      print('🔍 Looking for skillDemand in data...');
      print('🔍 Available keys: ${data.keys}');

      List<dynamic>? skillsData;

      // Sprawdź różne możliwe struktury
      if (data.containsKey('skillDemand')) {
        skillsData = data['skillDemand'] as List<dynamic>?;
        print('✅ Found skillDemand directly');
      } else if (data.containsKey('marketAnalysis')) {
        final marketAnalysis = data['marketAnalysis'] as Map<String, dynamic>?;
        if (marketAnalysis?.containsKey('skillDemand') == true) {
          skillsData = marketAnalysis!['skillDemand'] as List<dynamic>?;
          print('✅ Found skillDemand in marketAnalysis');
        }
      }

      if (skillsData != null && skillsData.isNotEmpty) {
        final skills = skillsData.map((e) => SkillDemand.fromJson(e)).toList();
        print('✅ Successfully parsed ${skills.length} skill demands');
        return skills;
      } else {
        print('⚠️ No skillDemand found in response');
        return null;
      }
    } catch (e) {
      print('❌ fetchSkillDemand parse error: $e');
      return null;
    }
  }

  /// 🔧 POPRAWIONA metoda _getMarketAnalysisDataFromLatest
  static Future<Map<String, dynamic>?>
  _getMarketAnalysisDataFromLatest() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('accessToken');

      if (token == null) {
        print('❌ Brak tokenu dostępu');
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
          print('✅ Latest response received');
          print('🔍 Response structure: ${latestData.runtimeType}');
          print(
            '🔍 Top-level keys: ${latestData is Map ? latestData.keys : 'Not a Map'}',
          );

          // Jeśli mamy marketAnalysis w odpowiedzi, zwróć to
          if (latestData is Map<String, dynamic>) {
            if (latestData.containsKey('marketAnalysis')) {
              print('✅ Found marketAnalysis in latest response');
              return latestData; // Zwróć całą strukturę
            } else {
              // Może całe latestData to już marketAnalysis?
              if (latestData.containsKey('industryStatistics') ||
                  latestData.containsKey('marketTrends') ||
                  latestData.containsKey('skillDemand')) {
                print('✅ Latest data looks like direct marketAnalysis');
                return {'marketAnalysis': latestData};
              }
            }
          }
        } else {
          print('⚠️ Latest endpoint returned: ${latestResp.statusCode}');
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
        print('✅ Main endpoint response received');
        print('🔍 Response structure: ${body.runtimeType}');
        print('🔍 Top-level keys: ${body is Map ? body.keys : 'Not a Map'}');

        if (body is Map<String, dynamic>) {
          if (body.containsKey('marketAnalysis')) {
            return body; // Zwróć całą strukturę
          } else {
            // Może całe body to już marketAnalysis?
            if (body.containsKey('industryStatistics') ||
                body.containsKey('marketTrends') ||
                body.containsKey('skillDemand')) {
              return {'marketAnalysis': body};
            }
          }
        }

        return body; // Zwróć co mamy
      } else {
        print('❌ Main endpoint error: ${resp.statusCode}');
      }
    } catch (e) {
      print('💥 _getMarketAnalysisDataFromLatest exception: $e');
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
