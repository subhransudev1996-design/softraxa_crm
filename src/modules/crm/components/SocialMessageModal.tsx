"use client";
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Link as LinkIcon, Instagram, Facebook, Linkedin, Info } from 'lucide-react';
import { Lead, getSocialTemplates, SocialTemplate } from '../utils/socialTemplates';
import { cn } from '@/lib/utils';

interface SocialMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

export function SocialMessageModal({ isOpen, onClose, lead }: SocialMessageModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SocialTemplate | null>(null);
  const [demoLink, setDemoLink] = useState('');
  const templates = getSocialTemplates(lead);

  const handleSend = (template: SocialTemplate, link?: string) => {
    const message = template.generateMessage(lead, link);
    const platform = lead.social_platform || 'whatsapp';
    let url = '';

    if (platform === 'whatsapp') {
      const phone = lead.phone?.replace(/\D/g, '');
      if (phone) url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    } else if (platform === 'instagram') {
      // Instagram doesn't support pre-filled DMs via URL easily. 
      // Redirecting to the direct thread (if handle exists) or profile.
      const handle = lead.social_handle?.replace(/^@/, '');
      url = handle ? `https://www.instagram.com/direct/t/${handle}/` : (lead.social_url || 'https://www.instagram.com/');
      // Copy message to clipboard for convenience
      navigator.clipboard.writeText(message);
    } else if (platform === 'facebook') {
      const handle = lead.social_handle || lead.name.replace(/\s+/g, '.');
      url = `https://m.me/${handle}`;
      navigator.clipboard.writeText(message);
    } else if (platform === 'linkedin') {
      const handle = lead.social_handle || lead.name;
      url = `https://www.linkedin.com/messaging/thread/new/?recipient=${handle}`;
      navigator.clipboard.writeText(message);
    }

    if (url) {
      window.open(url, '_blank');
      onClose();
      setSelectedTemplate(null);
      setDemoLink('');
    } else {
      alert(`Could not generate redirection URL for ${platform}. Please check the lead's social details.`);
    }
  };

  const getPlatformIcon = () => {
    switch (lead.social_platform) {
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-600" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-700" />;
      default: return <MessageSquare className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setSelectedTemplate(null);
        setDemoLink('');
      }}
      title={`${lead.social_platform?.toUpperCase() || 'Social'} Messaging`}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            {getPlatformIcon()}
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target Platform</p>
            <p className="text-sm font-bold text-black capitalize">{lead.social_platform || 'WhatsApp'}</p>
          </div>
        </div>

        {!selectedTemplate ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select a template for {lead.name}</p>
            <div className="grid grid-cols-1 gap-3">
              {templates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (template.requiresDemoLink) {
                      setSelectedTemplate(template);
                    } else {
                      handleSend(template);
                    }
                  }}
                  className="flex flex-col items-start p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:shadow-soft hover:border-zinc-200 transition-all text-left group"
                >
                  <div className="flex justify-between items-center w-full mb-2">
                    <span className="text-sm font-bold text-black group-hover:text-zinc-600 transition-colors">{template.title}</span>
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                      template.category === 'Status-based' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                    )}>
                      {template.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                    {template.generateMessage(lead, '...') }
                  </p>
                </button>
              ))}
            </div>
            
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Note: For Instagram, Facebook, and LinkedIn, the message will be copied to your clipboard automatically since direct pre-filling is not supported by their platforms. Just paste it into the DM box.
              </p>
            </div>

            <Button 
              variant="ghost" 
              className="w-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black"
              onClick={() => {
                const platform = lead.social_platform || 'whatsapp';
                let url = '';
                if (platform === 'whatsapp') {
                  const phone = lead.phone?.replace(/\D/g, '');
                  if (phone) url = `https://wa.me/${phone}`;
                } else if (platform === 'instagram') {
                  const handle = lead.social_handle?.replace(/^@/, '');
                  url = handle ? `https://www.instagram.com/direct/t/${handle}/` : (lead.social_url || 'https://www.instagram.com/');
                } else if (platform === 'facebook') {
                  url = `https://m.me/${lead.social_handle || ''}`;
                } else if (platform === 'linkedin') {
                  url = `https://www.linkedin.com/messaging/thread/new/`;
                }
                if (url) window.open(url, '_blank');
                onClose();
              }}
            >
              Open platform without template
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon className="w-3 h-3" /> Action Required
              </p>
              <p className="text-sm font-bold">Enter Demo Website Link</p>
              <p className="text-xs text-zinc-400">This template requires a preview link to show the client.</p>
            </div>

            <Input
              value={demoLink}
              onChange={(e) => setDemoLink(e.target.value)}
              placeholder="https://demo.softraxa.com/preview/..."
              className="h-12 rounded-xl"
              autoFocus
            />

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setSelectedTemplate(null)} className="flex-1 rounded-xl">Back</Button>
              <Button 
                onClick={() => handleSend(selectedTemplate, demoLink)}
                disabled={!demoLink.trim()}
                className="flex-1 bg-black text-white hover:bg-zinc-800 rounded-xl shadow-elevated"
              >
                <Send className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
