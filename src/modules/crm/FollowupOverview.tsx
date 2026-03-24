"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Phone, Mail, MessageCircle, Calendar, Clock, 
  Search, Filter, ExternalLink, CheckCircle2, 
  AlertCircle, ChevronRight, User, Building2,
  PhoneForwarded, History, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import { SocialMessageModal } from './components/SocialMessageModal';

export function FollowupOverview() {
  const { user } = useAuth();
  const [leads, setLeads] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLogModalOpen, setIsLogModalOpen] = React.useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<any>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');

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

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('leads')
        .select('*')
        .neq('status', 'won')
        .neq('status', 'lost')
        .order('follow_up_date', { ascending: true, nullsFirst: false });
      
      if (sbError) {
        console.error('Supabase Error Details:', JSON.stringify(sbError, null, 2));
        setError(sbError.message);
        setLoading(false);
        return;
      }
      setLeads(data || []);
    } catch (err: any) {
      console.error('Fetch Error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLeads();
  }, []);

  const handleLogContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const nextFollowUp = formData.get('next_follow_up') as string;
    const nextFollowUpTime = formData.get('next_follow_up_time') as string;
    const notes = formData.get('notes') as string;
    const status = formData.get('status') as string;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          last_contacted_at: new Date().toISOString(),
          follow_up_date: nextFollowUp || null,
          follow_up_time: nextFollowUpTime || null,
          notes: selectedLead.notes ? `${selectedLead.notes}\n---\n${new Date().toLocaleDateString()}: ${notes}` : notes,
          status: status || selectedLead.status,
          ...(status === 'won' ? { converted_by: user?.id } : {})
        })
        .eq('id', selectedLead.id);

      if (!error) {
        setIsLogModalOpen(false);
        setSelectedLead(null);
        fetchLeads();
      } else {
        console.error('Update Error:', error);
        alert('Failed to update lead: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      (lead.name || '').toLowerCase().includes(search) || 
      (lead.company || '').toLowerCase().includes(search) || 
      (lead.phone || '').includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || lead.category?.toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const today = new Date().toISOString().split('T')[0];
  const overdueCount = leads.filter(l => l.follow_up_date && l.follow_up_date < today).length;
  const todayCount = leads.filter(l => l.follow_up_date === today).length;

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black flex items-center gap-3">
            Outreach <span className="font-light text-zinc-400">& Follow-ups</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Active telecalling and prospect engagement pipeline.</p>
        </div>
      </header>

      {/* Outreach Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-100 shadow-soft bg-zinc-900 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Urgent</span>
            </div>
            <p className="text-4xl font-black mb-1">{overdueCount}</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Overdue Follow-ups</p>
          </CardContent>
        </Card>
        
        <Card className="border-zinc-100 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-zinc-900" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Scheduled</span>
            </div>
            <p className="text-4xl font-black text-zinc-900 mb-1">{todayCount}</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Today's Task List</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-zinc-900" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Efficiency</span>
            </div>
            <p className="text-4xl font-black text-zinc-900 mb-1">{Math.round((todayCount / (overdueCount + todayCount || 1)) * 100)}%</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Daily Coverage</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-2">
          <div className="flex items-center gap-4 w-full max-w-2xl">
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search prospect by name, company or phone..." 
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
          </div>
        </div>

        <Card className="border-zinc-100 shadow-soft overflow-hidden">
          {error && (
            <div className="p-10 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <p className="font-bold uppercase text-xs tracking-widest">Database Sync Error</p>
              </div>
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <p className="text-[10px] text-red-400 mt-4 uppercase font-bold">
                Hint: Please ensure you have added the 'follow_up_date' and 'last_contacted_at' columns to the 'leads' table in Supabase.
              </p>
            </div>
          )}
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading Pipeline...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Prospect Details</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Last Contact</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Next Follow-up</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-zinc-400 text-sm">
                        No prospects requiring follow-up at this time.
                      </td>
                    </tr>
                  ) : filteredLeads.map((lead) => {
                    const isOverdue = lead.follow_up_date && lead.follow_up_date < today;
                    const isToday = lead.follow_up_date === today;

                    return (
                      <tr key={lead.id} className="group hover:bg-zinc-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-black">{lead.name}</p>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                                  <Building2 className="w-3 h-3" />
                                  <span>{lead.company}</span>
                                </div>
                                {lead.address && (
                                  <p className="text-[9px] text-zinc-400 font-medium">
                                    {lead.address}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {lead.last_contacted_at ? (
                            <div className="space-y-1">
                              <p className="text-[11px] font-bold text-zinc-900">
                                {new Date(lead.last_contacted_at).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-bold uppercase">
                                <History className="w-3 h-3" />
                                <span>{new Date(lead.last_contacted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-300 uppercase italic">Never Contacted</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          {lead.follow_up_date ? (
                            <div className={cn(
                              "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm",
                              isOverdue ? "bg-red-50 text-red-600" : 
                              isToday ? "bg-zinc-900 text-white" : "bg-emerald-50 text-emerald-600"
                            )}>
                              <Calendar className="w-3 h-3" />
                              <span>{isToday ? 'Today' : lead.follow_up_date}</span>
                              {lead.follow_up_time && <span className="ml-1 opacity-70 border-l border-white/20 pl-1">{lead.follow_up_time}</span>}
                              {isOverdue && <AlertCircle className="w-3 h-3 ml-1" />}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-300 uppercase">Not Scheduled</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                            lead.status === 'won' ? "bg-emerald-900 text-white border-emerald-900" :
                            lead.status === 'lost' ? "bg-red-50 text-red-600 border-red-100" :
                            lead.status === 'negotiation' ? "bg-zinc-900 text-white border-zinc-900" : 
                            lead.status === 'qualified' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            lead.status === 'follow_up' ? "bg-blue-50 text-blue-700 border-blue-100" :
                            lead.status === 'on_hold' ? "bg-amber-50 text-amber-700 border-amber-100" :
                            lead.status === 'unresponsive' ? "bg-zinc-100 text-zinc-400 border-zinc-200" :
                            lead.status === 'junk' ? "bg-zinc-100 text-zinc-400 border-zinc-200 line-through" :
                            "bg-zinc-50 text-zinc-500 border-zinc-100"
                          )}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            {lead.phone && (
                              <a 
                                href={`tel:${lead.phone}`}
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setIsLogModalOpen(true);
                                }}
                                className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 hover:shadow-soft transition-all"
                                title="Call Now"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                            {lead.phone && (
                              <button 
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setIsWhatsAppModalOpen(true);
                                }}
                                className="w-9 h-9 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm"
                                title="WhatsApp Template"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsLogModalOpen(true);
                              }}
                              className="px-4 h-9 rounded-xl border border-zinc-100 bg-white text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black hover:border-zinc-300 hover:shadow-soft transition-all flex items-center gap-2"
                            >
                              <PhoneForwarded className="w-3.5 h-3.5" />
                              Log Contact
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setSelectedLead(null);
        }}
        title="Log Outreach Activity"
      >
        {selectedLead && (
          <form className="space-y-6" onSubmit={handleLogContact}>
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Contacting</p>
              <p className="text-sm font-black text-zinc-900">{selectedLead.name} <span className="text-zinc-400 font-medium">({selectedLead.company})</span></p>
              <p className="text-xs font-bold text-zinc-500">{selectedLead.phone}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Update Status</label>
                <select 
                  name="status" 
                  defaultValue={selectedLead.status}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                >
                  <option value="new">Back to New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiation">In Negotiation</option>
                  <option value="follow_up">Needs Follow Up</option>
                  <option value="on_hold">On Hold</option>
                  <option value="unresponsive">Unresponsive</option>
                  <option value="won">Won (Convert) 🏆</option>
                  <option value="lost">Lost</option>
                  <option value="junk">Junk / Spam</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Next Follow-up Date</label>
                <input 
                  type="date" 
                  name="next_follow_up"
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Next Follow-up Time</label>
                <input 
                  type="time" 
                  name="next_follow_up_time"
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Call Notes</label>
                <textarea 
                  name="notes"
                  rows={4}
                  placeholder="What was discussed? Any specific requirements?"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsLogModalOpen(false)} className="flex-1 text-zinc-400">Cancel</Button>
              <Button type="submit" disabled={submitting} className="flex-1 bg-black text-white shadow-elevated">
                {submitting ? 'Updating...' : 'Save Activity'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {selectedLead && (
        <SocialMessageModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
        />
      )}
    </div>
  );
}
