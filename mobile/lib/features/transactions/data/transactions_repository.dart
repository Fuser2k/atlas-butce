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

  Future<List<TransactionModel>> list({DateTime? from, DateTime? to}) async {
    final response = await _dio.get('/transactions', queryParameters: {
      if (from != null) 'from': from.toUtc().toIso8601String(),
      if (to != null) 'to': to.toUtc().toIso8601String(),
    });
    final items = response.data['data'] as List<dynamic>;
    return items.map((e) => TransactionModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TransactionSummary> summary() async {
    final response = await _dio.get('/transactions/summary');
    return TransactionSummary.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<CategoryDistribution> distribution(TransactionKind type) async {
    final response = await _dio.get('/transactions/distribution', queryParameters: {
      'type': type == TransactionKind.income ? 'INCOME' : 'EXPENSE',
    });
    return CategoryDistribution.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> create({
    required TransactionKind type,
    required double amount,
    required String category,
    String? subCategory,
    String? description,
    required DateTime date,
    RecurrenceInterval? recurrenceInterval,
    String? householdMemberId,
  }) async {
    await _dio.post('/transactions', data: _buildBody(
      type: type,
      amount: amount,
      category: category,
      subCategory: subCategory,
      description: description,
      date: date,
      recurrenceInterval: recurrenceInterval,
      householdMemberId: householdMemberId,
    ));
  }

  Future<void> update(
    String id, {
    required TransactionKind type,
    required double amount,
    required String category,
    String? subCategory,
    String? description,
    required DateTime date,
    RecurrenceInterval? recurrenceInterval,
    String? householdMemberId,
  }) async {
    await _dio.patch('/transactions/$id', data: _buildBody(
      type: type,
      amount: amount,
      category: category,
      subCategory: subCategory,
      description: description,
      date: date,
      recurrenceInterval: recurrenceInterval,
      householdMemberId: householdMemberId,
    ));
  }

  Future<void> delete(String id) => _dio.delete('/transactions/$id');

  Map<String, dynamic> _buildBody({
    required TransactionKind type,
    required double amount,
    required String category,
    String? subCategory,
    String? description,
    required DateTime date,
    RecurrenceInterval? recurrenceInterval,
    String? householdMemberId,
  }) {
    final body = <String, dynamic>{
      'type': type == TransactionKind.income ? 'INCOME' : 'EXPENSE',
      'amount': amount,
      'category': category,
      'date': date.toUtc().toIso8601String(),
      'recurrence': recurrenceInterval != null ? 'RECURRING' : 'ONE_OFF',
    };
    if (subCategory != null && subCategory.isNotEmpty) body['subCategory'] = subCategory;
    if (description != null && description.isNotEmpty) body['description'] = description;
    if (recurrenceInterval != null) {
      body['recurrenceInterval'] = recurrenceInterval == RecurrenceInterval.weekly ? 'WEEKLY' : 'MONTHLY';
    }
    if (householdMemberId != null) body['householdMemberId'] = householdMemberId;
    return body;
  }
}
