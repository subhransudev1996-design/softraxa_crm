import '../models/lead_model.dart';

class WhatsAppTemplate {
  final String title;
  final String Function(Lead lead, {String? demoLink}) messageGenerator;
  final String category;
  final bool requiresDemoLink;

  WhatsAppTemplate({
    required this.title,
    required this.messageGenerator,
    required this.category,
    this.requiresDemoLink = false,
  });

  static List<WhatsAppTemplate> getTemplates(Lead lead) {
    final templates = <WhatsAppTemplate>[
       WhatsAppTemplate(
        title: 'Send Demo Website',
        category: 'General',
        requiresDemoLink: true,
        messageGenerator: (l, {demoLink}) =>
            'Hello Sir,\n\n'
            'As discussed, I have created a demo website design for ${l.company ?? 'your company'}.\n\n'
            'You can check the preview here:\n'
            '${demoLink ?? '[DEMO LINK]'}\n\n'
            'This design shows how a modern website for your ${l.category ?? 'business'} could look to attract more Customers online.\n\n'
            'Please have a look and let me know your thoughts. If you like it, we can discuss further improvements.\n\n'
            'Thank you, Regards Softraxa.',
      ),
      // --- General Category ---
      WhatsAppTemplate(
        title: 'Introduction',
        category: 'General',
        messageGenerator: (l, {demoLink}) =>
            'Hi ${l.name}, this is from Softraxa CRM. I noticed your interest in our services and wanted to connect.',
      ),
      WhatsAppTemplate(
        title: 'Schedule Demo',
        category: 'General',
        messageGenerator: (l, {demoLink}) =>
            'Hello ${l.name}, I would like to schedule a quick demo of our CRM solution for ${l.company ?? 'your company'}. Are you available this week?',
      ),
      WhatsAppTemplate(
        title: 'General Follow-up',
        category: 'General',
        messageGenerator: (l, {demoLink}) =>
            'Hi ${l.name}, just following up on our previous discussion. Do you have any questions I can help with?',
      ),

      // --- Status-based Category ---
    ];

    // Add status-specific templates
    final status = lead.status.toLowerCase();
    
    if (status == 'new') {
      templates.add(WhatsAppTemplate(
        title: 'Welcome New Lead',
        category: 'Status-based',
        messageGenerator: (l, {demoLink}) =>
            'Hi ${l.name}, thank you for reaching out! We received your inquiry and will be in touch shortly.',
      ));
    } else if (status == 'qualified') {
      templates.add(WhatsAppTemplate(
        title: 'Qualified Discussion',
        category: 'Status-based',
        messageGenerator: (l, {demoLink}) =>
            'Hello ${l.name}, based on our initial talk, it seems our solution is a great fit for ${l.company ?? 'your needs'}. Let\'s discuss the next steps.',
      ));
    } else if (status == 'negotiation') {
      templates.add(WhatsAppTemplate(
        title: 'Proposal Follow-up',
        category: 'Status-based',
        messageGenerator: (l, {demoLink}) =>
            'Hi ${l.name}, touching base regarding the proposal we sent for ${l.company ?? 'your project'}. Do you have any feedback or concerns?',
      ));
    } else if (status == 'follow_up') {
      templates.add(WhatsAppTemplate(
        title: 'Standard Follow-up',
        category: 'Status-based',
        messageGenerator: (l, {demoLink}) =>
            'Hi ${l.name}, following up as scheduled. I\'m here to answer any further questions you might have about Softraxa.',
      ));
    } else if (status == 'on_hold') {
      templates.add(WhatsAppTemplate(
        title: 'Check-in (On Hold)',
        category: 'Status-based',
        messageGenerator: (l, {demoLink}) =>
            'Hello ${l.name}, I understand things are currently on hold. Just wanted to check if there any updates at your end.',
      ));
    } else if (status == 'unresponsive') {
      templates.add(WhatsAppTemplate(
        title: 'Reconnect',
        category: 'Status-based',
        messageGenerator: (l, {demoLink}) =>
            'Hi ${l.name}, I haven\'t heard back from you in a while. Are you still looking for a CRM solution for ${l.company ?? 'your team'}?',
      ));
    }

    return templates;
  }
}
