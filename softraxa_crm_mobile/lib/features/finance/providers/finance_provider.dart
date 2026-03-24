import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/transaction.dart';

class FinanceState {
  final List<Transaction> transactions;
  final double totalRevenue;
  final double totalExpenses;
  final double netBalance;

  FinanceState({
    required this.transactions,
    required this.totalRevenue,
    required this.totalExpenses,
    required this.netBalance,
  });

  factory FinanceState.empty() => FinanceState(
    transactions: [],
    totalRevenue: 0,
    totalExpenses: 0,
    netBalance: 0,
  );
}

final financeProvider = AsyncNotifierProvider<FinanceNotifier, FinanceState>(
  FinanceNotifier.new,
);

class FinanceNotifier extends AsyncNotifier<FinanceState> {
  @override
  Future<FinanceState> build() async {
    return _fetchFinanceData();
  }

  Future<FinanceState> _fetchFinanceData() async {
    final client = Supabase.instance.client;

    final results = await Future.wait([
      client
          .from('invoices')
          .select('*, projects(name)')
          .order('created_at', ascending: false),
      client
          .from('expenses')
          .select('*, projects(name)')
          .order('created_at', ascending: false),
    ]);

    final invoicesData = results[0] as List;
    final expensesData = results[1] as List;

    final List<Transaction> transactions = [];
    double totalRevenue = 0;
    double totalExpenses = 0;

    for (var inv in invoicesData) {
      final t = Transaction.fromInvoice(inv);
      transactions.add(t);
      totalRevenue += t.amount;
    }

    for (var exp in expensesData) {
      final t = Transaction.fromExpense(exp);
      transactions.add(t);
      totalExpenses += t.amount;
    }

    transactions.sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return FinanceState(
      transactions: transactions,
      totalRevenue: totalRevenue,
      totalExpenses: totalExpenses,
      netBalance: totalRevenue - totalExpenses,
    );
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchFinanceData());
  }
}
