import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/household_member_model.dart';

final householdRepositoryProvider = Provider<HouseholdRepository>(
  (ref) => HouseholdRepository(ref.watch(dioProvider)),
);

/// Madde 5.8 — Hane Halkı Yönetimi.
class HouseholdRepository {
  final Dio _dio;

  HouseholdRepository(this._dio);

  Future<List<HouseholdMemberModel>> list() async {
    final response = await _dio.get('/household');
    final items = response.data['data'] as List<dynamic>;
    return items.map((e) => HouseholdMemberModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<HouseholdSummary> summary() async {
    final response = await _dio.get('/household/summary');
    return HouseholdSummary.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<HouseholdMemberModel> create(String name) async {
    final response = await _dio.post('/household', data: {'name': name});
    return HouseholdMemberModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<HouseholdMemberModel> update(String id, String name) async {
    final response = await _dio.patch('/household/$id', data: {'name': name});
    return HouseholdMemberModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) => _dio.delete('/household/$id');
}
