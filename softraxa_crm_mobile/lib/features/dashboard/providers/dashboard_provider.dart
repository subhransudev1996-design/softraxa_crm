import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/dashboard_stats.dart';

final dashboardProvider =
    AsyncNotifierProvider<DashboardNotifier, DashboardStats>(
      DashboardNotifier.new,
    );

class DashboardNotifier extends AsyncNotifier<DashboardStats> {
  @override
  Future<DashboardStats> build() async {
    return _fetchStats();
  }

  Future<DashboardStats> _fetchStats() async {
    final client = Supabase.instance.client;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day).toIso8601String();

    try {
      final userId = client.auth.currentUser?.id;
      final results = await Future.wait<dynamic>([
        client.from('leads').count(CountOption.exact),
        client.from('leads').select('id').eq('follow_up_date', today),
        userId != null
            ? client
                .from('tasks')
                .select('id')
                .eq('assignee_id', userId)
                .neq('status', 'done')
            : Future.value([]),
        userId != null
            ? client
                .from('leads')
                .count(CountOption.exact)
                .eq('status', 'won')
                .eq('assigned_to', userId)
            : Future.value(0),
      ]);

      final totalLeads = results[0] as int;
      final followUpsQuery = results[1] as List;
      final tasksQuery = results[2] as List;
      final wonLeadsCount = results[3] as int;

      return DashboardStats(
        totalLeads: totalLeads,
        followUpsToday: followUpsQuery.length,
        pendingTasks: tasksQuery.length,
        wonLeads: wonLeadsCount,
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchStats());
  }
}
