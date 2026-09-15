import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/saving_goal_model.dart';

final savingsRepositoryProvider = Provider<SavingsRepository>(
  (ref) => SavingsRepository(ref.watch(dioProvider)),
);

/// Madde 5.9 — Birikim ve Finansal Hedef Yönetimi.
class SavingsRepository {
  final Dio _dio;

  SavingsRepository(this._dio);

  Future<List<SavingGoalModel>> list() async {
    final response = await _dio.get('/savings');
    final items = response.data['data'] as List<dynamic>;
    return items.map((e) => SavingGoalModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SavingGoalModel> create({
    required String name,
    required double targetAmount,
    double? currentAmount,
    DateTime? targetDate,
    double? monthlyPlanAmount,
  }) async {
    final body = <String, dynamic>{'name': name, 'targetAmount': targetAmount};
    if (currentAmount != null) body['currentAmount'] = currentAmount;
    if (targetDate != null) body['targetDate'] = targetDate.toUtc().toIso8601String();
    if (monthlyPlanAmount != null) body['monthlyPlanAmount'] = monthlyPlanAmount;

    final response = await _dio.post('/savings', data: body);
    return SavingGoalModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<SavingGoalModel> update(
    String id, {
    required String name,
    required double targetAmount,
    DateTime? targetDate,
    double? monthlyPlanAmount,
  }) async {
    final body = <String, dynamic>{'name': name, 'targetAmount': targetAmount};
    if (targetDate != null) body['targetDate'] = targetDate.toUtc().toIso8601String();
    if (monthlyPlanAmount != null) body['monthlyPlanAmount'] = monthlyPlanAmount;

    final response = await _dio.patch('/savings/$id', data: body);
    return SavingGoalModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<SavingGoalModel> addProgress(String id, double delta) async {
    final response = await _dio.patch('/savings/$id/progress', data: {'delta': delta});
    return SavingGoalModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) => _dio.delete('/savings/$id');
}
