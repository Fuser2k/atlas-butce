import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/auth_user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref.watch(dioProvider)));

/// Madde 5.2 — kayıt, giriş, profil.
class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  Future<AuthResult> register({required String email, required String password, String? fullName}) async {
    final response = await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      if (fullName != null && fullName.isNotEmpty) 'fullName': fullName,
    });
    return AuthResult.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<AuthResult> login({required String email, required String password}) async {
    final response = await _dio.post('/auth/login', data: {'email': email, 'password': password});
    return AuthResult.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<AuthUser> me() async {
    final response = await _dio.get('/users/me');
    return AuthUser.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<AuthUser> updateProfile({String? fullName}) async {
    final response = await _dio.patch('/users/me', data: {'fullName': ?fullName});
    return AuthUser.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> deleteAccount() => _dio.delete('/auth/account');
}
