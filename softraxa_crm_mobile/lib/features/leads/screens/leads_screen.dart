import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/leads_provider.dart';
import '../widgets/lead_card.dart';
import '../providers/leads_filter_provider.dart';
import '../models/leads_filter.dart';

class LeadsScreen extends ConsumerWidget {
  const LeadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leadsAsync = ref.watch(leadsProvider);
    final filters = ref.watch(leadsFilterProvider);

    final statusList = [
      'all',
      'new',
      'contacted',
      'qualified',
      'negotiation',
      'follow_up',
      'on_hold',
      'unresponsive',
      'won',
      'lost',
      'junk'
    ];
    final categories = [
      'all',
      'restaurant',
      'clinic',
      'education',
      'institute',
      'corporate',
      'manufacturing',
      'real estate',
      'gym',
      'e-commerce',
      'saas',
      'other'
    ];
    final tiers = ['all', 'normal', 'premium'];
    final qualities = ['all', 'poor', 'average', 'good', 'excellent'];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Leads Management',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        actions: [
          IconButton(
            icon: Icon(
              (filters.category != 'all' ||
                      filters.leadTier != 'all' ||
                      filters.websiteQuality != 'all')
                  ? Icons.filter_alt
                  : Icons.filter_alt_outlined,
              color: (filters.category != 'all' ||
                      filters.leadTier != 'all' ||
                      filters.websiteQuality != 'all')
                  ? Colors.blue
                  : Colors.black,
            ),
            onPressed: () => _showFilterModal(context, ref, categories, tiers, qualities),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(leadsProvider),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(110),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  height: 45,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: TextField(
                    onChanged: (val) => ref
                        .read(leadsFilterProvider.notifier)
                        .updateSearch(val),
                    decoration: const InputDecoration(
                      hintText: 'Search leads...',
                      prefixIcon: Icon(Icons.search, size: 20),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.only(top: 8),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: statusList.map((status) {
                    final isSelected = filters.status == status;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        selected: isSelected,
                        label: Text(
                          status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : Colors.grey[600],
                          ),
                        ),
                        backgroundColor: Colors.grey[100],
                        selectedColor: Colors.black,
                        showCheckmark: false,
                        onSelected: (val) {
                          ref
                              .read(leadsFilterProvider.notifier)
                              .updateStatus(status);
                        },
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: BorderSide(
                            color: isSelected ? Colors.black : Colors.transparent,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
      body: leadsAsync.when(
        data: (leads) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(leadsProvider),
          child: leads.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: leads.length,
                  itemBuilder: (context, index) => LeadCard(lead: leads[index]),
                ),
        ),
        loading: () => const Center(
          child: CircularProgressIndicator(color: Colors.black),
        ),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/leads/add'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 4,
        icon: const Icon(Icons.add),
        label: const Text(
          'ADD LEAD',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No leads found',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey[400],
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterModal(
    BuildContext context,
    WidgetRef ref,
    List<String> categories,
    List<String> tiers,
    List<String> qualities,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return Consumer(builder: (context, ref, _) {
              final activeFilters = ref.watch(leadsFilterProvider);

              return ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(24),
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Advanced Filters',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          ref
                              .read(leadsFilterProvider.notifier)
                              .updateFilter(LeadsFilter());
                          Navigator.pop(context);
                        },
                        child: const Text('Reset All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _buildFilterSection(
                    'Industry Category',
                    categories,
                    activeFilters.category,
                    (val) => ref
                        .read(leadsFilterProvider.notifier)
                        .updateCategory(val),
                  ),
                  const SizedBox(height: 24),
                  _buildFilterSection(
                    'Lead Tier',
                    tiers,
                    activeFilters.leadTier,
                    (val) => ref
                        .read(leadsFilterProvider.notifier)
                        .updateTier(val),
                  ),
                  const SizedBox(height: 24),
                  _buildFilterSection(
                    'Website Quality',
                    qualities,
                    activeFilters.websiteQuality,
                    (val) => ref
                        .read(leadsFilterProvider.notifier)
                        .updateQuality(val),
                  ),
                  const SizedBox(height: 40),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(56),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'APPLY FILTERS',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              );
            });
          },
        );
      },
    );
  }

  Widget _buildFilterSection(
    String title,
    List<String> options,
    String currentValue,
    Function(String) onSelected,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title.toUpperCase(),
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: Colors.grey[500],
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((opt) {
            final isSelected = currentValue == opt.toLowerCase() ||
                (currentValue == 'all' && opt == 'all');
            return ChoiceChip(
              selected: isSelected,
              label: Text(
                opt,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : Colors.black,
                ),
              ),
              selectedColor: Colors.black,
              backgroundColor: Colors.grey[100],
              showCheckmark: false,
              onSelected: (val) => onSelected(opt.toLowerCase()),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: isSelected ? Colors.black : Colors.transparent,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
