import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/project.dart';

final projectsProvider = AsyncNotifierProvider<ProjectsNotifier, List<Project>>(
  ProjectsNotifier.new,
);

class ProjectsNotifier extends AsyncNotifier<List<Project>> {
  @override
  Future<List<Project>> build() async {
    return _fetchProjects();
  }

  Future<List<Project>> _fetchProjects() async {
    final response = await Supabase.instance.client
        .from('projects')
        .select('*, profiles:client_id(full_name)')
        .order('created_at', ascending: false);

    return (response as List).map((json) => Project.fromJson(json)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchProjects());
  }
}
