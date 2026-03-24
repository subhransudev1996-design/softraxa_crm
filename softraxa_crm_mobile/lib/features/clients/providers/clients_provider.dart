import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/client_model.dart';

final clientsProvider = FutureProvider<List<ClientProfile>>((ref) async {
  final supabase = Supabase.instance.client;

  final userId = supabase.auth.currentUser?.id;
  if (userId == null) return [];

  // 1. Fetch registered client profiles (Admin sees all, others see none for now as they aren't linked)
  final profilesResponse = await supabase.from('profiles').select().eq('role', 'client');

  // 2. Fetch 'won' leads (converted clients) owned by the current user
  final leadsResponse = await supabase
      .from('leads')
      .select()
      .eq('status', 'won')
      .or('assigned_to.eq.$userId,converted_by.eq.$userId');

  final List<ClientProfile> clients = [];

  // Fetch current user's role
  final userProfileResponse = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  final isAdmin = (userProfileResponse != null && userProfileResponse['role'] == 'admin');

  // Add profiles only for admins
  if (isAdmin) {
    for (var profileJson in (profilesResponse as List)) {
      clients.add(ClientProfile.fromJson(profileJson, type: 'account'));
    }
  }

  // Add won leads (ensuring no duplicates if they share IDs)
  for (var leadJson in (leadsResponse as List)) {
    final leadId = leadJson['id'];
    if (!clients.any((c) => c.id == leadId)) {
      clients.add(ClientProfile.fromJson(leadJson, type: 'converted_lead'));
    }
  }

  // Sort by creation date descending
  clients.sort((a, b) => b.createdAt.compareTo(a.createdAt));

  return clients;
});
