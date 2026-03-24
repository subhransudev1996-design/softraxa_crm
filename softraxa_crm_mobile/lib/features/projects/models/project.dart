class Project {
  final String id;
  final String name;
  final String? description;
  final String status;
  final String? clientId;
  final String? clientName;
  final double budget;
  final DateTime? endDate;
  final int completionPercentage;
  final DateTime createdAt;

  Project({
    required this.id,
    required this.name,
    this.description,
    required this.status,
    this.clientId,
    this.clientName,
    required this.budget,
    this.endDate,
    required this.completionPercentage,
    required this.createdAt,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      status: json['status'] ?? 'active',
      clientId: json['client_id'],
      clientName: json['profiles']?['full_name'],
      budget: (json['budget'] as num?)?.toDouble() ?? 0.0,
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'])
          : null,
      completionPercentage: json['completion_percentage'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
