import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env_config.dart';

/// Standart backend response zarfı: { success, data, error }
class ApiException implements Exception {
  final int? statusCode;
  final String message;

  ApiException({this.statusCode, required this.message});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

final envConfigProvider = Provider<EnvConfig>((ref) => EnvConfig.fromDartDefines());

final dioProvider = Provider<Dio>((ref) {
  final env = ref.watch(envConfigProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (DioException e, handler) {
        final message = e.response?.data is Map
            ? (e.response?.data['error']?['message']?.toString() ?? e.message ?? 'Bilinmeyen ağ hatası')
            : (e.message ?? 'Bilinmeyen ağ hatası');
        handler.next(
          e.copyWith(
            error: ApiException(statusCode: e.response?.statusCode, message: message),
          ),
        );
      },
    ),
  );

  return dio;
});
