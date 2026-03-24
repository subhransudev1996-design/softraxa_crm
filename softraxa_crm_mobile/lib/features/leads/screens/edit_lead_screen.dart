import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../models/lead_model.dart';
import '../providers/leads_provider.dart';
import '../../hrm/providers/hrm_provider.dart';
import '../../hrm/models/employee_profile.dart';

class EditLeadScreen extends ConsumerStatefulWidget {
  final Lead lead;

  const EditLeadScreen({super.key, required this.lead});

  @override
  ConsumerState<EditLeadScreen> createState() => _EditLeadScreenState();
}

class _EditLeadScreenState extends ConsumerState<EditLeadScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _companyController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;
  late TextEditingController _valueController;
  late TextEditingController _notesController;
  late String _status;
  late String _category;
  late String _leadTier;
  late String _websiteQuality;
  late bool _hasWebsite;
  late bool _isMobileResponsive;
  late String? _createdBy;
  late String? _assignedTo;
  late TextEditingController _websiteUrlController;
  DateTime? _followUpDate;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.lead.name);
    _companyController = TextEditingController(text: widget.lead.company);
    _emailController = TextEditingController(text: widget.lead.email);
    _phoneController = TextEditingController(text: widget.lead.phone);
    _addressController = TextEditingController(text: widget.lead.address);
    _valueController = TextEditingController(text: widget.lead.value?.toString());
    _notesController = TextEditingController(text: widget.lead.notes);
    _websiteUrlController = TextEditingController(text: widget.lead.websiteUrl);
    
    // Standardize to lowercase to match database values
    _status = widget.lead.status.toLowerCase();
    _category = widget.lead.category?.toLowerCase() ?? '';
    _leadTier = widget.lead.leadTier?.toLowerCase() ?? 'normal';
    _websiteQuality = widget.lead.websiteQuality?.toLowerCase() ?? 'average';
    _hasWebsite = widget.lead.hasWebsite ?? false;
    _isMobileResponsive = widget.lead.isMobileResponsive ?? false;
    _createdBy = widget.lead.createdBy;
    _assignedTo = widget.lead.assignedTo;
    _followUpDate = widget.lead.followUpDate;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _companyController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _valueController.dispose();
    _notesController.dispose();
    _websiteUrlController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final updates = {
        'name': _nameController.text,
        'company': _companyController.text,
        'email': _emailController.text,
        'phone': _phoneController.text,
        'address': _addressController.text,
        'value': _valueController.text.isNotEmpty ? double.parse(_valueController.text) : null,
        'notes': _notesController.text,
        'status': _status,
        'category': _category,
        'lead_tier': _leadTier,
        'website_quality': _hasWebsite ? _websiteQuality : null,
        'is_mobile_responsive': _hasWebsite ? _isMobileResponsive : false,
        'has_website': _hasWebsite,
        'website_url': _hasWebsite ? _websiteUrlController.text : null,
        'created_by': _createdBy,
        'assigned_to': _assignedTo,
        'follow_up_date': _followUpDate?.toIso8601String(),
      };

      await ref.read(leadsProvider.notifier).updateLead(widget.lead.id, updates);
      
      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lead updated successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating lead: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Edit Lead', style: TextStyle(fontWeight: FontWeight.w900)),
        actions: [
          if (_isLoading)
            const Center(child: Padding(padding: EdgeInsets.only(right: 16), child: CircularProgressIndicator(strokeWidth: 2)))
          else
            IconButton(
              icon: const Icon(Icons.check),
              onPressed: _save,
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _buildSectionHeader('Personal Information'),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Full Name*', border: OutlineInputBorder()),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _companyController,
              decoration: const InputDecoration(labelText: 'Company', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 32),
            _buildSectionHeader('Contact Details'),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 32),
            _buildSectionHeader('CRM Data'),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()),
              items: [
                'new',
                'contacted',
                'qualified',
                'negotiation',
                'follow_up',
                'on_hold',
                'unresponsive',
                'won',
                'lost',
                'junk'
              ].map((s) => DropdownMenuItem(
                    value: s,
                    child: Text(s.replaceAll('_', ' ').toUpperCase()),
                  )).toList(),
              onChanged: (v) => setState(() => _status = v!),
            ),
            const SizedBox(height: 16),
            Consumer(builder: (context, ref, _) {
              final hrmMembersAsync = ref.watch(hrmMembersProvider);
              final allHrmAsync = ref.watch(hrmProvider);
              
              return hrmMembersAsync.when(
                data: (members) {
                  final items = <EmployeeProfile>[...members];
                  
                  // Helper to safely add a member if they exist in the full list
                  void ensureMemberInItems(String? id) {
                    if (id != null && !items.any((m) => m.id == id)) {
                      final all = allHrmAsync.value;
                      if (all != null && all.any((m) => m.id == id)) {
                        items.add(all.firstWhere((m) => m.id == id));
                      }
                    }
                  }

                  ensureMemberInItems(_createdBy);

                  return DropdownButtonFormField<String>(
                    initialValue: _createdBy,
                    decoration: const InputDecoration(labelText: 'Added By', border: OutlineInputBorder()),
                    items: items.map((m) => DropdownMenuItem(
                      value: m.id, 
                      child: Text('${m.fullName} (${m.role.toUpperCase()})')
                    )).toList(),
                    onChanged: (v) => setState(() => _createdBy = v),
                  );
                },
                loading: () => const LinearProgressIndicator(),
                error: (_, __) => const SizedBox.shrink(),
              );
            }),
            const SizedBox(height: 16),
            Consumer(builder: (context, ref, _) {
              final hrmMembersAsync = ref.watch(hrmMembersProvider);
              final allHrmAsync = ref.watch(hrmProvider);
              
              return hrmMembersAsync.when(
                data: (members) {
                  final items = <EmployeeProfile>[...members];
                  
                  void ensureMemberInItems(String? id) {
                    if (id != null && !items.any((m) => m.id == id)) {
                      final all = allHrmAsync.value;
                      if (all != null && all.any((m) => m.id == id)) {
                        items.add(all.firstWhere((m) => m.id == id));
                      }
                    }
                  }

                  ensureMemberInItems(_assignedTo);

                  return DropdownButtonFormField<String>(
                    initialValue: _assignedTo,
                    decoration: const InputDecoration(labelText: 'Assigned To', border: OutlineInputBorder()),
                    items: items.map((m) => DropdownMenuItem(
                      value: m.id, 
                      child: Text('${m.fullName} (${m.role.toUpperCase()})')
                    )).toList(),
                    onChanged: (v) => setState(() => _assignedTo = v),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              );
            }),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
              items: [
                '',
                'restaurant',
                'clinic',
                'education',
                'institute',
                'corporate',
                'manufacturing',
                'real estate',
                'gym',
                'e-commerce',
                'saas',
                'other'
              ].map((s) => DropdownMenuItem(
                    value: s,
                    child: Text(s.isEmpty ? 'Select industry...' : s.toUpperCase()),
                  )).toList(),
              onChanged: (v) => setState(() => _category = v!),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _leadTier,
                    decoration: const InputDecoration(labelText: 'Tier', border: OutlineInputBorder()),
                    items: ['normal', 'premium']
                        .map((s) => DropdownMenuItem(value: s, child: Text(s.toUpperCase())))
                        .toList(),
                    onChanged: (v) => setState(() => _leadTier = v!),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _valueController,
                    decoration: const InputDecoration(labelText: 'Value (₹)', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            _buildSectionHeader('Website Audit'),
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('Existing Website'),
              value: _hasWebsite,
              onChanged: (v) => setState(() => _hasWebsite = v),
              activeThumbColor: Colors.black,
            ),
            if (_hasWebsite) ...[
              const SizedBox(height: 16),
              TextFormField(
                controller: _websiteUrlController,
                decoration: const InputDecoration(labelText: 'Website URL', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _websiteQuality,
                decoration: const InputDecoration(labelText: 'Web Quality', border: OutlineInputBorder()),
                items: ['poor', 'average', 'good', 'excellent']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s.toUpperCase())))
                    .toList(),
                onChanged: (v) => setState(() => _websiteQuality = v!),
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('Mobile Responsive'),
                value: _isMobileResponsive,
                onChanged: (v) => setState(() => _isMobileResponsive = v),
                activeThumbColor: Colors.black,
              ),
            ],
            const SizedBox(height: 16),
            ListTile(
              title: const Text('Follow-up Date'),
              subtitle: Text(_followUpDate != null ? DateFormat('MMM dd, yyyy').format(_followUpDate!) : 'Not set'),
              trailing: const Icon(Icons.calendar_today),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _followUpDate ?? DateTime.now(),
                  firstDate: DateTime.now().subtract(const Duration(days: 365)),
                  lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
                );
                if (date != null) setState(() => _followUpDate = date);
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(labelText: 'Notes', border: OutlineInputBorder()),
              maxLines: 4,
            ),
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: _isLoading ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('SAVE CHANGES', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title.toUpperCase(),
      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey[400], letterSpacing: 1.5),
    );
  }
}
