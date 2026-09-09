import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../data/auth_repository.dart';
import '../data/token_storage.dart';
import '../domain/auth_user.dart';

class AuthState {
  final AuthUser? user;

  const AuthState({this.user});

  bool get isAuthenticated => user != null;
}

final authControllerProvider = AsyncNotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    final storage = ref.read(tokenStorageProvider);
    final accessToken = await storage.readAccessToken();
    if (accessToken == null) {
      return const AuthState();
    }

    _applyAuthHeader(accessToken);

    try {
      final user = await ref.read(authRepositoryProvider).me();
      return AuthState(user: user);
    } catch (_) {
      await storage.clear();
      _applyAuthHeader(null);
      return const AuthState();
    }
  }

  Future<void> login({required String email, required String password}) async {
    final result = await ref.read(authRepositoryProvider).login(email: email, password: password);
    await _persist(result);
  }

  Future<void> register({required String email, required String password, String? fullName}) async {
    final result = await ref.read(authRepositoryProvider).register(
          email: email,
          password: password,
          fullName: fullName,
        );
    await _persist(result);
  }

  Future<void> updateFullName(String fullName) async {
    final updated = await ref.read(authRepositoryProvider).updateProfile(fullName: fullName);
    state = AsyncValue.data(AuthState(user: updated));
  }

  Future<void> logout() async {
    await ref.read(tokenStorageProvider).clear();
    _applyAuthHeader(null);
    state = const AsyncValue.data(AuthState());
  }

  Future<void> deleteAccount() async {
    await ref.read(authRepositoryProvider).deleteAccount();
    await logout();
  }

  Future<void> _persist(AuthResult result) async {
    await ref.read(tokenStorageProvider).save(
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        );
    _applyAuthHeader(result.accessToken);
    state = AsyncValue.data(AuthState(user: result.user));
  }

  void _applyAuthHeader(String? accessToken) {
    final dio = ref.read(dioProvider);
    if (accessToken == null) {
      dio.options.headers.remove('Authorization');
    } else {
      dio.options.headers['Authorization'] = 'Bearer $accessToken';
    }
  }
}
