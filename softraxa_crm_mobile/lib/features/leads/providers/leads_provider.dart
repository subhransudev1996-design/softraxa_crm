import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/lead_model.dart';
import 'leads_filter_provider.dart';

final leadsProvider = AsyncNotifierProvider<LeadsNotifier, List<Lead>>(
  LeadsNotifier.new,
);

class LeadsNotifier extends AsyncNotifier<List<Lead>> {
  @override
  Future<List<Lead>> build() async {
    final filters = ref.watch(leadsFilterProvider);
    return fetchLeads(
      filters.status,
      filters.category,
      filters.leadTier,
      filters.websiteQuality,
      filters.searchQuery,
    );
  }

  Future<List<Lead>> fetchLeads(
    String status,
    String category,
    String leadTier,
    String websiteQuality,
    String searchQuery,
  ) async {
    var query = Supabase.instance.client.from('leads').select();

    if (status != 'all') {
      query = query.eq('status', status);
    } else {
      query = query.neq('status', 'won');
    }

    if (category != 'all') {
      query = query.eq('category', category);
    }

    if (leadTier != 'all') {
      query = query.eq('lead_tier', leadTier);
    }

    if (websiteQuality != 'all') {
      query = query.eq('website_quality', websiteQuality);
    }

    if (searchQuery.isNotEmpty) {
      query = query.or(
        'name.ilike.%$searchQuery%,company.ilike.%$searchQuery%,email.ilike.%$searchQuery%,phone.ilike.%$searchQuery%',
      );
    }

    final response = await query.order('created_at', ascending: false);

    return (response as List).map((json) => Lead.fromJson(json)).toList();
  }

  Future<void> updateStatus(String id, String status) async {
    await Supabase.instance.client
        .from('leads')
        .update({'status': status})
        .eq('id', id);

    ref.invalidateSelf();
  }

  Future<void> updateLead(String id, Map<String, dynamic> updates) async {
    await Supabase.instance.client.from('leads').update(updates).eq('id', id);
    ref.invalidateSelf();
  }

  Future<void> deleteLead(String id) async {
    await Supabase.instance.client.from('leads').delete().eq('id', id);
    ref.invalidateSelf();
  }

  Future<void> createLead(Map<String, dynamic> data) async {
    await Supabase.instance.client.from('leads').insert(data);
    ref.invalidateSelf();
  }
}

final leadProvider = Provider.family<Lead?, String>((ref, id) {
  final leadsAsync = ref.watch(leadsProvider);
  return leadsAsync.when(
    data: (leads) => leads.any((l) => l.id == id) ? leads.firstWhere((l) => l.id == id) : null,
    loading: () => null,
    error: (_, __) => null,
  );
});

// Dedicated provider for a single lead — can be invalidated independently for instant refresh
final singleLeadProvider = FutureProvider.family<Lead?, String>((ref, id) async {
  // Watch leadsProvider so it also updates when the list refreshes
  ref.watch(leadsProvider);
  final response = await Supabase.instance.client
      .from('leads')
      .select()
      .eq('id', id)
      .maybeSingle();
  if (response == null) return null;
  return Lead.fromJson(response);
});

final followUpsProvider = FutureProvider<List<Lead>>((ref) async {
  final todayStr = DateTime.now().toIso8601String().split('T')[0];

  final response = await Supabase.instance.client
      .from('leads')
      .select()
      .lte('follow_up_date', todayStr)
      .not('status', 'in', '("won","lost")')
      .order('follow_up_date', ascending: true);

  return (response as List).map((json) => Lead.fromJson(json)).toList();
});
