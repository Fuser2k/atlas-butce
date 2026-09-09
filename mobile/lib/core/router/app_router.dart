import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/home/presentation/home_screen.dart';
import 'app_shell.dart';
import 'placeholder_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      _shellRoute(
        route: '/',
        weekNote: 'Ana ekran — mobil⇄backend bağlantı testi bu haftanın kapsamında.',
        builder: (context, state) => const HomeScreen(),
      ),
      _shellRoute(
        route: '/transactions',
        weekNote: 'Gelir/Gider yönetimi Hafta 2 kapsamında geliştirilecek (Madde 5.4).',
      ),
      _shellRoute(
        route: '/accounts',
        weekNote: 'Banka/Kart/Kredi/KMH yönetimi Hafta 3 kapsamında geliştirilecek (Madde 5.5).',
      ),
      _shellRoute(
        route: '/bills',
        weekNote: 'Faturalar & Sabit Ödemeler Hafta 3 kapsamında geliştirilecek (Madde 5.6, 5.7).',
      ),
      _shellRoute(
        route: '/household',
        weekNote: 'Hane Halkı Yönetimi Hafta 4 kapsamında geliştirilecek (Madde 5.8).',
      ),
      _shellRoute(
        route: '/savings',
        weekNote: 'Birikim/Hedef Yönetimi Hafta 4 kapsamında geliştirilecek (Madde 5.9).',
      ),
      _shellRoute(
        route: '/public-debt',
        weekNote: 'Kamu Borç Takip Hafta 6 kapsamında geliştirilecek (Madde 5.14).',
      ),
      _shellRoute(
        route: '/premium',
        weekNote: 'Premium Alanı Hafta 5-7 kapsamında geliştirilecek (Madde 5.11, 5.16).',
      ),
      _shellRoute(
        route: '/settings',
        weekNote: 'Profil/Ayarlar Hafta 2 kapsamında geliştirilecek (Madde 5.2).',
      ),
    ],
  );
});

GoRoute _shellRoute({
  required String route,
  required String weekNote,
  Widget Function(BuildContext, GoRouterState)? builder,
}) {
  return GoRoute(
    path: route,
    builder: (context, state) {
      final destination = appDestinations.firstWhere((d) => d.route == route);
      return AppShell(
        currentRoute: route,
        child: builder != null
            ? builder(context, state)
            : PlaceholderScreen(title: destination.label, weekNote: weekNote),
      );
    },
  );
}
