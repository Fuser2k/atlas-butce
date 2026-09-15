import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/account_model.dart';

final accountsRepositoryProvider = Provider<AccountsRepository>(
  (ref) => AccountsRepository(ref.watch(dioProvider)),
);

/// Madde 5.5 — Banka, Kredi Kartı, Kredi ve KMH Yönetimi.
/// create/update, formun ürettiği ham JSON gövdesini (type'a göre ilgili alanlar) alır.
class AccountsRepository {
  final Dio _dio;

  AccountsRepository(this._dio);

  Future<List<AccountModel>> list({AccountKind? type}) async {
    final response = await _dio.get('/accounts', queryParameters: {
      if (type != null) 'type': accountKindToJson(type),
    });
    final items = response.data['data'] as List<dynamic>;
    return items.map((e) => AccountModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AccountsSummary> summary() async {
    final response = await _dio.get('/accounts/summary');
    return AccountsSummary.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<AccountModel> create(Map<String, dynamic> body) async {
    final response = await _dio.post('/accounts', data: body);
    return AccountModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<AccountModel> update(String id, Map<String, dynamic> body) async {
    final response = await _dio.patch('/accounts/$id', data: body);
    return AccountModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) => _dio.delete('/accounts/$id');
}
