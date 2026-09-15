import '../../accounts/domain/account_model.dart';

/// Madde 5.3 — "Kullanılabilir para" V1 hesaplaması.
///
/// Formül: totalBankBalance - (yaklaşan faturalar + yaklaşan kredi taksitleri
/// + yaklaşan kredi kartı asgari ödemeleri).
///
/// Bilinçli sınırlar (guardrail):
/// - KMH/ek hesap kullanılan tutarı zorunlu ödeme sayılmaz (KMH bir limit,
///   vadeli bir ödeme yükümlülüğü değildir — kullanıcı isterse kullanır).
/// - Aynı borç iki kez toplanmaz: faturalar, kredi taksitleri ve kart asgari
///   ödemeleri birbirinden ayrı, kesişmeyen kategorilerdir.
/// - Kredi kartı için "tam ödeme" değil "asgari ödeme" zorunlu kabul edilir
///   (asgari ödeme yapılmazsa temerrüde düşülür; tam ödeme ihtiyaridir).
double calculateAvailableMoney({
  required double totalBankBalance,
  required double upcomingBillsTotal,
  required double upcomingLoanInstallmentsTotal,
  required double upcomingCreditCardMinPaymentTotal,
}) {
  final mandatoryUpcoming =
      upcomingBillsTotal + upcomingLoanInstallmentsTotal + upcomingCreditCardMinPaymentTotal;
  return totalBankBalance - mandatoryUpcoming;
}

/// [withinDays] içinde ödeme tarihi (dueDate) dolacak LOAN hesaplarının
/// aylık taksit toplamı. dueDate girilmemiş krediler bu hesaba dahil edilmez
/// (belirsiz veri için varsayım uydurulmaz).
double sumUpcomingLoanInstallments(List<AccountModel> accounts, {int withinDays = 30}) {
  final horizon = DateTime.now().add(Duration(days: withinDays));
  return accounts
      .where((a) => a.type == AccountKind.loan && a.dueDate != null && !a.dueDate!.isAfter(horizon))
      .fold(0.0, (sum, a) => sum + (a.monthlyInstallment ?? 0));
}

/// [withinDays] içinde son ödeme tarihi (dueDate) dolacak CREDIT_CARD
/// hesaplarının asgari ödeme toplamı (asgari tutar girilmemişse tam ödeme
/// tutarı kullanılır; o da yoksa 0 kabul edilir).
double sumUpcomingCreditCardMinPayments(List<AccountModel> accounts, {int withinDays = 30}) {
  final horizon = DateTime.now().add(Duration(days: withinDays));
  return accounts
      .where((a) => a.type == AccountKind.creditCard && a.dueDate != null && !a.dueDate!.isAfter(horizon))
      .fold(0.0, (sum, a) => sum + (a.minPaymentAmount ?? a.fullPaymentAmount ?? 0));
}
