"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Users, Plus, Search, Filter, MoreHorizontal, 
  Phone, Mail, Globe, ChevronRight, 
  Briefcase, ShieldCheck, UserCheck, Award,
  Trash2, ExternalLink, MessageCircle, Eye, Pencil,
  FolderPlus, Calendar, MapPin, X, Building2,
  FileText, History, Tag, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import Link from 'next/link';

const categories = ['Restaurant', 'Clinic', 'Gym', 'Real Estate', 'E-commerce', 'SaaS', 'Other'];

export function ClientsOverview() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<any>(null);
  const [editingClient, setEditingClient] = React.useState<any>(null);
  const [clients, setClients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 20;

  const fetchClients = async () => {
    setLoading(true);
    try {
      const [pRes, lRes] = await Promise.allSettled([
        supabase.from('profiles').select('*, projects(id, name, status)').eq('role', 'client'),
        supabase.from('leads').select('*').eq('status', 'won'),
      ]);
      
      let clientMap = new Map();
      
      if (pRes.status === 'fulfilled' && pRes.value.data) {
        pRes.value.data.forEach(c => clientMap.set(c.id, { 
          ...c, 
          type: 'account',
          email: c.email || '', 
          phone: c.phone || '',
          address: c.address || '',
          website_url: c.website_url || '',
          industry: c.industry || 'Other',
          gst_number: c.gst_number || '',
          account_status: c.account_status || 'active',
          won_at: c.won_at || c.created_at
        }));
      }
      
      if (lRes.status === 'fulfilled' && lRes.value.data) {
        lRes.value.data.forEach(l => {
          if (!clientMap.has(l.id)) {
            clientMap.set(l.id, { 
              id: l.id, 
              full_name: l.company || l.name, 
              email: l.email, 
              phone: l.phone, 
              address: l.address,
              website_url: l.website_url,
              industry: l.category || 'Other',
              gst_number: l.gst_number || '',
              account_status: l.account_status || 'active',
              won_at: l.won_at || l.created_at,
              type: 'converted_lead',
              created_at: l.created_at,
              projects: [] 
            });
          }
        });
      }

      setClients(Array.from(clientMap.values()).sort((a, b) => new Date(b.won_at).getTime() - new Date(a.won_at).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchClients();
  }, []);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDeleteClient = async (id: string, type: 'account' | 'converted_lead') => {
    if (!confirm('Are you sure you want to remove this client? This will delete their record.')) return;
    try {
      const table = type === 'account' ? 'profiles' : 'leads';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
        fetchClients();
        if (selectedClient?.id === id) setIsDrawerOpen(false);
      } else {
        console.error('Delete error:', error);
        alert(`Failed to delete client: ${error.message}\n\nNote: If this client has active projects or invoices, you must delete those first.`);
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while deleting the client.');
    }
  };

  const handleCreateOrUpdateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const updatePayload = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      website_url: formData.get('website'),
      industry: formData.get('industry'),
      gst_number: formData.get('gst_number'),
      account_status: formData.get('account_status'),
    };

    try {
      if (editingClient) {
        const table = editingClient.type === 'account' ? 'profiles' : 'leads';
        const finalPayload = editingClient.type === 'account' 
          ? updatePayload
          : { 
              company: formData.get('full_name'), 
              name: formData.get('full_name'), 
              email: formData.get('email'), 
              phone: formData.get('phone'),
              address: formData.get('address'),
              website_url: formData.get('website'),
              category: formData.get('industry'),
              gst_number: formData.get('gst_number'),
              account_status: formData.get('account_status')
            };
          
        const { error } = await supabase.from(table).update(finalPayload).eq('id', editingClient.id);
        if (!error) {
          setIsModalOpen(false);
          setEditingClient(null);
          fetchClients();
        } else {
          alert(error.message);
        }
      } else {
        const { error } = await supabase.from('profiles').insert({
          id: crypto.randomUUID(),
          ...updatePayload,
          role: 'client',
          won_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

        if (!error) {
          setIsModalOpen(false);
          fetchClients();
        } else {
          alert(error.message);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (client: any) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(client => 
    client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const currentClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black flex items-center gap-3">
            Client <span className="font-light text-zinc-400">Directory</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Managing relationships and strategic business growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95 px-6 rounded-xl h-11">
            <Plus className="w-4 h-4 mr-2" /> Register Client
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Clients', value: clients.length.toString(), icon: Users, trend: 'Managed' },
          { label: 'Strategic Partners', value: clients.filter(c => c.account_status === 'active').length.toString(), icon: ShieldCheck, trend: 'High Priority' },
          { label: 'Industries', value: new Set(clients.map(c => c.industry)).size.toString(), icon: Building2, trend: 'Diversified' },
        ].map((stat, i) => (
          <Card key={i} className="border-zinc-100 shadow-soft rounded-2xl">
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
          <div className="relative w-full max-w-xl group text-zinc-900 flex items-center">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, email or industry..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border border-zinc-200 rounded-2xl text-sm focus:ring-4 focus:ring-black/5 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
              Showing <span className="text-black">{filteredClients.length}</span> results
            </p>
            <Button variant="outline" size="sm" className="h-12 px-6 rounded-2xl">
              <Filter className="w-4 h-4 mr-2" /> Advanced Filters
            </Button>
          </div>
        </div>

        {/* Clients Table */}
        <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-3xl">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading Portfolio...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Client / Industry</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Tax ID / GST</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Won Date</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {currentClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-zinc-400 text-sm">
                        No clients matching your criteria.
                      </td>
                    </tr>
                  ) : currentClients.map((client) => (
                    <tr key={client.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all text-sm font-black uppercase shadow-inner">
                            {client.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-black mb-0.5">{client.full_name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-tighter bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200">
                                {client.industry}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-zinc-200" />
                              <span className="text-[10px] font-bold text-zinc-400 uppercase">{client.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-black">{client.gst_number || '---'}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Registered Tax ID</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          client.account_status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                        )}>
                          <Activity className="w-3 h-3" />
                          {client.account_status}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-zinc-500">{new Date(client.won_at).toLocaleDateString()}</p>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">Partnership Start</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/clients/${client.id}`}
                            className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 hover:shadow-soft transition-all"
                            title="Strategic Overview"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          
                          <button 
                            onClick={() => handleEditClick(client)}
                            className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-soft transition-all"
                            title="Edit Account"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <Link 
                            href={`/projects?clientId=${client.id}`}
                            className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-soft transition-all"
                            title="Initialize Project"
                          >
                            <FolderPlus className="w-4 h-4" />
                          </Link>

                          <button 
                            onClick={() => handleDeleteClient(client.id, client.type)}
                            className="w-9 h-9 rounded-xl border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 hover:text-red-600 hover:border-red-100 hover:shadow-soft transition-all"
                            title="Remove Partner"
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

      {/* Strategic Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedClient && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[140]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-[150] overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-zinc-900 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                      {selectedClient.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-black">{selectedClient.full_name}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{selectedClient.industry} Partner</span>
                        <div className="w-1 h-1 rounded-full bg-zinc-200" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{selectedClient.account_status}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-black transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Strategic Facts */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Won Date', value: new Date(selectedClient.won_at).toLocaleDateString(), icon: Calendar },
                    { label: 'Industry', value: selectedClient.industry, icon: Building2 },
                    { label: 'Status', value: selectedClient.account_status, icon: Activity },
                  ].map((fact, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center text-center">
                      <fact.icon className="w-4 h-4 text-zinc-400 mb-2" />
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{fact.label}</p>
                      <p className="text-xs font-black text-black uppercase">{fact.value}</p>
                    </div>
                  ))}
                </div>

                {/* Business Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 w-1 bg-zinc-900 rounded-full" />
                    <h3 className="text-xs font-black text-black uppercase tracking-[0.2em]">Business Profile</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 bg-white shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Registered Tax ID / GST</p>
                        <p className="text-sm font-bold text-black">{selectedClient.gst_number || 'No Tax ID registered'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 bg-white shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Principal Address</p>
                        <p className="text-sm font-bold text-black">{selectedClient.address || 'Address not registered'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 bg-white shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Digital Presence</p>
                        <a href={selectedClient.website_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline">
                          {selectedClient.website_url || 'No website registered'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projects Timeline */}
                <div className="space-y-4 pt-4 border-t border-zinc-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-1 bg-zinc-900 rounded-full" />
                      <h3 className="text-xs font-black text-black uppercase tracking-[0.2em]">Project History</h3>
                    </div>
                    <Link href={`/projects?clientId=${selectedClient.id}`} className="text-[10px] font-bold text-black uppercase hover:underline">Full Portfolio</Link>
                  </div>
                  {selectedClient.projects?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedClient.projects.map((project: any) => (
                        <div key={project.id} className="p-4 rounded-2xl border border-zinc-100 flex items-center justify-between group hover:border-zinc-900 transition-all hover:text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-800">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{project.name}</p>
                              <p className="text-[10px] font-bold uppercase group-hover:text-zinc-400 text-zinc-400">{project.status}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 rounded-3xl border-2 border-dashed border-zinc-100 text-center">
                      <History className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                      <p className="text-xs font-bold text-zinc-400 uppercase mb-4 tracking-widest">No strategic projects initiated</p>
                      <Link href={`/projects?clientId=${selectedClient.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl border-zinc-200 shadow-sm hover:bg-zinc-50">
                          <Plus className="w-4 h-4 mr-2" /> Start First Project
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="pt-8 flex gap-3">
                  <Button onClick={() => handleEditClick(selectedClient)} variant="outline" className="flex-1 rounded-xl shadow-sm">
                    <Pencil className="w-4 h-4 mr-2" /> Edit Strategic Info
                  </Button>
                  <Button onClick={() => handleDeleteClient(selectedClient.id, selectedClient.type)} variant="ghost" className="flex-1 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" /> Archive Relationship
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Strategic Relationship Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingClient(null); }} 
        title={editingClient ? "Strategic Profile Alignment" : "New Strategic Partnership"}
      >
        <form className="space-y-6" onSubmit={handleCreateOrUpdateClient}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                name="full_name" 
                label="Partner / Company Name" 
                placeholder="e.g. Acme Global" 
                defaultValue={editingClient?.full_name}
                required 
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Account Status</label>
                <select 
                  name="account_status" 
                  defaultValue={editingClient?.account_status || 'active'}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                >
                  <option value="active">Active Relationship</option>
                  <option value="on_hold">On Hold / Periodic</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Industry Segment</label>
                <select 
                  name="industry" 
                  defaultValue={editingClient?.industry || 'Other'}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <Input 
                name="gst_number" 
                label="Registered GST / Tax ID" 
                placeholder="e.g. 27AAAC..." 
                defaultValue={editingClient?.gst_number}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-50 pt-4">
              <Input 
                name="email" 
                label="Primary Account Email" 
                type="email" 
                placeholder="strategic@acme.com" 
                defaultValue={editingClient?.email}
                required 
              />
              <Input 
                name="phone" 
                label="Point of Contact Phone" 
                type="tel" 
                placeholder="+1..." 
                defaultValue={editingClient?.phone}
              />
            </div>

            <Input 
              name="website" 
              label="Corporate Website" 
              placeholder="https://acme.com" 
              defaultValue={editingClient?.website_url}
            />
            
            <Input 
              name="address" 
              label="Principal Business Address" 
              placeholder="Full HQ Address..." 
              defaultValue={editingClient?.address}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); setEditingClient(null); }} className="flex-1 text-zinc-400">Discard</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated rounded-xl bg-black text-white hover:bg-zinc-800 h-11">
              {submitting ? 'Processing...' : (editingClient ? 'Align Strategy' : 'Confirm Partnership')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
