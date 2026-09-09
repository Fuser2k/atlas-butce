import 'package:flutter/material.dart';

/// Onaylı görsel kimlik (logo/renkler) müşteriden gelince burada güncellenecek.
class AppTheme {
  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1B2A6B)),
    );
  }
}
