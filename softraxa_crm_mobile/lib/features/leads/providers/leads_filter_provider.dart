import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/leads_filter.dart';

final leadsFilterProvider =
    NotifierProvider<LeadsFilterNotifier, LeadsFilter>(LeadsFilterNotifier.new);

class LeadsFilterNotifier extends Notifier<LeadsFilter> {
  @override
  LeadsFilter build() => LeadsFilter();

  void updateFilter(LeadsFilter filter) {
    state = filter;
  }

  void updateStatus(String status) {
    state = state.copyWith(status: status);
  }

  void updateCategory(String category) {
    state = state.copyWith(category: category);
  }

  void updateSearch(String searchQuery) {
    state = state.copyWith(searchQuery: searchQuery);
  }

  void updateTier(String tier) {
    state = state.copyWith(leadTier: tier);
  }

  void updateQuality(String quality) {
    state = state.copyWith(websiteQuality: quality);
  }
}
