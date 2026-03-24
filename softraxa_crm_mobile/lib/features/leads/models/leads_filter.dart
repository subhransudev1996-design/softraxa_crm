class LeadsFilter {
  final String status;
  final String category;
  final String leadTier;
  final String websiteQuality;
  final String searchQuery;

  LeadsFilter({
    this.status = 'all',
    this.category = 'all',
    this.leadTier = 'all',
    this.websiteQuality = 'all',
    this.searchQuery = '',
  });

  LeadsFilter copyWith({
    String? status,
    String? category,
    String? leadTier,
    String? websiteQuality,
    String? searchQuery,
  }) {
    return LeadsFilter(
      status: status ?? this.status,
      category: category ?? this.category,
      leadTier: leadTier ?? this.leadTier,
      websiteQuality: websiteQuality ?? this.websiteQuality,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}
