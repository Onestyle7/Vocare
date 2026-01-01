// lib/services/billing_api.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class BillingApi {
  // 🔧 ZMIENIONE URL - z https://localhost:5001 na http://localhost:8080
  static const String _baseUrl = 'http://localhost:8080/api/Billing';

  /// 🆕 NOWA METODA: Pobierz stan tokenów z /access-status
  static Future<Map<String, dynamic>?> getAccessStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');

    if (token == null) {
      print('❌ No access token found');
      return null;
    }

    final url = Uri.parse('$_baseUrl/access-status');

    try {
      print('📤 Fetching access status from: $url');

      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      );

      print('📥 Access status response: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Token balance: ${data['tokenBalance']}');
        print('✅ Subscription: ${data['subscriptionStatus']}');
        return data;
      } else {
        print('❌ Failed to get access status: ${response.statusCode}');
      }
    } catch (e) {
      print('💥 Error getting access status: $e');
    }

    return null;
  }

  /// Pobiera aktualny stan tokenów/kredytów użytkownika.
  /// 🔧 ZAKTUALIZOWANE: używa getAccessStatus() zamiast starego endpointu
  static Future<int?> getTokenBalance() async {
    final accessStatus = await getAccessStatus();
    if (accessStatus != null) {
      return accessStatus['tokenBalance'] as int?;
    }
    return null;
  }

  /// Tworzy sesję checkoutu (Stripe) i zwraca true, jeśli się powiodło.
  static Future<bool> createCheckoutSession(String priceId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_baseUrl/create-checkout-session');

    try {
      print('📤 Creating checkout session for: $priceId');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'priceId': priceId}),
      );

      print('📥 Checkout session response: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      print('💥 Error createCheckoutSession: $e');
      return false;
    }
  }

  /// Oznacza w backendzie udaną płatność (GET /success).
  static Future<bool> markSuccess() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_baseUrl/success');

    try {
      final response = await http.get(
        url,
        headers: {'Authorization': 'Bearer $token'},
      );
      return response.statusCode == 200;
    } catch (e) {
      print('💥 Error markSuccess: $e');
      return false;
    }
  }

  /// Oznacza w backendzie anulowaną płatność (GET /cancel).
  static Future<bool> markCancel() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_baseUrl/cancel');

    try {
      final response = await http.get(
        url,
        headers: {'Authorization': 'Bearer $token'},
      );
      return response.statusCode == 200;
    } catch (e) {
      print('💥 Error markCancel: $e');
      return false;
    }
  }

  /// 🔥 Opcjonalnie: tylko do ręcznego testowania webhooka Stripe'a z poziomu Fluttera.
  static Future<bool> triggerWebhook(Map<String, dynamic> payload) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_baseUrl/webhook');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('💥 Error triggerWebhook: $e');
      return false;
    }
  }
}
