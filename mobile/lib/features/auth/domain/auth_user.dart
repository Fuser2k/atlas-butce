class AuthUser {
  final String id;
  final String email;
  final String? fullName;
  final String tier;

  const AuthUser({required this.id, required this.email, this.fullName, required this.tier});

  bool get isPremium => tier == 'PREMIUM';

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String?,
      tier: json['tier'] as String,
    );
  }
}

class AuthResult {
  final String accessToken;
  final String refreshToken;
  final AuthUser user;

  const AuthResult({required this.accessToken, required this.refreshToken, required this.user});

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
