import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/bill_model.dart';

final billsRepositoryProvider = Provider<BillsRepository>(
  (ref) => BillsRepository(ref.watch(dioProvider)),
);

/// Madde 5.6 / 5.7 — Faturalar, Sabit Ödemeler ve Ödeme Hatırlatıcıları.
class BillsRepository {
  final Dio _dio;

  BillsRepository(this._dio);

  Future<List<BillModel>> list() async {
    final response = await _dio.get('/bills');
    final items = response.data['data'] as List<dynamic>;
    return items.map((e) => BillModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<BillModel>> upcoming({int days = 30}) async {
    final response = await _dio.get('/bills/upcoming', queryParameters: {'days': days});
    final items = response.data['data'] as List<dynamic>;
    return items.map((e) => BillModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<BillModel> create({
    required String name,
    required String category,
    required double amount,
    required DateTime dueDate,
    RecurrencePeriod recurrencePeriod = RecurrencePeriod.none,
  }) async {
    final response = await _dio.post('/bills', data: {
      'name': name,
      'category': category,
      'amount': amount,
      'dueDate': dueDate.toUtc().toIso8601String(),
      'recurrencePeriod': recurrencePeriodToJson(recurrencePeriod),
    });
    return BillModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<BillModel> update(
    String id, {
    required String name,
    required String category,
    required double amount,
    required DateTime dueDate,
    RecurrencePeriod recurrencePeriod = RecurrencePeriod.none,
  }) async {
    final response = await _dio.patch('/bills/$id', data: {
      'name': name,
      'category': category,
      'amount': amount,
      'dueDate': dueDate.toUtc().toIso8601String(),
      'recurrencePeriod': recurrencePeriodToJson(recurrencePeriod),
    });
    return BillModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<BillModel> updateStatus(String id, bool isPaid) async {
    final response = await _dio.patch('/bills/$id/status', data: {'isPaid': isPaid});
    return BillModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) => _dio.delete('/bills/$id');
}
