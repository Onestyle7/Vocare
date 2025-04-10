import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AiApi {
  static Future<String> fetchRecommendation() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('https://localhost:5001/api/Ai/recommendations');

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'accept': 'application/json',
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return _buildRecommendationText(data);
      } else {
        return 'Błąd pobierania danych: ${response.statusCode}';
      }
    } catch (e) {
      return 'Błąd połączenia: $e';
    }
  }

  static String _buildRecommendationText(Map<String, dynamic> json) {
    final recommendation = json['recommendation'];
    if (recommendation == null) return "Brak danych";

    final primaryPath = recommendation['primaryPath'] ?? "Nieznana ścieżka";
    final justification = recommendation['justification'] ?? "Brak uzasadnienia";
    final nextSteps = List<String>.from(recommendation['nextSteps'] ?? []);

    return '''
🎯 Ścieżka kariery: $primaryPath

📌 Uzasadnienie:
$justification

🪜 Następne kroki:
- ${nextSteps.join('\n- ')}
''';
  }
}
