class ClientProfile {
  final String id;
  final String fullName;
  final String? avatarUrl;
  final String role;
  final DateTime createdAt;
  final String? industry;
  final String? company;
  final String? email;
  final String? phone;
  final String type; // 'account' or 'converted_lead'

  ClientProfile({
    required this.id,
    required this.fullName,
    this.avatarUrl,
    required this.role,
    required this.createdAt,
    this.industry,
    this.company,
    this.email,
    this.phone,
    required this.type,
  });

  factory ClientProfile.fromJson(Map<String, dynamic> json, {String type = 'account'}) {
    return ClientProfile(
      id: json['id'],
      fullName: json['full_name'] ?? json['name'] ?? 'Unknown Client',
      avatarUrl: json['avatar_url'],
      role: json['role'] ?? 'client',
      createdAt: DateTime.parse(json['created_at']),
      industry: json['industry'] ?? json['category'],
      company: json['company'],
      email: json['email'],
      phone: json['phone'],
      type: type,
    );
  }
}
