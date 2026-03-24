import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../providers/leads_provider.dart';
import '../../hrm/providers/hrm_provider.dart';

class AddLeadScreen extends ConsumerStatefulWidget {
  const AddLeadScreen({super.key});

  @override
  ConsumerState<AddLeadScreen> createState() => _AddLeadScreenState();
}

class _AddLeadScreenState extends ConsumerState<AddLeadScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _nameController = TextEditingController();
  final _companyController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _valueController = TextEditingController();
  final _notesController = TextEditingController();
  final _websiteUrlController = TextEditingController();

  // State values
  String _status = 'new';
  String _category = '';
  String _leadTier = 'normal';
  String _websiteQuality = 'average';
  bool _hasWebsite = false;
  bool _isMobileResponsive = false;
  String? _assignedTo;
  DateTime? _followUpDate;
  bool _isLoading = false;

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
      final userId = Supabase.instance.client.auth.currentUser?.id;

      final newLead = {
        'name': _nameController.text.trim(),
        'company': _companyController.text.trim().isEmpty ? null : _companyController.text.trim(),
        'email': _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
        'phone': _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        'address': _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        'value': _valueController.text.trim().isNotEmpty
            ? double.tryParse(_valueController.text.trim())
            : null,
        'notes': _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        'status': _status,
        'category': _category.isEmpty ? null : _category,
        'lead_tier': _leadTier,
        'website_quality': _hasWebsite ? _websiteQuality : null,
        'is_mobile_responsive': _hasWebsite ? _isMobileResponsive : false,
        'has_website': _hasWebsite,
        'website_url': _hasWebsite && _websiteUrlController.text.trim().isNotEmpty
            ? _websiteUrlController.text.trim()
            : null,
        'created_by': userId,
        'assigned_to': _assignedTo ?? userId,
        'follow_up_date': _followUpDate?.toIso8601String(),
      };

      await ref.read(leadsProvider.notifier).createLead(newLead);

      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Lead created successfully!', style: TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            backgroundColor: Colors.black,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () => context.pop(),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'NEW LEAD',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: Colors.grey,
                letterSpacing: 2,
              ),
            ),
            Text(
              'Add Lead',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: Colors.black,
              ),
            ),
          ],
        ),
        actions: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.only(right: 16),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: ElevatedButton(
                onPressed: _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: const Text(
                  'SAVE',
                  style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
                ),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ─── Basic Info Card ───────────────────────────────────────
            _buildCard(
              icon: Icons.person_outline,
              title: 'Basic Information',
              children: [
                _buildField(
                  controller: _nameController,
                  label: 'Full Name',
                  hint: 'e.g. Ravi Kumar',
                  icon: Icons.badge_outlined,
                  isRequired: true,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                ),
                const SizedBox(height: 16),
                _buildField(
                  controller: _companyController,
                  label: 'Company / Business Name',
                  hint: 'e.g. Sunrise Clinic',
                  icon: Icons.business_outlined,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ─── Contact Card ──────────────────────────────────────────
            _buildCard(
              icon: Icons.contact_phone_outlined,
              title: 'Contact Details',
              children: [
                _buildField(
                  controller: _phoneController,
                  label: 'Phone Number',
                  hint: 'e.g. 9876543210',
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                _buildField(
                  controller: _emailController,
                  label: 'Email Address',
                  hint: 'e.g. contact@business.com',
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),
                _buildField(
                  controller: _addressController,
                  label: 'Address',
                  hint: 'Street, City',
                  icon: Icons.location_on_outlined,
                  maxLines: 2,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ─── CRM Data Card ─────────────────────────────────────────
            _buildCard(
              icon: Icons.analytics_outlined,
              title: 'CRM Data',
              children: [
                _buildDropdown(
                  label: 'Status',
                  value: _status,
                  items: const [
                    'new', 'contacted', 'qualified', 'negotiation',
                    'follow_up', 'on_hold', 'unresponsive', 'won', 'lost', 'junk'
                  ],
                  icon: Icons.flag_outlined,
                  onChanged: (v) => setState(() => _status = v!),
                ),
                const SizedBox(height: 16),
                _buildDropdown(
                  label: 'Industry Category',
                  value: _category,
                  items: const [
                    '', 'restaurant', 'clinic', 'education', 'institute',
                    'corporate', 'manufacturing', 'real estate', 'gym',
                    'e-commerce', 'saas', 'other'
                  ],
                  icon: Icons.category_outlined,
                  onChanged: (v) => setState(() => _category = v!),
                  displayText: (v) => v.isEmpty ? 'Select category...' : v.toUpperCase(),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildDropdown(
                        label: 'Lead Tier',
                        value: _leadTier,
                        items: const ['normal', 'premium'],
                        icon: Icons.star_outline,
                        onChanged: (v) => setState(() => _leadTier = v!),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildField(
                        controller: _valueController,
                        label: 'Est. Value (₹)',
                        hint: '0',
                        icon: Icons.currency_rupee_outlined,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Assigned To dropdown
                Consumer(
                  builder: (context, ref, _) {
                    final hrmAsync = ref.watch(hrmMembersProvider);
                    return hrmAsync.when(
                      data: (members) => _buildDropdownRaw(
                        label: 'Assign To',
                        icon: Icons.person_pin_circle_outlined,
                        child: DropdownButton<String>(
                          value: _assignedTo,
                          isExpanded: true,
                          underline: const SizedBox.shrink(),
                          hint: const Text('Select team member...', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          items: members.map((m) => DropdownMenuItem(
                            value: m.id,
                            child: Text('${m.fullName} (${m.role.toUpperCase()})',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                          )).toList(),
                          onChanged: (v) => setState(() => _assignedTo = v),
                        ),
                      ),
                      loading: () => const LinearProgressIndicator(),
                      error: (_, __) => const SizedBox.shrink(),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ─── Follow-up Card ────────────────────────────────────────
            _buildCard(
              icon: Icons.calendar_today_outlined,
              title: 'Scheduling',
              children: [
                InkWell(
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _followUpDate ?? DateTime.now().add(const Duration(days: 1)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
                      builder: (ctx, child) => Theme(
                        data: ThemeData.light().copyWith(
                          colorScheme: const ColorScheme.light(primary: Colors.black),
                        ),
                        child: child!,
                      ),
                    );
                    if (date != null) setState(() => _followUpDate = date);
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8F9FC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: _followUpDate != null
                                ? Colors.black.withValues(alpha: 0.05)
                                : Colors.grey.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.calendar_month_outlined,
                            size: 18,
                            color: _followUpDate != null ? Colors.black : Colors.grey,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'FOLLOW-UP DATE',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.grey,
                                  letterSpacing: 1,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _followUpDate != null
                                    ? DateFormat('MMMM dd, yyyy').format(_followUpDate!)
                                    : 'Tap to set a reminder',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: _followUpDate != null ? Colors.black : Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (_followUpDate != null)
                          IconButton(
                            icon: const Icon(Icons.close, size: 16, color: Colors.grey),
                            onPressed: () => setState(() => _followUpDate = null),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ─── Website Audit Card ────────────────────────────────────
            _buildCard(
              icon: Icons.language_outlined,
              title: 'Website Audit',
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Has an existing website?',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    Switch(
                      value: _hasWebsite,
                      onChanged: (v) => setState(() => _hasWebsite = v),
                      activeThumbColor: Colors.black,
                    ),
                  ],
                ),
                if (_hasWebsite) ...[
                  const SizedBox(height: 16),
                  _buildField(
                    controller: _websiteUrlController,
                    label: 'Website URL',
                    hint: 'https://example.com',
                    icon: Icons.link_outlined,
                    keyboardType: TextInputType.url,
                  ),
                  const SizedBox(height: 16),
                  _buildDropdown(
                    label: 'Website Quality',
                    value: _websiteQuality,
                    items: const ['poor', 'average', 'good', 'excellent'],
                    icon: Icons.bar_chart_outlined,
                    onChanged: (v) => setState(() => _websiteQuality = v!),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Mobile responsive?',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      Switch(
                        value: _isMobileResponsive,
                        onChanged: (v) => setState(() => _isMobileResponsive = v),
                        activeThumbColor: Colors.black,
                      ),
                    ],
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),

            // ─── Notes Card ────────────────────────────────────────────
            _buildCard(
              icon: Icons.notes_outlined,
              title: 'Internal Notes',
              children: [
                TextField(
                  controller: _notesController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Add context, observations, or anything relevant...',
                    hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
                    filled: true,
                    fillColor: const Color(0xFFF8F9FC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.black, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // ─── Submit Button ─────────────────────────────────────────
            ElevatedButton(
              onPressed: _isLoading ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(60),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text(
                      'CREATE LEAD',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                      ),
                    ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  // ─── Helper Widgets ──────────────────────────────────────────────────────

  Widget _buildCard({
    required IconData icon,
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 16, color: Colors.black),
              ),
              const SizedBox(width: 10),
              Text(
                title.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFFE2E8F0), height: 1),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    bool isRequired = false,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label.toUpperCase(),
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: Colors.grey,
                letterSpacing: 1,
              ),
            ),
            if (isRequired)
              const Text(' *', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          validator: validator,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13, fontWeight: FontWeight.normal),
            prefixIcon: Icon(icon, size: 18, color: Colors.grey[600]),
            filled: true,
            fillColor: const Color(0xFFF8F9FC),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.black, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required IconData icon,
    required void Function(String?) onChanged,
    String Function(String)? displayText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: Colors.grey,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Icon(icon, size: 18, color: Colors.grey[600]),
              ),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: value,
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 14),
                  ),
                  items: items.map((s) => DropdownMenuItem(
                    value: s,
                    child: Text(
                      displayText != null ? displayText(s) : s.replaceAll('_', ' ').toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  )).toList(),
                  onChanged: onChanged,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownRaw({
    required String label,
    required IconData icon,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: Colors.grey,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: Colors.grey[600]),
              const SizedBox(width: 8),
              Expanded(child: child),
            ],
          ),
        ),
      ],
    );
  }
}
