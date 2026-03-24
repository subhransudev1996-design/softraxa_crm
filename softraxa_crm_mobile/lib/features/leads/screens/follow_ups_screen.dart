import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/leads_provider.dart';
import '../widgets/lead_card.dart';

class FollowUpsScreen extends ConsumerWidget {
  const FollowUpsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final followUpsAsync = ref.watch(followUpsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Follow-ups')),
      body: followUpsAsync.when(
        data: (leads) {
          if (leads.isEmpty) {
            return const Center(child: Text('No follow-ups for today!'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: leads.length,
            itemBuilder: (context, index) => LeadCard(lead: leads[index]),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
