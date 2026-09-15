import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/daily_briefing_model.dart';
import '../domain/monthly_payment_plan_model.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>(
  (ref) => DashboardRepository(ref.watch(dioProvider)),
);

/// Madde 5.3 — Dashboard V3: aylık ödeme planı ve yazılı günlük brifing.
class DashboardRepository {
  final Dio _dio;

  DashboardRepository(this._dio);

  Future<MonthlyPaymentPlan> monthlyPaymentPlan() async {
    final response = await _dio.get('/planning/monthly');
    return MonthlyPaymentPlan.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<DailyBriefing> dailyBriefing() async {
    final response = await _dio.get('/briefing/daily');
    return DailyBriefing.fromJson(response.data['data'] as Map<String, dynamic>);
  }
}
