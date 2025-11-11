// mobile/lib/repositories/auth_repository.dart
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_api.dart';
import '../services/google_auth_service.dart';

class AuthRepository {
  final AuthApi api = AuthApi();
  final GoogleAuthService _googleAuthService = GoogleAuthService();

  /// Logowanie email/hasło
  Future<bool> login(String email, String password) async {
    final accessToken = await api.loginUser(email, password);

    if (accessToken != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', accessToken);
      print('TOKEN ZOSTAŁ ZAPISANY: $accessToken');
      return true;
    }

    return false;
  }

  /// Rejestracja email/hasło
  Future<bool> register(
    String email,
    String password,
    String confirmPassword,
  ) async {
    final accessToken = await AuthApi.registerUser(
      email,
      password,
      confirmPassword,
    );
    if (accessToken != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', accessToken);
      print("Token zapisany: $accessToken");
      return true;
    }
    return false;
  }

  /// 🆕 Logowanie przez Google
  Future<bool> signInWithGoogle() async {
    print('🔵 AuthRepository: Starting Google Sign-In');

    final accessToken = await _googleAuthService.signInWithGoogle();

    if (accessToken != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', accessToken);
      await prefs.setBool('isGoogleAuth', true);
      print('✅ Google token saved: $accessToken');
      return true;
    }

    print('❌ Google Sign-In failed');
    return false;
  }

  /// 🆕 Wylogowanie (obsługuje zarówno zwykłe jak i Google)
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    final isGoogleAuth = prefs.getBool('isGoogleAuth') ?? false;

    if (isGoogleAuth) {
      await _googleAuthService.signOut();
    }

    await prefs.remove('accessToken');
    await prefs.remove('isGoogleAuth');
    print('✅ Logged out successfully');
  }

  /// 🆕 Sprawdź czy użytkownik jest zalogowany
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    return token != null && token.isNotEmpty;
  }

  /// 🆕 Próba automatycznego logowania
  Future<bool> attemptSilentSignIn() async {
    final prefs = await SharedPreferences.getInstance();
    final isGoogleAuth = prefs.getBool('isGoogleAuth') ?? false;

    if (isGoogleAuth) {
      print('🔇 Attempting Google silent sign-in');
      final accessToken = await _googleAuthService.silentSignIn();

      if (accessToken != null) {
        await prefs.setString('accessToken', accessToken);
        print('✅ Silent sign-in successful');
        return true;
      }
    }

    return false;
  }
}
