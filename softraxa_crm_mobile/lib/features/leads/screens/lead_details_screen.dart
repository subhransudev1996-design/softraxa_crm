import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../models/lead_model.dart';
import '../models/whatsapp_templates.dart';
import '../providers/leads_provider.dart';
import '../../../core/utils/communication_utils.dart';
import '../../auth/providers/auth_provider.dart';
import '../../hrm/models/employee_profile.dart';
import '../../hrm/providers/hrm_provider.dart';
import '../../tasks/providers/tasks_provider.dart';

class LeadDetailsScreen extends ConsumerWidget {
  final Lead lead;

  const LeadDetailsScreen({super.key, required this.lead});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Use singleLeadProvider so we can invalidate it for instant refresh
    final leadAsync = ref.watch(singleLeadProvider(lead.id));
    final currentLead = leadAsync.when(
      data: (l) => l ?? lead,
      loading: () => lead,
      error: (_, __) => lead,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Lead Details', style: TextStyle(fontWeight: FontWeight.w900)),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push('/leads/edit', extra: currentLead),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: () => _confirmDelete(context, ref),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildHeader(context, ref, currentLead),
          const SizedBox(height: 24),
          _buildQuickActions(context, ref, currentLead),
          const SizedBox(height: 24),
          _buildDetailCard('Contact Details', [
            _buildDetailRow(Icons.mail_outline_rounded, 'EMAIL ADDRESS', currentLead.email ?? 'Not available'),
            _buildDetailRow(Icons.phone_iphone_rounded, 'PHONE NUMBER', currentLead.phone ?? 'Not available'),
            _buildDetailRow(Icons.location_on_outlined, 'OFFICE ADDRESS', currentLead.address ?? 'Not available'),
          ]),
          const SizedBox(height: 16),
          _buildDetailCard('Project Intelligence', [
            _buildDetailRow(Icons.business_center_outlined, 'INDUSTRY', (currentLead.category ?? 'Other').toUpperCase()),
            _buildDetailRow(Icons.layers_outlined, 'LEAD TIER', (currentLead.leadTier ?? 'NORMAL').toUpperCase()),
            _buildDetailRow(Icons.currency_rupee_rounded, 'ESTIMATED VALUE', currentLead.value != null ? '₹${NumberFormat('#,##,###').format(currentLead.value)}' : 'TBD'),
            _buildDetailRow(Icons.calendar_today_rounded, 'NEXT FOLLOW-UP', () {
              if (currentLead.followUpDate == null) return 'Not scheduled';
              final dateStr = DateFormat('MMMM dd, yyyy').format(currentLead.followUpDate!);
              // Time comes from the separate follow_up_time column (format: 'HH:MM')
              final time = currentLead.followUpTime;
              if (time == null || time.isEmpty) return dateStr;
              // Convert 24h HH:MM to 12h display
              final parts = time.split(':');
              if (parts.length != 2) return dateStr;
              final h = int.tryParse(parts[0]) ?? 0;
              final m = int.tryParse(parts[1]) ?? 0;
              final tod = TimeOfDay(hour: h, minute: m);
              // Use MaterialLocalizations for locale-aware 12h format
              final timeStr = tod.hour == 0 && tod.minute == 0
                  ? ''
                  : ' at ${tod.hour > 12 ? tod.hour - 12 : tod.hour == 0 ? 12 : tod.hour}:${tod.minute.toString().padLeft(2, '0')} ${tod.hour >= 12 ? 'PM' : 'AM'}';
              return '$dateStr$timeStr';
            }()),
          ]),
          const SizedBox(height: 16),
          _buildDetailCard('Ownership & Attribution', [
            Consumer(builder: (context, ref, _) {
              final hrmAsync = ref.watch(hrmProvider);
              return hrmAsync.when(
                data: (members) {
                  final creator = members.any((m) => m.id == currentLead.createdBy)
                      ? members.firstWhere((m) => m.id == currentLead.createdBy).fullName
                      : (currentLead.createdBy == null ? 'System' : 'Unknown');
                  return _buildDetailRow(Icons.history_edu_rounded, 'ADDED BY', creator);
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              );
            }),
            if (currentLead.assignedTo != null)
              Consumer(builder: (context, ref, _) {
                final hrmAsync = ref.watch(hrmProvider);
                return hrmAsync.when(
                  data: (members) {
                    final assigned = members.any((m) => m.id == currentLead.assignedTo)
                        ? members.firstWhere((m) => m.id == currentLead.assignedTo).fullName
                        : 'Unknown';
                    return _buildDetailRow(Icons.person_pin_rounded, 'ASSIGNED REP', assigned);
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                );
              }),
            if (currentLead.status.toLowerCase() == 'won' && currentLead.convertedBy != null)
              Consumer(builder: (context, ref, _) {
                final hrmAsync = ref.watch(hrmProvider);
                return hrmAsync.when(
                  data: (members) {
                    final converter = members.any((m) => m.id == currentLead.convertedBy)
                        ? members.firstWhere((m) => m.id == currentLead.convertedBy).fullName
                        : 'Unknown';
                    return _buildDetailRow(Icons.emoji_events_outlined, 'CONVERTED BY', converter);
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                );
              }),
          ]),
          if (currentLead.hasWebsite == true) ...[
            const SizedBox(height: 16),
            _buildDetailCard('Digital Footprint', [
              _buildDetailRow(
                Icons.public_rounded,
                'WEBSITE URL',
                currentLead.websiteUrl ?? 'None provided',
                onTap: currentLead.websiteUrl != null && currentLead.websiteUrl!.isNotEmpty
                    ? () => CommunicationUtils.openUrl(currentLead.websiteUrl!)
                    : null,
              ),
              _buildDetailRow(Icons.speed_rounded, 'WEB QUALITY', (currentLead.websiteQuality ?? 'N/A').toUpperCase()),
              _buildDetailRow(Icons.devices_rounded, 'MOBILE READY', currentLead.isMobileResponsive == true ? 'YES' : 'NO'),
            ]),
          ],
          if (currentLead.notes != null && currentLead.notes!.isNotEmpty) ...[
            const SizedBox(height: 16),
            _buildDetailCard('Internal Intelligence', [
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  currentLead.notes!,
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.6,
                    color: Colors.black.withValues(alpha: 0.7),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ]),
          ],
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, Lead lead) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _StatusBadge(status: lead.status),
            IconButton.filledTonal(
              onPressed: () => _showStatusUpdateBottomSheet(context, ref, lead),
              icon: const Icon(Icons.sync_alt, size: 18),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black.withValues(alpha: 0.05),
                foregroundColor: Colors.black,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          lead.name,
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            letterSpacing: -1,
            height: 1.1,
          ),
        ),
        if (lead.company != null) ...[
          const SizedBox(height: 4),
          Text(
            lead.company!.toUpperCase(),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: Colors.black.withValues(alpha: 0.3),
              letterSpacing: 2,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context, WidgetRef ref, Lead lead) {
    return Row(
      children: [
        if (lead.phone != null) ...[
          _ActionButton(
            icon: Icons.phone,
            label: 'Call',
            onTap: () => CommunicationUtils.launchCall(lead.phone!),
          ),
          const SizedBox(width: 12),
          _ActionButton(
            icon: Icons.message,
            label: 'WhatsApp',
            onTap: () => _showWhatsAppTemplateSheet(context, lead),
            color: const Color(0xFF25D366),
          ),
          const SizedBox(width: 12),
        ],
        if (lead.email != null) ...[
          _ActionButton(
            icon: Icons.mail,
            label: 'Email',
            onTap: () => CommunicationUtils.launchEmail(lead.email!),
            color: Colors.blue,
          ),
          const SizedBox(width: 12),
        ],
        _ActionButton(
          icon: Icons.assignment_add,
          label: 'Task',
          onTap: () => _showAssignTaskSheet(context, ref, lead),
          color: Colors.orange,
        ),
      ],
    );
  }

  Widget _buildDetailCard(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: Colors.black.withValues(alpha: 0.2),
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, {VoidCallback? onTap}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: onTap != null ? 8 : 0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 18, color: Colors.black54),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Colors.black.withValues(alpha: 0.3),
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      value,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: onTap != null ? Colors.blue : Colors.black,
                        decoration: onTap != null ? TextDecoration.underline : null,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Lead'),
        content: const Text('Are you sure you want to delete this lead? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(leadsProvider.notifier).deleteLead(lead.id);
      if (context.mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lead deleted successfully')),
        );
      }
    }
  }

  void _showStatusUpdateBottomSheet(BuildContext context, WidgetRef ref, Lead lead) {
    String selectedStatus = lead.status.toLowerCase();
    DateTime? selectedDate = lead.followUpDate;
    // Parse time from the dedicated follow_up_time field (format: 'HH:MM')
    TimeOfDay? selectedTime;
    if (lead.followUpTime != null && lead.followUpTime!.isNotEmpty) {
      final parts = lead.followUpTime!.split(':');
      if (parts.length == 2) {
        selectedTime = TimeOfDay(
          hour: int.tryParse(parts[0]) ?? 0,
          minute: int.tryParse(parts[1]) ?? 0,
        );
      }
    }
    String? selectedConvertedBy = lead.convertedBy ?? ref.read(authProvider).value?.id;
    final noteController = TextEditingController(text: lead.notes ?? '');

    // Statuses that need date/time/note context
    const followUpStatuses = {
      'contacted', 'qualified', 'negotiation',
      'follow_up', 'on_hold', 'unresponsive',
    };

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final needsFollowUp = followUpStatuses.contains(selectedStatus);

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Header ──────────────────────────────────────
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.sync_alt, size: 16, color: Colors.black),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'Update Status',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ── Status Dropdown ──────────────────────────────
                    const Text(
                      'LEAD STATUS',
                      style: TextStyle(
                        fontSize: 10, fontWeight: FontWeight.w900,
                        color: Colors.grey, letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: selectedStatus,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.grey[50],
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                      items: [
                        'new', 'contacted', 'qualified', 'negotiation',
                        'follow_up', 'on_hold', 'unresponsive', 'won', 'lost', 'junk'
                      ].map((s) => DropdownMenuItem(
                        value: s,
                        child: Text(
                          s.replaceAll('_', ' ').toUpperCase(),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      )).toList(),
                      onChanged: (v) => setModalState(() => selectedStatus = v!),
                    ),

                    // ── Date & Time (conditional) ────────────────────
                    if (needsFollowUp) ...[
                      const SizedBox(height: 20),
                      const Text(
                        'FOLLOW-UP SCHEDULE',
                        style: TextStyle(
                          fontSize: 10, fontWeight: FontWeight.w900,
                          color: Colors.grey, letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          // Date Picker
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final date = await showDatePicker(
                                  context: context,
                                  initialDate: selectedDate ?? DateTime.now().add(const Duration(days: 1)),
                                  firstDate: DateTime.now().subtract(const Duration(days: 365)),
                                  lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
                                  builder: (ctx, child) => Theme(
                                    data: ThemeData.light().copyWith(
                                      colorScheme: const ColorScheme.light(primary: Colors.black),
                                    ),
                                    child: child!,
                                  ),
                                );
                                if (date != null) setModalState(() => selectedDate = date);
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                                decoration: BoxDecoration(
                                  color: selectedDate != null ? Colors.black : Colors.grey[50],
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: selectedDate != null ? Colors.black : Colors.grey.shade200,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.calendar_month_outlined,
                                      size: 16,
                                      color: selectedDate != null ? Colors.white : Colors.grey,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        selectedDate != null
                                            ? DateFormat('MMM dd, yy').format(selectedDate!)
                                            : 'Pick date',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                          color: selectedDate != null ? Colors.white : Colors.grey,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (selectedDate != null)
                                      GestureDetector(
                                        onTap: () => setModalState(() => selectedDate = null),
                                        child: const Icon(Icons.close, size: 14, color: Colors.white70),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          // Time Picker
                          Expanded(
                            child: InkWell(
                              onTap: () async {
                                final time = await showTimePicker(
                                  context: context,
                                  initialTime: selectedTime ?? const TimeOfDay(hour: 10, minute: 0),
                                  builder: (ctx, child) => Theme(
                                    data: ThemeData.light().copyWith(
                                      colorScheme: const ColorScheme.light(primary: Colors.black),
                                    ),
                                    child: child!,
                                  ),
                                );
                                if (time != null) setModalState(() => selectedTime = time);
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                                decoration: BoxDecoration(
                                  color: selectedTime != null ? Colors.black : Colors.grey[50],
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: selectedTime != null ? Colors.black : Colors.grey.shade200,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.access_time_outlined,
                                      size: 16,
                                      color: selectedTime != null ? Colors.white : Colors.grey,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        selectedTime != null
                                            ? selectedTime!.format(context)
                                            : 'Pick time',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                          color: selectedTime != null ? Colors.white : Colors.grey,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (selectedTime != null)
                                      GestureDetector(
                                        onTap: () => setModalState(() => selectedTime = null),
                                        child: const Icon(Icons.close, size: 14, color: Colors.white70),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      // ── Notes Field (conditional) ────────────────
                      const SizedBox(height: 20),
                      const Text(
                        'STATUS NOTE',
                        style: TextStyle(
                          fontSize: 10, fontWeight: FontWeight.w900,
                          color: Colors.grey, letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: noteController,
                        maxLines: 3,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'e.g. Lead asked to call back Thursday at 3pm...',
                          hintStyle: TextStyle(
                            color: Colors.grey[400], fontSize: 13,
                            fontWeight: FontWeight.normal,
                          ),
                          filled: true,
                          fillColor: Colors.grey[50],
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Colors.black, width: 1.5),
                          ),
                          contentPadding: const EdgeInsets.all(16),
                          prefixIcon: const Padding(
                            padding: EdgeInsets.only(left: 12, right: 8, top: 16),
                            child: Icon(Icons.notes_outlined, size: 18, color: Colors.grey),
                          ),
                          prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                        ),
                      ),
                    ],

                    // ── Won: Secured By Dropdown ─────────────────────
                    if (selectedStatus == 'won') ...[
                      const SizedBox(height: 20),
                      const Text(
                        'SECURED BY (WINNER)',
                        style: TextStyle(
                          fontSize: 10, fontWeight: FontWeight.w900,
                          color: Colors.grey, letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Consumer(builder: (context, ref, _) {
                        final closersAsync = ref.watch(hrmEligibleClosersProvider);
                        return closersAsync.when(
                          data: (closers) {
                            final items = <EmployeeProfile>[...closers];
                            if (selectedConvertedBy != null &&
                                !items.any((c) => c.id == selectedConvertedBy)) {
                              final allHrm = ref.read(hrmProvider).value;
                              if (allHrm != null && allHrm.any((c) => c.id == selectedConvertedBy)) {
                                items.add(allHrm.firstWhere((c) => c.id == selectedConvertedBy));
                              }
                            }
                            return DropdownButtonFormField<String>(
                              initialValue: selectedConvertedBy,
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: Colors.grey[50],
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                              ),
                              items: items.map((c) => DropdownMenuItem(
                                value: c.id,
                                child: Text(
                                  '${c.fullName} (${c.role.toUpperCase()})',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              )).toList(),
                              onChanged: (v) => setModalState(() => selectedConvertedBy = v),
                            );
                          },
                          loading: () => const LinearProgressIndicator(),
                          error: (_, __) => const SizedBox.shrink(),
                        );
                      }),
                    ],

                    // ── Update Button ────────────────────────────────
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          final t = selectedTime;
                          final updates = <String, dynamic>{
                            'status': selectedStatus,
                            'follow_up_date': selectedDate?.toIso8601String().split('T')[0],
                            // Save time separately as 'HH:MM' since follow_up_date is a DATE column
                            'follow_up_time': t != null
                                ? '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}'
                                : null,
                            'converted_by': selectedStatus == 'won' ? selectedConvertedBy : null,
                          };

                          // Only update notes if the status requires it
                          if (needsFollowUp && noteController.text.trim().isNotEmpty) {
                            updates['notes'] = noteController.text.trim();
                          }

                          await ref.read(leadsProvider.notifier).updateLead(lead.id, updates);
                          // Invalidate so details page rebuilds immediately with fresh data
                          ref.invalidate(singleLeadProvider(lead.id));
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Row(children: [
                                  Icon(Icons.check_circle, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text('Status updated!', style: TextStyle(fontWeight: FontWeight.bold)),
                                ]),
                                backgroundColor: Colors.black,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.all(18),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text(
                          'UPDATE LEAD',
                          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showAssignTaskSheet(BuildContext context, WidgetRef ref, Lead lead) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AssignTaskBottomSheet(lead: lead),
    );
  }

  void _showWhatsAppTemplateSheet(BuildContext context, Lead lead) {
    final templates = WhatsAppTemplate.getTemplates(lead);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF25D366).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.message, size: 16, color: Color(0xFF25D366)),
                ),
                const SizedBox(width: 10),
                const Text(
                  'WhatsApp Templates',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Select a template to send to ${lead.name}',
              style: TextStyle(
                fontSize: 14,
                color: Colors.black.withValues(alpha: 0.5),
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 24),
            ConstrainedBox(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.6,
              ),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: templates.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final template = templates[index];
                  final message = template.messageGenerator(lead);

                  return InkWell(
                    onTap: () {
                      Navigator.pop(context);
                      if (template.requiresDemoLink) {
                        _showDemoLinkInputDialog(context, lead, template);
                      } else {
                        final message = template.messageGenerator(lead);
                        CommunicationUtils.launchWhatsApp(lead.phone!, message: message);
                      }
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                template.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: template.category == 'Status-based'
                                      ? Colors.blue.withValues(alpha: 0.1)
                                      : Colors.orange.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  template.category.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    color: template.category == 'Status-based' ? Colors.blue : Colors.orange,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            message,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.black.withValues(alpha: 0.6),
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  CommunicationUtils.launchWhatsApp(lead.phone!);
                },
                child: const Text(
                  'SEND WITHOUT TEMPLATE',
                  style: TextStyle(
                    color: Colors.grey,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDemoLinkInputDialog(BuildContext context, Lead lead, WhatsAppTemplate template) {
    final linkController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Enter Demo Link', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Please provide the demo website link to include in the message.',
              style: TextStyle(fontSize: 13, color: Colors.grey, height: 1.4),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: linkController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'https://demo.softraxa.com/preview',
                hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
                filled: true,
                fillColor: Colors.grey[50],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black, width: 1.5),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0, right: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('CANCEL', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 13)),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () {
                    final link = linkController.text.trim();
                    if (link.isNotEmpty) {
                      Navigator.pop(context);
                      final message = template.messageGenerator(lead, demoLink: link);
                      CommunicationUtils.launchWhatsApp(lead.phone!, message: message);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                  child: const Text('SEND', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    const statusColors = {
      'won': Colors.green,
      'lost': Colors.red,
      'negotiation': Colors.indigo,
      'qualified': Colors.teal,
      'follow_up': Colors.cyan,
      'on_hold': Colors.amber,
    };

    final color = statusColors[status.toLowerCase()] ?? Colors.blue;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = color ?? Colors.black;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: activeColor.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: activeColor.withValues(alpha: 0.1)),
          ),
          child: Column(
            children: [
              Icon(icon, size: 20, color: activeColor),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: activeColor),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AssignTaskBottomSheet extends ConsumerStatefulWidget {
  final Lead lead;
  const _AssignTaskBottomSheet({required this.lead});

  @override
  ConsumerState<_AssignTaskBottomSheet> createState() => _AssignTaskBottomSheetState();
}

class _AssignTaskBottomSheetState extends ConsumerState<_AssignTaskBottomSheet> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  String? _selectedAssigneeId;
  String _priority = 'medium';
  DateTime? _dueDate;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(
      text: 'Demo for ${widget.lead.company ?? widget.lead.name}',
    );
    _descriptionController = TextEditingController(
      text: 'Contact details:\nEmail: ${widget.lead.email ?? "N/A"}\nPhone: ${widget.lead.phone ?? "N/A"}\nAddress: ${widget.lead.address ?? "N/A"}',
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final membersAsync = ref.watch(hrmEligibleClosersProvider);

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        top: 20,
        left: 20,
        right: 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'ASSIGN TASK',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _titleController,
              decoration: _inputDecoration('Task Title', Icons.title),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: _inputDecoration('Description', Icons.description),
            ),
            const SizedBox(height: 16),
            membersAsync.when(
              data: (members) => DropdownButtonFormField<String>(
                initialValue: _selectedAssigneeId,
                decoration: _inputDecoration('Assign To', Icons.person),
                items: members.map((m) => DropdownMenuItem(
                  value: m.id,
                  child: Text(m.fullName),
                )).toList(),
                onChanged: (val) => setState(() => _selectedAssigneeId = val),
              ),
              loading: () => const CircularProgressIndicator(),
              error: (_, __) => const Text('Error loading team members'),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _priority,
                    decoration: _inputDecoration('Priority', Icons.flag),
                    items: const [
                      DropdownMenuItem(value: 'critical', child: Text('Critical')),
                      DropdownMenuItem(value: 'high', child: Text('High')),
                      DropdownMenuItem(value: 'medium', child: Text('Medium')),
                      DropdownMenuItem(value: 'low', child: Text('Low')),
                    ],
                    onChanged: (val) => setState(() => _priority = val!),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now().add(const Duration(days: 1)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null) setState(() => _dueDate = date);
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 18, color: Colors.black54),
                          const SizedBox(width: 12),
                          Text(
                            _dueDate == null
                                ? 'Due Date'
                                : DateFormat('MMM d, yyyy').format(_dueDate!),
                            style: TextStyle(
                              color: _dueDate == null ? Colors.grey : Colors.black,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _selectedAssigneeId == null || _dueDate == null
                    ? null
                    : () async {
                        final messenger = ScaffoldMessenger.of(context);
                        final navigator = Navigator.of(context);
                        try {
                          await ref.read(tasksProvider.notifier).addTask(
                                title: _titleController.text,
                                description: _descriptionController.text,
                                assigneeId: _selectedAssigneeId,
                                dueDate: _dueDate,
                                priority: _priority,
                                leadId: widget.lead.id,
                              );
                          if (mounted) {
                            navigator.pop();
                            
                            // Get the selected member details for WhatsApp
                            final members = ref.read(hrmEligibleClosersProvider).value ?? [];
                            final selectedMember = members.firstWhere(
                              (m) => m.id == _selectedAssigneeId,
                              orElse: () => members.first,
                            );

                            if (selectedMember.phone != null && selectedMember.phone!.isNotEmpty && context.mounted) {
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Notify Member?'),
                                  content: Text('Would you like to notify ${selectedMember.fullName} on WhatsApp about this task?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Skip'),
                                    ),
                                    ElevatedButton(
                                      onPressed: () {
                                        Navigator.pop(context);
                                        CommunicationUtils.launchWhatsApp(
                                          selectedMember.phone!,
                                          message: 'Hi ${selectedMember.fullName}, a new task has been assigned to you regarding Lead: ${widget.lead.name}. Please check the CRM for details.',
                                        );
                                      },
                                      child: const Text('Notify on WhatsApp'),
                                    ),
                                  ],
                                ),
                              );
                            }

                            messenger.showSnackBar(
                              const SnackBar(
                                content: Text('Task assigned successfully!'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            messenger.showSnackBar(
                              SnackBar(content: Text('Error: $e')),
                            );
                          }
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'ASSIGN TASK',
                  style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, size: 18),
      filled: true,
      fillColor: Colors.grey[50],
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.grey[200]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.grey[200]!),
      ),
    );
  }
}
