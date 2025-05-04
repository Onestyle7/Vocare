import 'package:flutter/material.dart';

class ExpandableServiceCard extends StatefulWidget {
  final int number;
  final String title;

  const ExpandableServiceCard({
    super.key,
    required this.number,
    required this.title,
  });

  @override
  ExpandableServiceCardState createState() => ExpandableServiceCardState();
}

class ExpandableServiceCardState extends State<ExpandableServiceCard> {
  bool _expanded = false;
  String? _subtitle;
  String? _content;

  /// 🔄 Publiczna metoda do załadowania danych z zewnątrz
  void loadExternalData(Map<String, String> data) {
    setState(() {
      _subtitle = data['subtitle'];
      _content = data['content'];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // 🔢 Numer w kolorowym nagłówku
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: Colors.purpleAccent,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(12),
              topRight: Radius.circular(12),
            ),
          ),
          child: Center(
            child: Text(
              '${widget.number}',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
          ),
        ),

        // 📦 Karta z ExpansionTile
        Card(
          margin: const EdgeInsets.only(bottom: 16),
          color: const Color(0xFF1C1C1E),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            iconColor: Colors.purpleAccent,
            collapsedIconColor: Colors.purpleAccent,
            onExpansionChanged: (value) {
              setState(() {
                _expanded = value;
              });
            },
            initiallyExpanded: _expanded,
            title: Text(
              widget.title,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: Text(
              _subtitle ?? "Kliknij, aby wygenerować ścieżkę kariery",
              style: const TextStyle(color: Colors.purpleAccent),
            ),
            childrenPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            children: [
              if (_content != null)
                Text(_content!, style: const TextStyle(color: Colors.white70))
              else
                const Text(
                  "Brak danych do wyświetlenia.",
                  style: TextStyle(color: Colors.white38),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
