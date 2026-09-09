import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/transaction_model.dart';

final transactionsRepositoryProvider = Provider<TransactionsRepository>(
  (ref) => TransactionsRepository(ref.watch(dioProvider)),
);

/// Madde 5.4 — Gelir ve Gider Yönetimi.
class TransactionsRepository {
  final Dio _dio;

  TransactionsRepository(this._dio);

  Future<List<TransactionModel>> list() async {
    final response = await _dio.get('/transactions');
    final items = response.data['data'] as List<dynamic>;
    return items.map((e) => TransactionModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TransactionSummary> summary() async {
    final response = await _dio.get('/transactions/summary');
    return TransactionSummary.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> create({
    required TransactionKind type,
    required double amount,
    required String category,
    String? description,
    required DateTime date,
  }) async {
    await _dio.post('/transactions', data: {
      'type': type == TransactionKind.income ? 'INCOME' : 'EXPENSE',
      'amount': amount,
      'category': category,
      if (description != null && description.isNotEmpty) 'description': description,
      'date': date.toUtc().toIso8601String(),
    });
  }

  Future<void> delete(String id) => _dio.delete('/transactions/$id');
}
