import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vocare/models/ai_career_response.dart';

class AiApi {
  static const String _baseUrl = 'http://localhost:8080/api/Ai';

  /// 🆕 Pobiera ostatnie rekomendacje (jeśli istnieją)
  static Future<AiCareerResponse?> fetchLastRecommendation() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_baseUrl/last-recommendation');

    print('🔍 CHECKING LAST RECOMMENDATION:');
    print('📦 URL: $url');

    try {
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'accept': 'application/json',
        },
      );

      print('📥 Last Recommendation Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Found existing recommendations');
        return AiCareerResponse.fromJson(data);
      } else if (response.statusCode == 404) {
        print('ℹ️ No existing recommendations found');
        return null; // Brak poprzednich rekomendacji
      } else {
        print("❌ Last Recommendation Error: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      print("💥 Last Recommendation Connection error: $e");
      return null;
    }
  }

  /// 🔄 Generuje nowe rekomendacje (kosztuje tokeny)
  static Future<AiCareerResponse?> generateNewRecommendation() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_baseUrl/recommendations');

    print('🤖 GENERATING NEW RECOMMENDATION:');
    print('📦 URL: $url');
    print('💰 This will cost tokens');

    try {
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'accept': 'application/json',
        },
      );

      print('📥 New Recommendation Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ New recommendations generated successfully');
        return AiCareerResponse.fromJson(data);
      } else {
        print("❌ New Recommendation Error: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      print("💥 New Recommendation Connection error: $e");
      return null;
    }
  }

  /// 🔄 DEPRECATED: Stara metoda - zastąpiona przez fetchLastRecommendation/generateNewRecommendation
  @deprecated
  static Future<AiCareerResponse?> fetchFullRecommendation() async {
    // Przekieruj na nową logikę
    return await fetchLastRecommendation();
  }

  /// Metoda do sprawdzania kosztów generowania
  static Future<Map<String, dynamic>?> getGenerationCost() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_baseUrl/generation-cost');

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
    return {
      'tokensRequired': 5,
      'description': 'Generate AI career recommendations',
    };
  }
}
