import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/lead_model.dart';
import '../../../core/utils/communication_utils.dart';
import 'package:go_router/go_router.dart';

class LeadCard extends StatelessWidget {
  final Lead lead;
  final VoidCallback? onStatusTap;

  const LeadCard({super.key, required this.lead, this.onStatusTap});

  @override
  Widget build(BuildContext context) {
    final statusColors = {
      'won': Colors.green,
      'lost': Colors.red,
      'negotiation': Colors.indigo,
      'qualified': Colors.teal,
      'follow_up': Colors.cyan,
      'on_hold': Colors.amber,
    };

    final statusColor = statusColors[lead.status.toLowerCase()] ?? Colors.blue;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () => context.push('/leads/details', extra: lead),
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Text(
                        (lead.company ?? lead.name).substring(0, 1).toUpperCase(),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Colors.black38,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                lead.company ?? lead.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.5,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (lead.category != null) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(
                                      color: Colors.black.withValues(alpha: 0.05)),
                                ),
                                child: Text(
                                  lead.category!.toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 8,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.black45,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          lead.name,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _StatusBadge(status: lead.status, color: statusColor),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lead.value != null
                            ? '₹${lead.value!.toStringAsFixed(0)}'
                            : 'TBD',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const Text(
                        'EST. VALUE',
                        style: TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          color: Colors.black26,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 32),
                  if (lead.followUpDate != null)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DateFormat('MMM dd').format(lead.followUpDate!),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: lead.followUpDate!.isBefore(DateTime.now())
                                ? Colors.red
                                : Colors.black,
                          ),
                        ),
                        const Text(
                          'FOLLOW UP',
                          style: TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                            color: Colors.black26,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  const Spacer(),
                  IconButton.filledTonal(
                    onPressed: () => CommunicationUtils.launchCall(lead.phone!),
                    icon: const Icon(Icons.phone, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.black.withValues(alpha: 0.05),
                      foregroundColor: Colors.black,
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (lead.email != null)
                    IconButton.filledTonal(
                      onPressed: () => CommunicationUtils.launchEmail(lead.email!),
                      icon: const Icon(Icons.mail, size: 18),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.black.withValues(alpha: 0.05),
                        foregroundColor: Colors.black,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  final Color color;

  const _StatusBadge({required this.status, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
