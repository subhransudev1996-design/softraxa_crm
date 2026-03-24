export interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: string;
  category?: string;
  social_platform?: 'whatsapp' | 'instagram' | 'facebook' | 'linkedin' | 'other';
  social_handle?: string;
  social_url?: string;
}

export interface SocialTemplate {
  title: string;
  category: 'General' | 'Status-based';
  requiresDemoLink?: boolean;
  generateMessage: (lead: Lead, demoLink?: string) => string;
}

export const getSocialTemplates = (lead: Lead): SocialTemplate[] => {
  const templates: SocialTemplate[] = [
    {
      title: 'Send Demo Website',
      category: 'General',
      requiresDemoLink: true,
      generateMessage: (l, demoLink) =>
        `Hello Sir,\n\n` +
        `As discussed, I have created a demo website design for ${l.company || 'your company'}.\n\n` +
        `You can check the preview here:\n` +
        `${demoLink || '[DEMO LINK]'}\n\n` +
        `This design shows how a modern website for your ${l.category || 'business'} could look to attract more Customers online.\n\n` +
        `Please have a look and let me know your thoughts. If you like it, we can discuss further improvements.\n\n` +
        `Thank you, Regards Softraxa.`,
    },
    {
      title: 'Introduction',
      category: 'General',
      generateMessage: (l) =>
        `Hi ${l.name}, this is from Softraxa CRM. I noticed your interest in our services on ${l.social_platform || 'social media'} and wanted to connect.`,
    },
    {
      title: 'Schedule Demo',
      category: 'General',
      generateMessage: (l) =>
        `Hello ${l.name}, I would like to schedule a quick demo of our CRM solution for ${l.company || 'your company'}. Are you available this week?`,
    },
    {
      title: 'General Follow-up',
      category: 'General',
      generateMessage: (l) =>
        `Hi ${l.name}, just following up on our previous discussion. Do you have any questions I can help with?`,
    },
  ];

  const status = lead.status.toLowerCase();

  if (status === 'new') {
    templates.push({
      title: 'Welcome New Lead',
      category: 'Status-based',
      generateMessage: (l) =>
        `Hi ${l.name}, thank you for reaching out via ${l.social_platform || 'our channel'}! We received your inquiry and will be in touch shortly.`,
    });
  } else if (status === 'qualified') {
    templates.push({
      title: 'Qualified Discussion',
      category: 'Status-based',
      generateMessage: (l) =>
        `Hello ${l.name}, based on our initial talk, it seems our solution is a great fit for ${l.company || 'your needs'}. Let's discuss the next steps.`,
    });
  } else if (status === 'negotiation') {
    templates.push({
      title: 'Proposal Follow-up',
      category: 'Status-based',
      generateMessage: (l) =>
        `Hi ${l.name}, touching base regarding the proposal we sent for ${l.company || 'your project'}. Do you have any feedback or concerns?`,
    });
  } else if (status === 'follow_up') {
    templates.push({
      title: 'Standard Follow-up',
      category: 'Status-based',
      generateMessage: (l) =>
        `Hi ${l.name}, following up as scheduled. I'm here to answer any further questions you might have about Softraxa.`,
    });
  } else if (status === 'on_hold') {
    templates.push({
      title: 'Check-in (On Hold)',
      category: 'Status-based',
      generateMessage: (l) =>
        `Hello ${l.name}, I understand things are currently on hold. Just wanted to check if there any updates at your end.`,
    });
  } else if (status === 'unresponsive') {
    templates.push({
      title: 'Reconnect',
      category: 'Status-based',
      generateMessage: (l) =>
        `Hi ${l.name}, I haven't heard back from you in a while. Are you still looking for a CRM solution for ${l.company || 'your team'}?`,
    });
  }

  return templates;
};
