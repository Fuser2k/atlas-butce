enum AccountKind { bank, creditCard, loan, overdraft }

AccountKind accountKindFromJson(String value) {
  switch (value) {
    case 'CREDIT_CARD':
      return AccountKind.creditCard;
    case 'LOAN':
      return AccountKind.loan;
    case 'OVERDRAFT':
      return AccountKind.overdraft;
    default:
      return AccountKind.bank;
  }
}

String accountKindToJson(AccountKind kind) {
  switch (kind) {
    case AccountKind.bank:
      return 'BANK';
    case AccountKind.creditCard:
      return 'CREDIT_CARD';
    case AccountKind.loan:
      return 'LOAN';
    case AccountKind.overdraft:
      return 'OVERDRAFT';
  }
}

const accountKindLabels = {
  AccountKind.bank: 'Banka Hesabı',
  AccountKind.creditCard: 'Kredi Kartı',
  AccountKind.loan: 'Kredi',
  AccountKind.overdraft: 'KMH / Ek Hesap',
};

double? _parseNum(dynamic value) => value == null ? null : double.parse(value.toString());
DateTime? _parseDate(dynamic value) => value == null ? null : DateTime.parse(value.toString());

class AccountModel {
  final String id;
  final AccountKind type;
  final String name;
  final String? bankName;
  final double? balance;
  final double? cardLimit;
  final double? currentDebt;
  final double? availableLimit;
  final DateTime? statementDate;
  final DateTime? dueDate;
  final double? minPaymentAmount;
  final double? fullPaymentAmount;
  final double? loanAmount;
  final double? monthlyInstallment;
  final double? remainingDebt;
  final int? remainingInstallments;
  final double? overdraftLimit;
  final double? usedAmount;
  final double? remainingOverdraftLimit;

  const AccountModel({
    required this.id,
    required this.type,
    required this.name,
    this.bankName,
    this.balance,
    this.cardLimit,
    this.currentDebt,
    this.availableLimit,
    this.statementDate,
    this.dueDate,
    this.minPaymentAmount,
    this.fullPaymentAmount,
    this.loanAmount,
    this.monthlyInstallment,
    this.remainingDebt,
    this.remainingInstallments,
    this.overdraftLimit,
    this.usedAmount,
    this.remainingOverdraftLimit,
  });

  factory AccountModel.fromJson(Map<String, dynamic> json) {
    return AccountModel(
      id: json['id'] as String,
      type: accountKindFromJson(json['type'] as String),
      name: json['name'] as String,
      bankName: json['bankName'] as String?,
      balance: _parseNum(json['balance']),
      cardLimit: _parseNum(json['cardLimit']),
      currentDebt: _parseNum(json['currentDebt']),
      availableLimit: _parseNum(json['availableLimit']),
      statementDate: _parseDate(json['statementDate']),
      dueDate: _parseDate(json['dueDate']),
      minPaymentAmount: _parseNum(json['minPaymentAmount']),
      fullPaymentAmount: _parseNum(json['fullPaymentAmount']),
      loanAmount: _parseNum(json['loanAmount']),
      monthlyInstallment: _parseNum(json['monthlyInstallment']),
      remainingDebt: _parseNum(json['remainingDebt']),
      remainingInstallments: json['remainingInstallments'] as int?,
      overdraftLimit: _parseNum(json['overdraftLimit']),
      usedAmount: _parseNum(json['usedAmount']),
      remainingOverdraftLimit: (json['remainingOverdraftLimit'] as num?)?.toDouble(),
    );
  }
}

class AccountsSummary {
  final double totalBankBalance;
  final double totalCreditCardDebt;
  final double totalCreditCardLimit;
  final double totalAvailableCardLimit;
  final double totalLoanRemainingDebt;
  final double totalMonthlyLoanInstallments;
  final double totalOverdraftLimit;
  final double totalOverdraftUsed;

  const AccountsSummary({
    required this.totalBankBalance,
    required this.totalCreditCardDebt,
    required this.totalCreditCardLimit,
    required this.totalAvailableCardLimit,
    required this.totalLoanRemainingDebt,
    required this.totalMonthlyLoanInstallments,
    required this.totalOverdraftLimit,
    required this.totalOverdraftUsed,
  });

  factory AccountsSummary.fromJson(Map<String, dynamic> json) {
    double num_(String key) => (json[key] as num).toDouble();
    return AccountsSummary(
      totalBankBalance: num_('totalBankBalance'),
      totalCreditCardDebt: num_('totalCreditCardDebt'),
      totalCreditCardLimit: num_('totalCreditCardLimit'),
      totalAvailableCardLimit: num_('totalAvailableCardLimit'),
      totalLoanRemainingDebt: num_('totalLoanRemainingDebt'),
      totalMonthlyLoanInstallments: num_('totalMonthlyLoanInstallments'),
      totalOverdraftLimit: num_('totalOverdraftLimit'),
      totalOverdraftUsed: num_('totalOverdraftUsed'),
    );
  }
}
