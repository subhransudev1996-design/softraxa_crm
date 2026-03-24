class EmployeeProfile {
  final String id;
  final String fullName;
  final String role;
  final String? avatarUrl;
  final String? phone;
  final int level;
  final int points;
  final String status;
  final DateTime createdAt;

  EmployeeProfile({
    required this.id,
    required this.fullName,
    required this.role,
    this.avatarUrl,
    this.phone,
    required this.level,
    required this.points,
    required this.status,
    required this.createdAt,
  });

  factory EmployeeProfile.fromJson(Map<String, dynamic> json) {
    return EmployeeProfile(
      id: json['id'],
      fullName: json['full_name'] ?? 'Unknown',
      role: json['role'] ?? 'member',
      avatarUrl: json['avatar_url'],
      phone: json['phone'],
      level: json['level'] ?? 1,
      points: json['points'] ?? 0,
      status: json['status'] ?? 'active',
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
