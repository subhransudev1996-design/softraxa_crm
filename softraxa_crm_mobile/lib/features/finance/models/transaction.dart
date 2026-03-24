enum TransactionType { revenue, expense }

class Transaction {
  final String id;
  final String? projectId;
  final String? projectName;
  final double amount;
  final String description;
  final String status;
  final TransactionType type;
  final DateTime createdAt;

  Transaction({
    required this.id,
    this.projectId,
    this.projectName,
    required this.amount,
    required this.description,
    required this.status,
    required this.type,
    required this.createdAt,
  });

  factory Transaction.fromInvoice(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      projectId: json['project_id'],
      projectName: json['projects']?['name'],
      amount: (json['amount'] as num).toDouble(),
      description: json['notes'] ?? 'Invoice',
      status: json['status'] ?? 'paid',
      type: TransactionType.revenue,
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  factory Transaction.fromExpense(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      projectId: json['project_id'],
      projectName: json['projects']?['name'],
      amount: (json['amount'] as num).toDouble(),
      description: json['description'] ?? 'Expense',
      status: 'paid',
      type: TransactionType.expense,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
