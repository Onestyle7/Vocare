import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vocare/fillProfile.dart';

class HomePageScreen extends StatefulWidget {
  const HomePageScreen({super.key});

  @override
  State<HomePageScreen> createState() => _HomePageScreenState();
}

class _HomePageScreenState extends State<HomePageScreen> {
  final TextEditingController _recommendationController = TextEditingController();

  Future<void> fetchRecommendation() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    print('TOKEN POBRANY Z PAMIĘCI: $token');
    final url = Uri.parse('https://localhost:5001/api/Ai/recommendations');
    final response = await http.get(url, headers: {
      'Authorization': 'Bearer $token',
      'accept': 'application/json'
    });

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      setState(() {
        _recommendationController.text = data['recommendations'] ?? 'Brak rekomendacji';
      });
    } else {
      setState(() {
        _recommendationController.text = 'Błąd pobierania danych: ${response.statusCode}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Strona główna"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text("To jest strona Home"),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: fetchRecommendation,
              child: Text("Generuj rekomendację AI"),
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: _recommendationController,
              maxLines: 10,
              decoration: InputDecoration(
                labelText: "Rekomendacja AI",
                border: OutlineInputBorder(),
              ),
              readOnly: true,
            ),
            SizedBox(height: 16),
            TextButton(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => FillProfile()));
              },
              child: Text("Profil"),
            ),
          ],
        ),
      ),
    );
  }
}
