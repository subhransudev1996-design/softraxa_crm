import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/hrm_provider.dart';
import '../models/employee_profile.dart';
import '../../../core/utils/communication_utils.dart';

class HRMScreen extends ConsumerWidget {
  const HRMScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hrmAsync = ref.watch(hrmProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Team Directory',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(hrmProvider.notifier).refresh(),
          ),
        ],
      ),
      body: hrmAsync.when(
        data: (employees) => RefreshIndicator(
          onRefresh: () => ref.read(hrmProvider.notifier).refresh(),
          child: ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: employees.length,
            itemBuilder: (context, index) =>
                _EmployeeTile(employee: employees[index]),
          ),
        ),
        loading: () =>
            const Center(child: CircularProgressIndicator(color: Colors.black)),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  void _showPhoneEditDialog(
      BuildContext context, WidgetRef ref, EmployeeProfile employee) {
    final controller = TextEditingController(text: employee.phone);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit Phone: ${employee.fullName}'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'Enter phone number (e.g. 919876543210)',
            labelText: 'Phone Number',
          ),
          keyboardType: TextInputType.phone,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              await ref
                  .read(hrmProvider.notifier)
                  .updateEmployeePhone(employee.id, controller.text);
              navigator.pop();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _EmployeeTile extends StatelessWidget {
  final EmployeeProfile employee;

  const _EmployeeTile({required this.employee});

  @override
  Widget build(BuildContext context) {
    final isBlocked = employee.status == 'blocked';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[100]!),
      ),
      child: Row(
        children: [
          Stack(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(16),
                  image: employee.avatarUrl != null
                      ? DecorationImage(
                          image: NetworkImage(employee.avatarUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: employee.avatarUrl == null
                    ? Center(
                        child: Text(
                          employee.fullName.substring(0, 1).toUpperCase(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: Colors.black,
                          ),
                        ),
                      )
                    : null,
              ),
              if (isBlocked)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.block,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      employee.fullName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    if (isBlocked) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red[50],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'BLOCKED',
                          style: TextStyle(
                            fontSize: 7,
                            fontWeight: FontWeight.w900,
                            color: Colors.red,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                if (employee.phone != null && employee.phone!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    employee.phone!,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
                const SizedBox(height: 2),
                Text(
                  employee.role.toUpperCase(),
                  style: TextStyle(
                    fontSize: 9,
                    color: Colors.grey[400],
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Lvl ${employee.level}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                ),
              ),
              Text(
                '${employee.points} XP',
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[400],
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          Row(
            children: [
              if (employee.phone != null && employee.phone!.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.send, color: Colors.green, size: 20),
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                  onPressed: () => CommunicationUtils.launchWhatsApp(
                    employee.phone!,
                    message: 'Hello ${employee.fullName}, ',
                  ),
                ),
              const SizedBox(width: 8),
              Consumer(
                builder: (context, ref, child) => IconButton(
                  icon: const Icon(Icons.edit, color: Colors.blue, size: 18),
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                  onPressed: () => context.findAncestorWidgetOfExactType<HRMScreen>()
                      ?._showPhoneEditDialog(context, ref, employee),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
