import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/employee_profile.dart';

final hrmProvider = AsyncNotifierProvider<HRMNotifier, List<EmployeeProfile>>(
  HRMNotifier.new,
);

class HRMNotifier extends AsyncNotifier<List<EmployeeProfile>> {
  @override
  Future<List<EmployeeProfile>> build() async {
    return _fetchEmployees();
  }

  Future<List<EmployeeProfile>> _fetchEmployees() async {
    final response = await Supabase.instance.client
        .from('profiles')
        .select('*')
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => EmployeeProfile.fromJson(json))
        .toList();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchEmployees());
  }

  Future<void> updateEmployeePhone(String userId, String phone) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await Supabase.instance.client
          .from('profiles')
          .update({'phone': phone})
          .eq('id', userId);
      return _fetchEmployees();
    });
  }
}

final hrmMembersProvider = Provider<AsyncValue<List<EmployeeProfile>>>((ref) {
  final hrmAsync = ref.watch(hrmProvider);
  return hrmAsync.whenData((profiles) =>
      profiles.where((p) => p.role.toLowerCase() == 'member').toList());
});
final hrmEligibleClosersProvider = Provider<AsyncValue<List<EmployeeProfile>>>((ref) {
  final hrmAsync = ref.watch(hrmProvider);
  return hrmAsync.whenData((profiles) => profiles
      .where((p) =>
          p.role.toLowerCase() == 'admin' ||
          p.role.toLowerCase() == 'member' ||
          p.role.toLowerCase() == 'employee')
      .toList());
});
