"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HelpCircle, MessageCircle, Clock, AlertCircle, Plus, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function SupportOverview() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [selectedTicket, setSelectedTicket] = React.useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, profiles:created_by(full_name)')
        .order('created_at', { ascending: false });
      
      if (!error) setTickets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase.from('tickets').insert({
        title: formData.get('title'),
        priority: formData.get('priority'),
        description: formData.get('description'),
        created_by: user?.id,
        status: 'open',
      });

      if (!error) {
        setIsModalOpen(false);
        fetchTickets();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTicketStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
      if (!error) {
        setIsViewModalOpen(false);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            Support <span className="font-light text-zinc-400">Tickets</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Managing {tickets.length} help requests and internal support.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="Search subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 w-64"
            />
          </div>
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 px-4 bg-white border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black/5"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95 h-10">
            <Plus className="w-4 h-4 mr-2" /> New Ticket
          </Button>
        </div>
      </header>

      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title={`Ticket #${selectedTicket?.id.slice(0, 8).toUpperCase()}`}
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div>
              <div className={cn(
                "inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mb-3",
                selectedTicket.priority === 'critical' ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-500"
              )}>
                {selectedTicket.priority} Priority
              </div>
              <h3 className="text-xl font-black text-black mb-4">{selectedTicket.title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-6 rounded-2xl border border-zinc-100 italic">
                "{selectedTicket.description || 'No detailed description provided.'}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Status</p>
                <p className="text-xs font-black uppercase text-black">{selectedTicket.status}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Reported By</p>
                <p className="text-xs font-black uppercase text-black">{selectedTicket.profiles?.full_name}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-50">
              {selectedTicket.status === 'open' && (
                <Button onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in_progress')} className="flex-1 bg-black text-white rounded-xl">Claim Ticket</Button>
              )}
              {selectedTicket.status === 'in_progress' && (
                <Button onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')} className="flex-1 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Mark Resolved</Button>
              )}
              <Button variant="ghost" onClick={() => setIsViewModalOpen(false)} className="flex-1 text-zinc-400">Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Open Support Ticket"
      >
        <form className="space-y-6" onSubmit={handleCreateTicket}>
          <div className="space-y-4">
            <Input name="title" label="Subject" placeholder="e.g. Database access issues" required />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Priority</label>
              <select name="priority" className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400">
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="high">High</option>
                <option value="critical">Critical / System Down</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Message</label>
              <textarea 
                name="description"
                className="w-full min-h-[120px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                placeholder="Describe the issue in detail..."
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated">
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : (
        <>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Open Tickets', value: tickets.filter(t => t.status === 'open').length.toString(), icon: MessageCircle, color: 'bg-zinc-100 text-black' },
              { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length.toString(), icon: Clock, color: 'bg-zinc-100 text-black' },
              { label: 'Critical Issues', value: tickets.filter(t => t.priority === 'critical').length.toString(), icon: AlertCircle, color: 'bg-zinc-900 text-white shadow-elevated' },
            ].map((stat, i) => (
              <motion.div key={i} variants={item}>
                <Card className={cn("border-none", stat.color)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className="w-5 h-5 opacity-60" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Real-time</span>
                    </div>
                    <p className="text-3xl font-black mb-1">{stat.value}</p>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="space-y-6">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Active Tickets Queue</div>
            <Card className="border-zinc-100 shadow-soft overflow-hidden">
              <div className="divide-y divide-zinc-50">
                {tickets
                  .filter(t => {
                    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
                    return matchesSearch && matchesPriority;
                  })
                  .length === 0 ? (
                  <div className="p-20 text-center text-zinc-400 text-sm">No active tickets found.</div>
                ) : tickets
                  .filter(t => {
                    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
                    return matchesSearch && matchesPriority;
                  })
                  .map((ticket) => (
                  <div 
                    key={ticket.id} 
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsViewModalOpen(true);
                    }}
                    className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner border border-zinc-100",
                        ticket.priority === 'critical' ? "bg-zinc-900 text-white" : "bg-white text-zinc-400"
                      )}>
                        #{ticket.id.slice(0, 4)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-black mb-1 group-hover:text-zinc-500 transition-colors">{ticket.title}</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Reported by {ticket.profiles?.full_name || 'System'}</span>
                          <div className="w-1 h-1 rounded-full bg-zinc-200" />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        ticket.priority === 'critical' ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
                      )}>
                        {ticket.priority}
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Button variant="ghost" className="w-full text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] py-8">
              Load Completed Tickets
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
