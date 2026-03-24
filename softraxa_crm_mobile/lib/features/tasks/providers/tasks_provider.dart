import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/app_task.dart';

final tasksProvider = AsyncNotifierProvider<TasksNotifier, List<AppTask>>(
  TasksNotifier.new,
);

class TasksNotifier extends AsyncNotifier<List<AppTask>> {
  @override
  Future<List<AppTask>> build() async {
    return _fetchTasks();
  }

  Future<List<AppTask>> _fetchTasks() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return [];

    final response = await Supabase.instance.client
        .from('tasks')
        .select('*, projects(name), profiles:assignee_id(full_name)')
        .eq('assignee_id', userId)
        .order('created_at', ascending: false);

    return (response as List).map((json) => AppTask.fromJson(json)).toList();
  }

  Future<void> updateTaskStatus(String taskId, String newStatus) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await Supabase.instance.client
          .from('tasks')
          .update({'status': newStatus})
          .eq('id', taskId);
      return _fetchTasks();
    });
  }

  Future<void> addTask({
    required String title,
    String? description,
    String? assigneeId,
    DateTime? dueDate,
    String priority = 'medium',
    String? projectId,
    String? leadId,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await Supabase.instance.client.from('tasks').insert({
        'title': title,
        'description': description,
        'assignee_id': assigneeId,
        'due_date': dueDate?.toIso8601String(),
        'priority': priority,
        'status': 'todo',
        'project_id': projectId,
        'lead_id': leadId,
      });
      return _fetchTasks();
    });
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchTasks());
  }
}
