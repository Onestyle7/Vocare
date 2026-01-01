import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthApi {
  Future<String?> loginUser(String email, String password) async {
    final url = Uri.parse('http://localhost:8080/login');

    print('🔐 LOGIN REQUEST:');
    print('📦 URL: $url');
    print('📧 Email: $email');

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

      print('📥 Login Response Status: ${response.statusCode}');
      print('📄 Login Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final accessToken = data['accessToken'] as String?;
        print('✅ Login successful, token received');
        return accessToken;
      } else {
        print('❌ Login failed: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('💥 Login connection error: $e');
      return null;
    }
  }

  static Future<String?> registerUser(
    String email,
    String password,
    String confirmPassword,
  ) async {
    final url = Uri.parse('http://localhost:8080/api/Auth/register');

    print('📝 REGISTER REQUEST:');
    print('📦 URL: $url');
    print('📧 Email: $email');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "email": email,
          "password": password,
          "confirmPassword": confirmPassword,
          "acceptMarketingConsent": true, // 🆕 Dodane - wymagane przez backend
        }),
      );

      print('📥 Register Response Status: ${response.statusCode}');
      print('📄 Register Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // 🔧 SPRAWDŹ RÓŻNE FORMATY ODPOWIEDZI

        // Format 1: { "success": true, "userId": "...", "accessToken": "..." }
        if (data['success'] == true) {
          print('✅ Registration successful (success=true)');

          // Spróbuj pobrać token jeśli jest
          final token =
              data['accessToken'] as String? ?? data['token'] as String?;

          if (token != null) {
            print('🔑 Token received from registration');
            return token;
          }

          // Jeśli nie ma tokenu, ale success=true, zaloguj użytkownika
          print('ℹ️ No token in registration response, attempting login...');
          final authApi = AuthApi();
          final loginToken = await authApi.loginUser(email, password);
          return loginToken;
        }

        // Format 2: { "accessToken": "..." } bezpośrednio
        if (data['accessToken'] != null) {
          print('✅ Registration successful (token received directly)');
          return data['accessToken'] as String;
        }

        // Format 3: { "token": "..." }
        if (data['token'] != null) {
          print('✅ Registration successful (token field)');
          return data['token'] as String;
        }

        // Format 4: Sukces ale bez tokenu - zaloguj automatycznie
        print('⚠️ Registration returned 200 but no token, attempting login...');
        final authApi = AuthApi();
        final loginToken = await authApi.loginUser(email, password);
        return loginToken;
      } else if (response.statusCode == 201) {
        // 201 Created - sukces rejestracji
        print('✅ Registration successful (201 Created)');

        // Automatycznie zaloguj po rejestracji
        final authApi = AuthApi();
        final loginToken = await authApi.loginUser(email, password);
        return loginToken;
      } else if (response.statusCode == 400) {
        // Bad Request - np. email już istnieje
        print('❌ Registration failed: 400 Bad Request');
        try {
          final errorData = jsonDecode(response.body);
          print('📝 Error details: $errorData');
        } catch (e) {
          print('📝 Error body: ${response.body}');
        }
        return null;
      } else if (response.statusCode == 409) {
        // Conflict - użytkownik już istnieje
        print('❌ Registration failed: 409 Conflict (user exists)');
        return null;
      } else {
        print('❌ Registration failed: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('💥 Registration connection error: $e');
      return null;
    }
  }
}
