import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vocare/models/ai_career_response.dart'; // UWAGA: dodaj ten plik najpierw

class AiApi {
  static Future<AiCareerResponse?> fetchFullRecommendation() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('https://localhost:5001/api/Ai/recommendations');

    try {
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return AiCareerResponse.fromJson(data);
      } else {
        print("Błąd API: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      print("Błąd połączenia: $e");
      return null;
    }
  }
}
