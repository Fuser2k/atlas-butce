import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class NavDestination {
  final String label;
  final String route;
  final IconData icon;

  const NavDestination({required this.label, required this.route, required this.icon});
}

/// Özet rapor Bölüm 5 / Sözleşme Madde 5.3 ile uyumlu 9 ana ekran.
const List<NavDestination> appDestinations = [
  NavDestination(label: 'Ana Ekran', route: '/', icon: Icons.home_outlined),
  NavDestination(label: 'Gelir/Gider', route: '/transactions', icon: Icons.swap_vert),
  NavDestination(label: 'Finansal Hesaplar', route: '/accounts', icon: Icons.account_balance_outlined),
  NavDestination(label: 'Faturalar', route: '/bills', icon: Icons.receipt_long_outlined),
  NavDestination(label: 'Hane Halkı', route: '/household', icon: Icons.groups_outlined),
  NavDestination(label: 'Birikim/Hedefler', route: '/savings', icon: Icons.savings_outlined),
  NavDestination(label: 'Kamu Borç Takip', route: '/public-debt', icon: Icons.gavel_outlined),
  NavDestination(label: 'Premium Alanı', route: '/premium', icon: Icons.workspace_premium_outlined),
  NavDestination(label: 'Profil/Ayarlar', route: '/settings', icon: Icons.settings_outlined),
];

/// 9 ana ekran arasında gezinme için ortak kabuk (Drawer tabanlı — bottom nav için fazla sekme sayısı).
class AppShell extends StatelessWidget {
  final Widget child;
  final String currentRoute;

  const AppShell({super.key, required this.child, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    final currentDestination = appDestinations.firstWhere(
      (d) => d.route == currentRoute,
      orElse: () => appDestinations.first,
    );

    return Scaffold(
      appBar: AppBar(title: Text(currentDestination.label)),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            children: [
              const DrawerHeader(child: Text('ATLAS Bütçe', style: TextStyle(fontSize: 20))),
              for (final destination in appDestinations)
                ListTile(
                  leading: Icon(destination.icon),
                  title: Text(destination.label),
                  selected: destination.route == currentRoute,
                  onTap: () {
                    Navigator.of(context).pop();
                    context.go(destination.route);
                  },
                ),
            ],
          ),
        ),
      ),
      body: child,
    );
  }
}
