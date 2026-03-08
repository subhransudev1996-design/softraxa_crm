"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Users, Calendar, Clock, CheckCircle2,
  ArrowLeft, MoreHorizontal, Plus, Briefcase,
  DollarSign, Activity, ChevronRight,
  MessageSquare, LayoutGrid, FileText,
  AlertCircle, Pencil, Trash2, ExternalLink,
  Building2, MapPin, Globe, Mail, Phone,
  History, TrendingUp, Info, MessageCircle, X, Award, Target, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import Link from 'next/link';

const categories = [
  'Restaurant', 
  'Clinic', 
  'Education', 
  'Institute', 
  'Corporate', 
  'Manufacturing', 
  'Real Estate', 
  'Gym', 
  'E-commerce', 
  'SaaS', 
  'Other'
];

export function LeadDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lead, setLead] = React.useState<any>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [hasWebsite, setHasWebsite] = React.useState(false);

  const fetchLeadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*, creator:profiles!leads_created_by_fkey(full_name), converter:profiles!leads_converted_by_fkey(full_name)')
        .eq('id', id)
        .single();

      if (data) {
        setLead(data);
        setHasWebsite(data.has_website || false);
      }

      const { data: membersData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'member');

      if (membersData) setMembers(membersData);
    } catch (err) {
      console.error('Error fetching lead data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (id) fetchLeadData();
  }, [id, fetchLeadData]);

  const handleUpdateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: formData.get('name'),
          company: formData.get('company'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          address: formData.get('address'),
          value: formData.get('value') ? parseFloat(formData.get('value') as string) : 0,
          category: formData.get('category'),
          has_website: hasWebsite,
          website_url: formData.get('website_url'),
          website_quality: hasWebsite ? formData.get('website_quality') : null,
          is_mobile_responsive: hasWebsite ? formData.get('is_mobile_responsive') === 'true' : false,
          lead_tier: formData.get('lead_tier'),
          status: formData.get('status'),
          created_by: formData.get('created_by'),
        })
        .eq('id', id);

      if (!error) {
        setIsModalOpen(false);
        fetchLeadData();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm('Are you sure you want to remove this lead?')) return;
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (!error) {
        router.push('/crm');
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertToClient = async () => {
    if (!confirm('Convert this lead into a formal client partnership?')) return;
    
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: 'won',
          converted_by: user?.id
        })
        .eq('id', id);

      if (updateError) throw updateError;

      const { error: profileError } = await supabase.from('profiles').insert({
        id: lead.id,
        full_name: lead.company || lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        industry: lead.category || 'Other',
        role: 'client',
        won_at: new Date().toISOString()
      });

      if (profileError) throw profileError;

      await supabase.from('notifications').insert({
        user_id: user?.id,
        title: 'Lead Converted! 🚀',
        message: `${lead.company || lead.name} is now a Client.`,
        type: 'success'
      });

      router.push(`/clients/${id}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-20 text-center">
        <AlertCircle className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
        <h2 className="text-xl font-black text-zinc-900">Lead Not Found</h2>
        <p className="text-zinc-500 mt-2">The lead you are looking for does not exist or has been removed.</p>
        <Link href="/crm">
          <Button variant="outline" className="mt-6 rounded-xl">Back to CRM</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <Link href="/crm" className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all shadow-soft">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-black">{lead.company || lead.name}</h1>
              <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm",
                lead.status === 'won' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                lead.status === 'lost' ? "bg-red-50 text-red-600 border-red-100" :
                "bg-zinc-50 text-zinc-500 border-zinc-100"
              )}>
                {lead.status}
              </span>
            </div>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              {lead.category || 'Uncategorized'} Prospect
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-xl h-11 border-zinc-200 shadow-sm">
            <Pencil className="w-4 h-4 mr-2" /> Edit Prospect
          </Button>
          {lead.status !== 'won' && (
            <Button onClick={handleConvertToClient} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95 h-11 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest">
              <Award className="w-4 h-4 mr-2" /> Convert to Client
            </Button>
          )}
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Projected Value', value: `₹${(lead.value || 0).toLocaleString()}`, icon: DollarSign, color: 'text-zinc-900' },
          { label: 'Lead Tier', value: lead.lead_tier?.toUpperCase() || 'NORMAL', icon: Award, color: lead.lead_tier === 'premium' ? 'text-amber-600' : 'text-zinc-400' },
          { label: 'Website Status', value: lead.has_website ? 'EXISTING' : 'NONE', icon: Globe, color: lead.has_website ? 'text-emerald-600' : 'text-zinc-300' },
          { label: 'Created On', value: new Date(lead.created_at).toLocaleDateString(), icon: Calendar, color: 'text-blue-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-zinc-100 shadow-soft overflow-hidden rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center">
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className={cn("text-2xl font-black mb-1", stat.color)}>{stat.value}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-zinc-100 shadow-soft rounded-[2.5rem] bg-white">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 bg-zinc-900 rounded-full" />
                <h3 className="text-xs font-black text-black uppercase tracking-[0.2em]">Contact Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Primary Contact</p>
                      <p className="text-sm font-bold text-black">{lead.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-bold text-black">{lead.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone Number</p>
                      <p className="text-sm font-bold text-black">{lead.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Office Address</p>
                      <p className="text-sm font-bold text-black">{lead.address || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Registered By</p>
                      <p className="text-sm font-bold text-black">{lead.creator?.full_name || 'System Auto'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl border-zinc-100 shadow-soft h-12 px-6">
                      <Phone className="w-4 h-4 mr-2" /> Call Now
                    </Button>
                  </a>
                )}
                {lead.phone && (
                  <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl border-emerald-100 shadow-soft h-12 px-6 text-emerald-600 hover:bg-emerald-50">
                      <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl border-zinc-100 shadow-soft h-12 px-6">
                      <Mail className="w-4 h-4 mr-2" /> Send Email
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {lead.has_website && (
            <Card className="border-zinc-100 shadow-soft rounded-[2.5rem] bg-zinc-50">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-zinc-900 rounded-full" />
                    <h3 className="text-xs font-black text-black uppercase tracking-[0.2em]">Website Audit</h3>
                  </div>
                  <a href={lead.website_url} target="_blank" className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <ExternalLink className="w-3 h-3" /> Visit Current Site
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-white border border-zinc-100 shadow-sm">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Quality Score</p>
                    <p className="text-lg font-black text-black uppercase">{lead.website_quality || 'Average'}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white border border-zinc-100 shadow-sm">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Mobile Status</p>
                    <p className={cn(
                      "text-lg font-black uppercase",
                      lead.is_mobile_responsive ? "text-emerald-600" : "text-red-500"
                    )}>
                      {lead.is_mobile_responsive ? 'Responsive' : 'Non-Responsive'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="p-8 rounded-[2.5rem] bg-zinc-900 text-white space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-white/30 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">Prospect Strategy</h3>
            </div>
            <p className="text-sm font-medium text-zinc-400 leading-relaxed">
              {lead.notes || "No additional strategy notes provided for this lead. Engagement is focused on digital transformation services and custom software solutions."}
            </p>
            <div className="pt-4 flex gap-4">
              <div className="flex-1">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">Category</p>
                <p className="text-xs font-bold uppercase">{lead.category}</p>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">Lead Tier</p>
                <p className="text-xs font-bold uppercase">{lead.lead_tier || 'Normal'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2.5rem] bg-white">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" /> Lead Lifecycle
              </h3>

              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                <div className="flex gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-black border-2 border-white flex items-center justify-center relative z-10 shadow-sm text-white">
                    <Target className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">Lead Registered</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">
                      {new Date(lead.created_at).toLocaleDateString()} by {lead.creator?.full_name || 'System'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-zinc-100 flex items-center justify-center relative z-10 shadow-sm text-zinc-400">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400">Current Status</p>
                    <p className="text-[9px] font-bold text-black uppercase">{lead.status}</p>
                  </div>
                </div>

                {lead.status === 'won' && (
                  <div className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center relative z-10 shadow-sm text-white">
                      <Award className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">Lead Converted</p>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">
                        Converted by {lead.converter?.full_name || 'Team Member'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-50">
                <Button onClick={handleDeleteLead} variant="ghost" className="w-full rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-black uppercase text-[10px] tracking-widest h-12">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Lead
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Edit Lead Details"
      >
        <form className="space-y-6" onSubmit={handleUpdateLead}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                name="company" 
                label="Company Name" 
                defaultValue={lead.company}
                required 
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Status</label>
                <select 
                  name="status" 
                  defaultValue={lead.status}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Industry Category</label>
                <select 
                  name="category" 
                  defaultValue={lead.category}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                >
                  {categories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Added By (Member)</label>
                <select 
                  name="created_by" 
                  defaultValue={lead.created_by}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <Input 
              name="name" 
              label="Primary Contact" 
              defaultValue={lead.name}
              required 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input name="email" label="Work Email" type="email" defaultValue={lead.email} />
              <Input name="phone" label="Phone Number" type="tel" defaultValue={lead.phone} />
            </div>

            <Input name="address" label="Address" defaultValue={lead.address} />

            <div className="pt-2 border-t border-zinc-50 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50">
                <div>
                  <p className="text-sm font-bold text-black">Existing Website</p>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold">Has active site?</p>
                </div>
                <div 
                  onClick={() => setHasWebsite(!hasWebsite)}
                  className={cn(
                    "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                    hasWebsite ? "bg-black" : "bg-zinc-200"
                  )}
                >
                  <motion.div animate={{ x: hasWebsite ? 22 : 2 }} className="absolute top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>

              {hasWebsite && (
                <div className="space-y-4">
                  <Input name="website_url" label="Website URL" defaultValue={lead.website_url} />
                  <div className="grid grid-cols-2 gap-4">
                    <select name="website_quality" defaultValue={lead.website_quality || 'average'} className="h-11 rounded-xl border border-zinc-200 text-sm px-4">
                      <option value="poor">Poor</option>
                      <option value="average">Average</option>
                      <option value="good">Good</option>
                      <option value="excellent">Excellent</option>
                    </select>
                    <select name="is_mobile_responsive" defaultValue={lead.is_mobile_responsive?.toString()} className="h-11 rounded-xl border border-zinc-200 text-sm px-4">
                      <option value="false">Non-Responsive</option>
                      <option value="true">Responsive</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <Input name="value" label="Projected Value" type="number" defaultValue={lead.value} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 text-zinc-400">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated">
              {submitting ? 'Saving...' : 'Update Lead'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
