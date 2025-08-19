// lib/services/billing_api.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class BillingApi {
  static const String _baseUrl = 'https://localhost:5001/api/Billing';

  /// Tworzy sesję checkoutu (Stripe) i zwraca true, jeśli się powiodło.
  static Future<bool> createCheckoutSession(String priceId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_baseUrl/create-checkout-session');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'priceId': priceId}),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Błąd createCheckoutSession: $e');
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
      print('Błąd markSuccess: $e');
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
      print('Błąd markCancel: $e');
      return false;
    }
  }

  /// Pobiera aktualny stan tokenów/kredytów użytkownika.
  static Future<int?> getTokenBalance() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    final url = Uri.parse('$_baseUrl/get-token-balance');

    try {
      final response = await http.get(
        url,
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        // Zakładamy, że body to np. liczba w formacie JSON: 42
        return int.tryParse(response.body);
      } else {
        print('getTokenBalance status: ${response.statusCode}');
      }
    } catch (e) {
      print('Błąd getTokenBalance: $e');
    }
    return null;
  }

  /// 🔥 Opcjonalnie: tylko do ręcznego testowania webhooka Stripe’a z poziomu Fluttera.
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
      print('Błąd triggerWebhook: $e');
      return false;
    }
  }
}
