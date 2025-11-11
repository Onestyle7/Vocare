// mobile/lib/services/google_auth_service.dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleAuthService {
  // 🔧 Konfiguracja Google Sign-In
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);

  // 🔧 Adres API backendu - ZMIENIONY NA TWÓJ ENDPOINT
  static const String _backendUrl = 'http://localhost:8080/api/Auth';

  /// Logowanie przez Google
  /// Zwraca access token z backendu lub null w przypadku błędu
  Future<String?> signInWithGoogle() async {
    try {
      print('🔵 Starting Google Sign-In...');

      // 1. Logowanie przez Google
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        print('❌ User cancelled Google Sign-In');
        return null;
      }

      print('✅ Google Sign-In successful: ${googleUser.email}');

      // 2. Pobierz dane uwierzytelniające
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // 🔧 WAŻNE: Twój backend używa accessToken, nie idToken
      if (googleAuth.accessToken == null) {
        print('❌ Failed to get Google Access token');
        return null;
      }

      print('🔑 Got Google Access token');

      // 3. Wyślij token do backendu (TWÓJ ENDPOINT)
      final backendAccessToken = await _sendTokenToBackend(
        googleAuth.accessToken!,
      );

      if (backendAccessToken != null) {
        print('✅ Backend authentication successful');
      } else {
        print('❌ Backend authentication failed');
      }

      return backendAccessToken;
    } catch (e) {
      print('💥 Google Sign-In error: $e');
      return null;
    }
  }

  /// Wylogowanie z Google
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      print('✅ Google Sign-Out successful');
    } catch (e) {
      print('💥 Google Sign-Out error: $e');
    }
  }

  /// Sprawdź czy użytkownik jest zalogowany
  Future<bool> isSignedIn() async {
    return await _googleSignIn.isSignedIn();
  }

  /// Pobierz aktualnie zalogowanego użytkownika
  Future<GoogleSignInAccount?> getCurrentUser() async {
    return _googleSignIn.currentUser;
  }

  /// 🔧 ZAKTUALIZOWANE: Wyślij Google Access token do TWOJEGO endpointa
  /// POST /api/Auth/google-verify
  /// Body: { "accessToken": "string" }
  Future<String?> _sendTokenToBackend(String accessToken) async {
    final url = Uri.parse('$_backendUrl/google-verify');

    try {
      print('📤 Sending Google token to backend...');
      print('🌐 URL: $url');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'accessToken':
              accessToken, // 🔧 Tylko accessToken, zgodnie z Twoim API
        }),
      );

      print('📥 Backend response: ${response.statusCode}');
      print('📄 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // 🔧 Sprawdź różne możliwe formaty odpowiedzi
        String? backendToken;

        if (data is Map<String, dynamic>) {
          // Spróbuj różnych nazw pól
          backendToken =
              data['accessToken'] as String? ??
              data['token'] as String? ??
              data['access_token'] as String?;
        } else if (data is String) {
          // Może zwraca sam token jako string
          backendToken = data;
        }

        if (backendToken != null) {
          print('✅ Got access token from backend');
          return backendToken;
        } else {
          print('⚠️ No access token in response');
          print('📋 Response data: $data');
        }
      } else if (response.statusCode == 400) {
        print('❌ Backend error 400: Invalid token');
        final data = jsonDecode(response.body);
        print('📝 Error message: ${data['message']}');
      } else {
        print('❌ Backend error: ${response.statusCode}');
        print('📝 Response body: ${response.body}');
      }
    } catch (e) {
      print('💥 Backend communication error: $e');
    }

    return null;
  }

  /// 🆕 Opcjonalnie: Silent Sign-In
  Future<String?> silentSignIn() async {
    try {
      print('🔇 Attempting silent sign-in...');

      final GoogleSignInAccount? googleUser =
          await _googleSignIn.signInSilently();

      if (googleUser == null) {
        print('ℹ️ No previous Google sign-in found');
        return null;
      }

      print('✅ Silent sign-in successful: ${googleUser.email}');

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      if (googleAuth.accessToken == null) {
        print('❌ Failed to get Google Access token');
        return null;
      }

      return await _sendTokenToBackend(googleAuth.accessToken!);
    } catch (e) {
      print('💥 Silent sign-in error: $e');
      return null;
    }
  }

  /// 🆕 Pomocnicza metoda: Pobierz informacje o użytkowniku
  Future<Map<String, dynamic>?> getUserInfo() async {
    try {
      final GoogleSignInAccount? user = _googleSignIn.currentUser;

      if (user == null) {
        print('⚠️ No Google user signed in');
        return null;
      }

      return {
        'email': user.email,
        'displayName': user.displayName ?? '',
        'photoUrl': user.photoUrl ?? '',
        'id': user.id,
      };
    } catch (e) {
      print('💥 Error getting user info: $e');
      return null;
    }
  }
}
