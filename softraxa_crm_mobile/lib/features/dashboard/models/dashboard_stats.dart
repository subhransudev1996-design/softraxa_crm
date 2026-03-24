class DashboardStats {
  final int totalLeads;
  final int followUpsToday;
  final int pendingTasks;
  final int wonLeads;

  DashboardStats({
    required this.totalLeads,
    required this.followUpsToday,
    required this.pendingTasks,
    required this.wonLeads,
  });

  factory DashboardStats.empty() => DashboardStats(
    totalLeads: 0,
    followUpsToday: 0,
    pendingTasks: 0,
    wonLeads: 0,
  );
}
