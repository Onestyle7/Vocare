import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_api.dart';

class AuthRepository {
  final AuthApi api = AuthApi();

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
   Future<bool> register(String email, String password) async {
    final accessToken = await AuthApi.registerUser(email, password);
    if (accessToken != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', accessToken);
      print("Token zapisany: $accessToken");
      return true;
    }
    return false;
  }
}
