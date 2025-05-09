import 'package:flutter/material.dart';

class IndustrySectionCard extends StatelessWidget {
  final int index;
  final String industry;
  final String averageSalary;
  final String employmentRate;
  final String growthForecast;

  const IndustrySectionCard({
    super.key,
    required this.index,
    required this.industry,
    required this.averageSalary,
    required this.employmentRate,
    required this.growthForecast,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1C),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // Fioletowy pasek z numerem
          Container(
            width: 60,
            height: 100,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: Color(0xFF915EFF),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                bottomLeft: Radius.circular(12),
              ),
            ),
            child: Text(
              '${index + 1}',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          // Dane główne
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    industry,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Średnie zarobki: $averageSalary',
                    style: const TextStyle(color: Colors.white),
                  ),
                  Text(
                    'Zatrudnienie: $employmentRate',
                    style: const TextStyle(color: Colors.white),
                  ),
                  Text(
                    'Prognoza wzrostu: $growthForecast',
                    style: const TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
