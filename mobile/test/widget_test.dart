import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:atlas_butce/main.dart';
import 'package:atlas_butce/core/router/app_shell.dart';

void main() {
  testWidgets('Ana ekran açılıyor ve Drawer 9 ana rotayı listeliyor', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: AtlasApp()));
    await tester.pumpAndSettle();

    expect(find.text('Ana Ekran'), findsWidgets);

    await tester.tap(find.byTooltip('Open navigation menu'));
    await tester.pumpAndSettle();

    // Drawer'daki ListView virtualize edildiğinden, her rotayı görünür kılmak için kaydırıyoruz.
    final drawerList = find.byType(ListView);
    for (final destination in appDestinations) {
      final tile = find.widgetWithText(ListTile, destination.label);
      await tester.dragUntilVisible(tile, drawerList, const Offset(0, -80));
      expect(tile, findsOneWidget);
    }
  });
}
