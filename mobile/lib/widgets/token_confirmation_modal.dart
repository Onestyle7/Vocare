import 'package:flutter/material.dart';
import 'package:vocare/screens/pricing_screen.dart';

class TokenConfirmationModal {
  static Future<bool?> show({
    required BuildContext context,
    required int tokensRequired,
    required int currentBalance,
  }) async {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        final bool hasEnoughTokens = currentBalance >= tokensRequired;

        return AlertDialog(
          backgroundColor: const Color(0xFF1C1C1E),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Icon(
                hasEnoughTokens ? Icons.check_circle : Icons.warning,
                color: hasEnoughTokens ? Colors.green : Colors.orange,
              ),
              const SizedBox(width: 8),
              Text(
                hasEnoughTokens ? 'Confirm Action' : 'Insufficient Tokens',
                style: const TextStyle(color: Colors.white),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (hasEnoughTokens) ...[
                const Text(
                  'This action will use tokens from your account.',
                  style: TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF915EFF).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: const Color(0xFF915EFF).withOpacity(0.3),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Tokens required:',
                            style: TextStyle(color: Colors.white),
                          ),
                          Text(
                            '$tokensRequired',
                            style: const TextStyle(
                              color: Color(0xFF915EFF),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Current balance:',
                            style: TextStyle(color: Colors.white),
                          ),
                          Text(
                            '$currentBalance',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const Divider(color: Colors.grey),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'After transaction:',
                            style: TextStyle(color: Colors.white),
                          ),
                          Text(
                            '${currentBalance - tokensRequired}',
                            style: const TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Text(
                  'You need $tokensRequired tokens to perform this action, but you only have $currentBalance tokens.',
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info, color: Colors.orange),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Missing: ${tokensRequired - currentBalance} tokens',
                          style: const TextStyle(
                            color: Colors.orange,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          actions: [
            // Cancel button
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),

            // Buy more tokens button (zawsze widoczny)
            TextButton.icon(
              onPressed: () async {
                Navigator.of(context).pop(false); // Zamknij modal
                // Przejdź do pricing screen
                await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const PricingScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.shopping_cart, color: Color(0xFF915EFF)),
              label: const Text(
                'Buy more tokens',
                style: TextStyle(color: Color(0xFF915EFF)),
              ),
            ),

            // Confirm button (tylko jeśli ma wystarczająco tokenów)
            if (hasEnoughTokens)
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF915EFF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Confirm'),
              ),
          ],
        );
      },
    );
  }
}
