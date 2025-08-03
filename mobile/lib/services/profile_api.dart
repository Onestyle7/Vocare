import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ProfileApi {
  // 🔧 POPRAWIONE: zmieniony port z 5001 na 8080 i protokół z https na http
  static const String baseUrl = 'http://localhost:8080/api/UserProfile';

  static Future<bool> createUserProfile(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';

    // 🔍 DEBUG: Wypisz dane które wysyłasz
    print('🚀 SENDING PROFILE DATA:');
    print('📦 URL: $baseUrl/CreateCurrentUserProfile');
    print(
      '🔑 Token: ${token.isNotEmpty ? 'PRESENT (${token.substring(0, 10)}...)' : 'MISSING'}',
    );
    print('📋 Data: ${jsonEncode(data)}');

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

      // 🔍 DEBUG: Wypisz pełną odpowiedź
      print('\n📥 RESPONSE:');
      print('🌐 Status Code: ${response.statusCode}');
      print('📄 Headers: ${response.headers}');
      print('💬 Body: ${response.body}');
      print('🔗 URL: ${response.request?.url}');

      // 🔍 Szczegółowa analiza statusu
      if (response.statusCode == 200) {
        print('✅ SUCCESS: Profile saved successfully');
        return true;
      } else {
        print('❌ ERROR: Failed with status ${response.statusCode}');

        // Analiza typowych błędów
        switch (response.statusCode) {
          case 400:
            print('🚫 BAD REQUEST: Check your data format');
            break;
          case 401:
            print('🔐 UNAUTHORIZED: Token invalid or expired');
            break;
          case 403:
            print('🚪 FORBIDDEN: Access denied');
            break;
          case 404:
            print('🔍 NOT FOUND: Endpoint doesn\'t exist');
            break;
          case 500:
            print('💥 SERVER ERROR: Backend problem');
            break;
          default:
            print('❓ UNKNOWN ERROR: Status ${response.statusCode}');
        }

        // Spróbuj sparsować błąd z body
        try {
          final errorData = jsonDecode(response.body);
          print('📝 Error details: $errorData');
        } catch (e) {
          print('📝 Raw error: ${response.body}');
        }

        return false;
      }
    } catch (e) {
      // 🔍 DEBUG: Błędy połączenia
      print('\n💥 CONNECTION ERROR:');
      print('🚨 Exception: $e');
      print('🌍 Check if backend is running on http://localhost:8080');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> getUserProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';

    // 🔍 DEBUG: Info o GET request
    print('🔍 GETTING USER PROFILE:');
    print('📦 URL: $baseUrl/GetCurrentUserProfile');
    print('🔑 Token: ${token.isNotEmpty ? 'PRESENT' : 'MISSING'}');

    final url = Uri.parse('$baseUrl/GetCurrentUserProfile');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📥 GET Response Status: ${response.statusCode}');
      print('📄 GET Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final fullResponse = jsonDecode(response.body);
        final userProfile = fullResponse['userProfile'];

        if (userProfile == null) {
          print("⚠️ Warning: No 'userProfile' field in response");
          print("📋 Full response structure: ${fullResponse.keys}");
          return null;
        }

        print("✅ Profile loaded successfully");
        return userProfile;
      } else {
        print("❌ Failed to get profile: ${response.statusCode}");
        print("📝 Error: ${response.body}");
        return null;
      }
    } catch (e) {
      print("💥 GET Profile error: $e");
      return null;
    }
  }

  // 🆕 Helper method do testowania połączenia
  static Future<bool> testConnection() async {
    print('🧪 TESTING API CONNECTION...');

    try {
      // Test podstawowego endpointu - można zmienić na health endpoint jeśli istnieje
      final url = Uri.parse(
        'http://localhost:8080/api/UserProfile/GetCurrentUserProfile',
      );
      final response = await http.get(url).timeout(Duration(seconds: 5));

      print('🌐 Connection test result: ${response.statusCode}');
      // 401 też jest OK - oznacza że endpoint istnieje, tylko nie mamy tokenu
      return response.statusCode < 500 || response.statusCode == 401;
    } catch (e) {
      print('   Connection test failed: $e');
      print('   Possible issues:');
      print('   - Backend not running on port 8080');
      print('   - Wrong URL');
      print('   - CORS problems');
      return false;
    }
  }

  // 🆕 Helper do walidacji danych przed wysłaniem
  static String? validateProfileData(Map<String, dynamic> data) {
    print('🔍 VALIDATING PROFILE DATA...');

    // Sprawdź wymagane pola
    final requiredFields = ['firstName', 'lastName', 'country'];
    for (String field in requiredFields) {
      if (data[field] == null || data[field].toString().trim().isEmpty) {
        return 'Missing required field: $field';
      }
    }

    // Sprawdź struktury
    if (data['education'] != null && data['education'] is! List) {
      return 'Education must be a list';
    }

    if (data['workExperience'] != null && data['workExperience'] is! List) {
      return 'WorkExperience must be a list';
    }

    if (data['financialSurvey'] != null && data['financialSurvey'] is! Map) {
      return 'FinancialSurvey must be an object';
    }

    print('✅ Data validation passed');
    return null;
  }
}
