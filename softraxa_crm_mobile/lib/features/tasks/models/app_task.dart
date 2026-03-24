class AppTask {
  final String id;
  final String title;
  final String? projectId;
  final String? projectName;
  final String? assigneeId;
  final String? assigneeName;
  final DateTime? dueDate;
  final String priority;
  final String status;
  final String? leadId;
  final DateTime createdAt;

  AppTask({
    required this.id,
    required this.title,
    this.projectId,
    this.projectName,
    this.assigneeId,
    this.assigneeName,
    this.leadId,
    this.dueDate,
    required this.priority,
    required this.status,
    required this.createdAt,
  });

  factory AppTask.fromJson(Map<String, dynamic> json) {
    return AppTask(
      id: json['id'],
      title: json['title'],
      projectId: json['project_id'],
      projectName: json['projects']?['name'],
      assigneeId: json['assignee_id'],
      assigneeName: json['profiles']?['full_name'],
      leadId: json['lead_id'],
      dueDate: json['due_date'] != null
          ? DateTime.parse(json['due_date'])
          : null,
      priority: json['priority'] ?? 'medium',
      status: json['status'] ?? 'todo',
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() => {
    'title': title,
    'project_id': projectId,
    'assignee_id': assigneeId,
    'lead_id': leadId,
    'due_date': dueDate?.toIso8601String(),
    'priority': priority,
    'status': status,
  };
}
