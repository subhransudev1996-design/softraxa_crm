class Lead {
  final String id;
  final String name;
  final String? company;
  final String? email;
  final String? phone;
  final String? address;
  final String status;
  final double? value;
  final String? notes;
  final DateTime? followUpDate;
  final String? followUpTime; // "HH:MM" stored separately because follow_up_date is DATE type
  final String? category;
  final String? leadTier;
  final String? websiteQuality;
  final bool? isMobileResponsive;
  final bool? hasWebsite;
  final String? websiteUrl;
  final String? createdBy;
  final String? assignedTo;
  final String? convertedBy;
  final DateTime createdAt;

  Lead({
    required this.id,
    required this.name,
    this.company,
    this.email,
    this.phone,
    this.address,
    required this.status,
    this.value,
    this.notes,
    this.followUpDate,
    this.followUpTime,
    this.category,
    this.leadTier,
    this.websiteQuality,
    this.isMobileResponsive,
    this.hasWebsite,
    this.websiteUrl,
    this.createdBy,
    this.assignedTo,
    this.convertedBy,
    required this.createdAt,
  });

  factory Lead.fromJson(Map<String, dynamic> json) {
    return Lead(
      id: json['id'],
      name: json['name'],
      company: json['company'],
      email: json['email'],
      phone: json['phone'],
      address: json['address'],
      status: json['status'] ?? 'new',
      value: json['value'] != null ? (json['value'] as num).toDouble() : null,
      notes: json['notes'],
      followUpDate: json['follow_up_date'] != null
          ? DateTime.parse(json['follow_up_date'])
          : null,
      followUpTime: json['follow_up_time'],
      category: json['category'],
      leadTier: json['lead_tier'],
      websiteQuality: json['website_quality'],
      isMobileResponsive: json['is_mobile_responsive'],
      hasWebsite: json['has_website'],
      websiteUrl: json['website_url'],
      createdBy: json['created_by'],
      assignedTo: json['assigned_to'],
      convertedBy: json['converted_by'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'company': company,
      'email': email,
      'phone': phone,
      'address': address,
      'status': status,
      'value': value,
      'notes': notes,
      'category': category,
      'lead_tier': leadTier,
      'website_quality': websiteQuality,
      'is_mobile_responsive': isMobileResponsive,
      'has_website': hasWebsite,
      'website_url': websiteUrl,
      'created_by': createdBy,
      'assigned_to': assignedTo,
      'converted_by': convertedBy,
      'follow_up_date': followUpDate?.toIso8601String().split('T')[0],
      'follow_up_time': followUpTime,
    };
  }
}
