import 'package:flutter_test/flutter_test.dart';
import 'package:atlas_butce/features/accounts/domain/account_model.dart';
import 'package:atlas_butce/features/home/domain/dashboard_calculations.dart';

AccountModel _account({
  required AccountKind type,
  DateTime? dueDate,
  double? monthlyInstallment,
  double? minPaymentAmount,
  double? fullPaymentAmount,
}) {
  return AccountModel(
    id: 'id',
    type: type,
    name: 'test',
    dueDate: dueDate,
    monthlyInstallment: monthlyInstallment,
    minPaymentAmount: minPaymentAmount,
    fullPaymentAmount: fullPaymentAmount,
  );
}

void main() {
  group('calculateAvailableMoney', () {
    test('bakiyeden yaklasan zorunlu odemeleri dusurur', () {
      final result = calculateAvailableMoney(
        totalBankBalance: 10000,
        upcomingBillsTotal: 1500,
        upcomingLoanInstallmentsTotal: 2000,
        upcomingCreditCardMinPaymentTotal: 500,
      );
      expect(result, 6000);
    });

    test('zorunlu odeme yoksa bakiyenin tamami kullanilabilir', () {
      final result = calculateAvailableMoney(
        totalBankBalance: 5000,
        upcomingBillsTotal: 0,
        upcomingLoanInstallmentsTotal: 0,
        upcomingCreditCardMinPaymentTotal: 0,
      );
      expect(result, 5000);
    });

    test('zorunlu odemeler bakiyeyi asarsa negatif donebilir (uyari amacli)', () {
      final result = calculateAvailableMoney(
        totalBankBalance: 100,
        upcomingBillsTotal: 500,
        upcomingLoanInstallmentsTotal: 0,
        upcomingCreditCardMinPaymentTotal: 0,
      );
      expect(result, -400);
    });
  });

  group('sumUpcomingLoanInstallments', () {
    test('sadece 30 gun icinde vadesi olan kredileri toplar', () {
      final accounts = [
        _account(type: AccountKind.loan, dueDate: DateTime.now().add(const Duration(days: 10)), monthlyInstallment: 1000),
        _account(type: AccountKind.loan, dueDate: DateTime.now().add(const Duration(days: 60)), monthlyInstallment: 2000),
        _account(type: AccountKind.loan, dueDate: null, monthlyInstallment: 3000),
        _account(type: AccountKind.bank),
      ];
      expect(sumUpcomingLoanInstallments(accounts), 1000);
    });
  });

  group('sumUpcomingCreditCardMinPayments', () {
    test('asgari odeme yoksa tam odemeye duser', () {
      final accounts = [
        _account(type: AccountKind.creditCard, dueDate: DateTime.now().add(const Duration(days: 5)), minPaymentAmount: 300),
        _account(type: AccountKind.creditCard, dueDate: DateTime.now().add(const Duration(days: 5)), fullPaymentAmount: 800),
      ];
      expect(sumUpcomingCreditCardMinPayments(accounts), 1100);
    });

    test('vadesi 30 gunden uzak olan kartlar dahil edilmez', () {
      final accounts = [
        _account(type: AccountKind.creditCard, dueDate: DateTime.now().add(const Duration(days: 45)), minPaymentAmount: 300),
      ];
      expect(sumUpcomingCreditCardMinPayments(accounts), 0);
    });
  });
}
