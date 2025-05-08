import 'dart:convert';
import 'package:http/http.dart' as http;

class MarketAnalysisApi {
  static const _base = 'https://localhost:5001/api/MarketAnalysis';

  static Future<List<String>?> fetchAll() async {
    final url = Uri.parse('$_base');
    try {
      final resp = await http.get(url);
      if (resp.statusCode == 200) {
        final List<dynamic> data = jsonDecode(resp.body);
        return data.map((e) => e.toString()).toList();
      }
      print('fetchAll error: ${resp.statusCode}');
    } catch (e) {
      print('fetchAll exception: $e');
    }
    return null;
  }

  static Future<String?> fetchLatest() async {
    final url = Uri.parse('$_base/latest');
    try {
      final resp = await http.get(url);
      if (resp.statusCode == 200) {
        return jsonDecode(resp.body).toString();
      }
      print('fetchLatest error: ${resp.statusCode}');
    } catch (e) {
      print('fetchLatest exception: $e');
    }
    return null;
  }
}
