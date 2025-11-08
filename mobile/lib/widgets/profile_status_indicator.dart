import 'package:flutter/material.dart';

class ProfileStatusIndicator extends StatelessWidget {
  final bool isLoading;
  final bool hasProfile;

  const ProfileStatusIndicator({
    super.key,
    required this.isLoading,
    required this.hasProfile,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.orange.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.orange),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Checking profile status...',
              style: TextStyle(color: Colors.orange, fontSize: 12),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: (hasProfile ? Colors.green : Colors.blue).withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            hasProfile ? Icons.check_circle : Icons.person_add,
            color: hasProfile ? Colors.green : Colors.blue,
            size: 16,
          ),
          const SizedBox(width: 8),
          Text(
            hasProfile ? 'Profile complete' : 'Profile needed',
            style: TextStyle(
              color: hasProfile ? Colors.green : Colors.blue,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
