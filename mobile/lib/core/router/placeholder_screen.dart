import 'package:flutter/material.dart';

/// Hafta 1: bu ekranın backend mantığı henüz yok, sadece navigasyon iskeleti.
class PlaceholderScreen extends StatelessWidget {
  final String title;
  final String weekNote;

  const PlaceholderScreen({super.key, required this.title, required this.weekNote});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              weekNote,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
