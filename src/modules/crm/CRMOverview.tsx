"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Users, Plus, Search, Filter, MoreHorizontal, 
  Phone, Mail, DollarSign, ChevronRight, 
  ArrowUpRight, Target, Briefcase, Clock,
  ExternalLink, Trash2, Award, Globe, X, MessageCircle,
  Pencil, Upload, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import Link from 'next/link';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function CRMOverview() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingLead, setEditingLead] = React.useState<any>(null);
  const [leads, setLeads] = React.useState<any[]>([]);
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [hasWebsite, setHasWebsite] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 20;

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!leadsError) setLeads(leadsData || []);

      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'member');
      
      if (!membersError) setMembers(membersData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase.from('leads').insert({
        name: formData.get('name'),
        company: formData.get('company'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        value: formData.get('value') ? parseFloat(formData.get('value') as string) : 0,
        status: 'new',
        category: formData.get('category'),
        has_website: hasWebsite,
        website_url: formData.get('website_url'),
        website_quality: hasWebsite ? formData.get('website_quality') : null,
        is_mobile_responsive: hasWebsite ? formData.get('is_mobile_responsive') === 'true' : false,
        lead_tier: formData.get('lead_tier'),
        social_platform: formData.get('social_platform') || 'whatsapp',
        social_handle: formData.get('social_handle'),
        social_url: formData.get('social_url'),
        created_by: formData.get('created_by') || user?.id,
      });

      if (!error) {
        setIsModalOpen(false);
        setHasWebsite(false);
        fetchData();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLead) return;
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
          social_platform: formData.get('social_platform'),
          social_handle: formData.get('social_handle'),
          social_url: formData.get('social_url'),
          created_by: formData.get('created_by'),
        })
        .eq('id', editingLead.id);

      if (!error) {
        setIsModalOpen(false);
        setEditingLead(null);
        setHasWebsite(false);
        fetchData();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLead = (lead: any) => {
    setEditingLead(lead);
    setHasWebsite(lead.has_website || false);
    setIsModalOpen(true);
  };

  const [isWonModalOpen, setIsWonModalOpen] = React.useState(false);
  const [pendingWonLeadId, setPendingWonLeadId] = React.useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (newStatus === 'won') {
      setPendingWonLeadId(id);
      setIsWonModalOpen(true);
      return;
    }

    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();
      
      if (!leadError) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmWon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingWonLeadId) return;
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const winnerId = formData.get('winner_id') as string;

    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .update({ 
          status: 'won',
          converted_by: winnerId || user?.id
        })
        .eq('id', pendingWonLeadId)
        .select()
        .single();
      
      if (!leadError && leadData) {
        // We no longer insert into profiles because leads don't have auth accounts.
        // The Clients page already queries leads with status='won'.

        await supabase.from('notifications').insert({
          user_id: user?.id,
          title: 'Lead Converted! 🚀',
          message: `${leadData.company || leadData.name} has been successfully promoted to a Client.`,
          type: 'success'
        });

        // Points system for the winner
        if (winnerId) {
          const { data: profile } = await supabase.from('profiles').select('points').eq('id', winnerId).single();
          if (profile) {
            await supabase.from('profiles').update({ 
              points: (profile.points || 0) + 50 
            }).eq('id', winnerId);
          }
        }

        setIsWonModalOpen(false);
        setPendingWonLeadId(null);
        fetchData();
      } else if (leadError) {
        alert(leadError.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to remove this lead?')) return;
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (!error) {
        fetchData();
      } else {
        console.error('Delete error:', error);
        alert(`Failed to delete lead: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while deleting the lead.');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || lead.category === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const currentLeads = filteredLeads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const premiumLeads = leads.filter(l => l.lead_tier === 'premium').length;
  const activeLeads = leads.filter(l => l.status !== 'lost' && l.status !== 'won').length;
  const wonLeads = leads.filter(l => l.status === 'won').length;

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black flex items-center gap-3">
            Lead <span className="font-light text-zinc-400">Management</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Convert prospects into long-term partners.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95 px-6 h-11 rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Create Lead
          </Button>
        </div>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingLead(null);
          setHasWebsite(false);
        }} 
        title={editingLead ? "Edit Lead Details" : "Register New Lead"}
      >
        <form className="space-y-6" onSubmit={editingLead ? handleUpdateLead : handleCreateLead}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                name="company" 
                label="Company Name" 
                placeholder="e.g. Acme Tech" 
                defaultValue={editingLead?.company}
                required 
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Lead Tier</label>
                <select 
                  name="lead_tier" 
                  defaultValue={editingLead?.lead_tier || 'normal'}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                >
                  <option value="normal">Normal</option>
                  <option value="premium">Premium 💎</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Industry Category</label>
                <select 
                  name="category" 
                  defaultValue={editingLead?.category || ''}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                >
                  <option value="">Select industry...</option>
                  {categories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Added By (Member)</label>
                <select 
                  name="created_by" 
                  defaultValue={editingLead?.created_by || user?.id}
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
              placeholder="e.g. John Smith" 
              defaultValue={editingLead?.name}
              required 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input 
                name="email" 
                label="Work Email" 
                type="email" 
                placeholder="john@acme.com" 
                defaultValue={editingLead?.email}
              />
              <Input 
                name="phone" 
                label="Phone Number" 
                type="tel" 
                placeholder="+1..." 
                defaultValue={editingLead?.phone}
              />
            </div>

            <div className="pt-2 border-t border-zinc-50 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Social Platform</label>
                  <select 
                    name="social_platform" 
                    defaultValue={editingLead?.social_platform || 'whatsapp'}
                    className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input 
                  name="social_handle" 
                  label="Social Handle/ID" 
                  placeholder="e.g. @username" 
                  defaultValue={editingLead?.social_handle}
                />
              </div>
              <Input 
                name="social_url" 
                label="Social Profile URL" 
                placeholder="https://..." 
                defaultValue={editingLead?.social_url}
              />
            </div>

            <Input 
              name="address" 
              label="Physical Address" 
              placeholder="e.g. 123 Business St, City, Country" 
              defaultValue={editingLead?.address}
            />

            <div className="pt-2 border-t border-zinc-50 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div>
                  <p className="text-sm font-bold text-black">Existing Website</p>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold">Does the client already have a site?</p>
                </div>
                <div 
                  onClick={() => setHasWebsite(!hasWebsite)}
                  className={cn(
                    "w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300",
                    hasWebsite ? "bg-black" : "bg-zinc-200"
                  )}
                >
                  <motion.div 
                    animate={{ x: hasWebsite ? 22 : 2 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" 
                  />
                </div>
              </div>

              <AnimatePresence>
                {hasWebsite && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <Input 
                      name="website_url" 
                      label="Website URL" 
                      placeholder="https://..." 
                      defaultValue={editingLead?.website_url}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Current Quality</label>
                        <select 
                          name="website_quality" 
                          defaultValue={editingLead?.website_quality || 'average'}
                          className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                        >
                          <option value="poor">Poor (Needs Rebuild)</option>
                          <option value="average">Average</option>
                          <option value="good">Good</option>
                          <option value="excellent">Excellent</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Responsive?</label>
                        <select 
                          name="is_mobile_responsive" 
                          defaultValue={editingLead?.is_mobile_responsive?.toString() || 'false'}
                          className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                        >
                          <option value="false">No (Desktop Only)</option>
                          <option value="true">Yes (Mobile Ready)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Input 
              name="value" 
              label="Estimated Project Value (USD)" 
              type="number" 
              placeholder="0.00" 
              defaultValue={editingLead?.value}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => {
              setIsModalOpen(false);
              setEditingLead(null);
              setHasWebsite(false);
            }} className="flex-1 text-zinc-400">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated">
              {submitting ? 'Saving...' : (editingLead ? 'Update Lead' : 'Add Lead')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isWonModalOpen}
        onClose={() => {
          setIsWonModalOpen(false);
          setPendingWonLeadId(null);
        }}
        title="Finalize Conversion"
      >
        <form className="space-y-6" onSubmit={handleConfirmWon}>
          <div className="p-6 rounded-[2rem] bg-zinc-900 text-white space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Award className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                Victory Achievement! 🏆
              </h3>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Select the member who secured this deal</p>
            </div>
            
            <div className="space-y-1.5 relative z-10 pt-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Assigned Closer</label>
              <select 
                name="winner_id" 
                required
                className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              >
                <option value="" className="bg-zinc-900">Select member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                    {m.full_name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[10px] text-zinc-500 font-medium italic pt-2">
              Note: This action will move the lead to the Directory and award +50 points to the selected member.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => {
              setIsWonModalOpen(false);
              setPendingWonLeadId(null);
            }} className="flex-1 text-zinc-400">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated bg-white text-black hover:bg-zinc-100 h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]">
              {submitting ? 'Converting...' : 'Finalize Win'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Pipeline', value: `₹${totalValue.toLocaleString()}`, icon: DollarSign, trend: '+12.5%' },
          { label: 'Active Leads', value: activeLeads.toString(), icon: Target, trend: '8 in progress' },
          { label: 'Premium Leads', value: premiumLeads.toString(), icon: Award, trend: 'High Priority' },
          { label: 'Conv. Rate', value: `${leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0}%`, icon: ArrowUpRight, trend: 'Avg. 32 days' },
        ].map((stat, i) => (
          <Card key={i} className="border-zinc-100 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-zinc-900" />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.trend}</span>
              </div>
              <p className="text-3xl font-black text-zinc-900 mb-1">{stat.value}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-2">
          <div className="flex items-center gap-4 w-full max-w-xl">
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search leads by name, company or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-zinc-200 rounded-2xl text-sm focus:ring-4 focus:ring-black/5 outline-none transition-all"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 px-4 bg-white border border-zinc-200 rounded-2xl text-sm focus:ring-4 focus:ring-black/5 outline-none transition-all min-w-[140px]"
            >
              <option value="all">All Status ({leads.length})</option>
              <option value="new">New ({leads.filter(l => l.status === 'new').length})</option>
              <option value="contacted">Contacted ({leads.filter(l => l.status === 'contacted').length})</option>
              <option value="qualified">Qualified ({leads.filter(l => l.status === 'qualified').length})</option>
              <option value="negotiation">Negotiation ({leads.filter(l => l.status === 'negotiation').length})</option>
              <option value="follow_up">Follow Up ({leads.filter(l => l.status === 'follow_up').length})</option>
              <option value="on_hold">On Hold ({leads.filter(l => l.status === 'on_hold').length})</option>
              <option value="unresponsive">Unresponsive ({leads.filter(l => l.status === 'unresponsive').length})</option>
              <option value="won">Won ({leads.filter(l => l.status === 'won').length})</option>
              <option value="lost">Lost ({leads.filter(l => l.status === 'lost').length})</option>
              <option value="junk">Junk ({leads.filter(l => l.status === 'junk').length})</option>
            </select>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-12 px-4 bg-white border border-zinc-200 rounded-2xl text-sm focus:ring-4 focus:ring-black/5 outline-none transition-all min-w-[140px]"
            >
              <option value="all">All Industries ({leads.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat.toLowerCase()}>
                  {cat} ({leads.filter(l => l.category?.toLowerCase() === cat.toLowerCase()).length})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
              Showing <span className="text-black">{filteredLeads.length}</span> results
            </p>
            <Button variant="outline" size="sm" className="h-12 px-6 rounded-2xl">
              <Filter className="w-4 h-4 mr-2" /> Advanced
            </Button>
          </div>
        </div>

        {/* Leads Table/List */}
        <Card className="border-zinc-100 shadow-soft overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Accessing Pipeline...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Company / Contact</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Tier & Value</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Website Audit</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {currentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-zinc-400 text-sm">
                        No leads match your current search or filter.
                      </td>
                    </tr>
                  ) : currentLeads.map((lead) => (
                    <tr key={lead.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all text-sm font-black uppercase shadow-inner">
                            {lead.company?.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-bold text-black">{lead.company}</p>
                              {lead.category && (
                                <span className="text-[8px] font-black uppercase tracking-tighter bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200">
                                  {lead.category}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                                <span className="text-zinc-900 font-bold">{lead.name}</span>
                                <div className="w-1 h-1 rounded-full bg-zinc-200" />
                                <span>{lead.email}</span>
                              </div>
                              {lead.social_handle && (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-zinc-200">
                                    {lead.social_platform}: {lead.social_handle}
                                  </span>
                                </div>
                              )}
                              {lead.address && (
                                <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                                  <ChevronRight className="w-2.5 h-2.5" />
                                  {lead.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-black">₹{lead.value?.toLocaleString()}</p>
                          {lead.lead_tier === 'premium' && (
                            <span className="text-[10px] bg-zinc-900 text-white px-1.5 py-0.5 rounded-md uppercase font-black tracking-tighter shadow-sm">Premium</span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Projected Deal</p>
                      </td>
                      <td className="px-8 py-6">
                        {lead.has_website ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-900 uppercase">
                              <Globe className="w-3 h-3 text-zinc-400" />
                              <span>{lead.website_quality} Quality</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                lead.is_mobile_responsive ? "bg-emerald-500" : "bg-red-500"
                              )} />
                              <span>{lead.is_mobile_responsive ? 'Mobile Ready' : 'Desktop Only'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                            <X className="w-3 h-3" />
                            <span>No Website</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          value={lead.status}
                          onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest outline-none border-none cursor-pointer appearance-none text-center",
                            lead.status === 'won' ? "bg-emerald-900 text-white shadow-soft" :
                            lead.status === 'lost' ? "bg-red-100 text-red-600" :
                            lead.status === 'negotiation' ? "bg-zinc-900 text-white" : 
                            lead.status === 'qualified' ? "bg-emerald-100 text-emerald-700" :
                            lead.status === 'follow_up' ? "bg-blue-100 text-blue-700" :
                            lead.status === 'on_hold' ? "bg-amber-100 text-amber-700" :
                            lead.status === 'unresponsive' ? "bg-zinc-100 text-zinc-400" :
                            lead.status === 'junk' ? "bg-zinc-200 text-zinc-500 line-through" :
                            "bg-zinc-100 text-zinc-500"
                          )}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="negotiation">Negotiation</option>
                          <option value="follow_up">Follow Up</option>
                          <option value="on_hold">On Hold</option>
                          <option value="unresponsive">Unresponsive</option>
                          <option value="won">Won 🏆</option>
                          <option value="lost">Lost</option>
                          <option value="junk">Junk</option>
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/crm/${lead.id}`}
                            className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 hover:shadow-soft transition-all"
                            title="View Lead Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {lead.phone && (
                            <a 
                              href={`tel:${lead.phone}`}
                              className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 hover:shadow-soft transition-all"
                              title="Call Lead"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {lead.email && (
                            <a 
                              href={`mailto:${lead.email}`}
                              className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 hover:shadow-soft transition-all"
                              title="Email Lead"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {lead.phone && (
                            <a 
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-soft transition-all"
                              title="WhatsApp Message"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          {lead.website_url && (
                            <a 
                              href={lead.website_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 hover:shadow-soft transition-all"
                              title="Visit Website"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button 
                            onClick={() => handleEditLead(lead)}
                            className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 hover:shadow-soft transition-all"
                            title="Edit Lead"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteLead(lead.id)}
                            className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-red-600 hover:border-red-100 hover:shadow-soft transition-all"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 px-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Page <span className="text-black">{currentPage}</span> of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border-zinc-200"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                      currentPage === page 
                        ? "bg-black text-white shadow-elevated" 
                        : "text-zinc-400 hover:bg-zinc-100"
                    )}
                  >
                    {page}
                  </button>
                )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border-zinc-200"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
