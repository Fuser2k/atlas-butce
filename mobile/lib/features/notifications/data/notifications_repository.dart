import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/reminder_model.dart';

final notificationsRepositoryProvider = Provider<NotificationsRepository>(
  (ref) => NotificationsRepository(ref.watch(dioProvider)),
);

/// Madde 5.7 — Ödeme Hatırlatıcıları (mobil bildirim merkezi).
class NotificationsRepository {
  final Dio _dio;

  NotificationsRepository(this._dio);

  Future<List<ReminderModel>> list() async {
    final response = await _dio.get('/notifications');
    final items = response.data['data'] as List<dynamic>;
    return items.map((e) => ReminderModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ReminderModel>> upcoming() async {
    final response = await _dio.get('/notifications/upcoming');
    final items = response.data['data'] as List<dynamic>;
    return items.map((e) => ReminderModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> markRead(String id) => _dio.patch('/notifications/$id/read');
}
