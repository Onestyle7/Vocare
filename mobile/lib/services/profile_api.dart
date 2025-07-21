import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ProfileApi {
  static const String baseUrl = 'http://localhost:8080/api/UserProfile';

  static Future<bool> createUserProfile(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';

    final url = Uri.parse('$baseUrl/CreateCurrentUserProfile');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Błąd połączenia: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> getUserProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';

    final url = Uri.parse('$baseUrl/GetCurrentUserProfile');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final fullResponse = jsonDecode(response.body);
        final userProfile = fullResponse['userProfile'];

        if (userProfile == null) {
          print("Brak pola 'userProfile' w odpowiedzi.");
          return null;
        }

        return userProfile;
      } else {
        print("Nie udało się pobrać danych: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      print("Błąd podczas pobierania danych: $e");
      return null;
    }
  }
}
