import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthApi {
  Future<String?> loginUser(String email, String password) async {
    final url = Uri.parse('https://localhost:5001/login');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'twoFactorCode': '',
          'twoFactorRecoveryCode': '',
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final accessToken = data['accessToken'] as String?;
        return accessToken;
      } else {
        print('Błąd logowania: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Błąd połączenia: $e');
      return null;
    }
  }

  static Future<String?> registerUser(String email, String password) async {
    final url = Uri.parse('https://localhost:5001/register');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({"email": email, "password": password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['accessToken'];
      } else {
        print('Błąd rejestracji: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Błąd połączenia: $e');
      return null;
    }
  }
}
