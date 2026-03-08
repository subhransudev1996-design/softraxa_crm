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
  CreditCard, History, TrendingUp, Receipt, Info, ShieldCheck, Award
} from 'lucide-react';
import { ProposalGenerator } from './ProposalGenerator';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { InvoiceGenerator } from '@/modules/finance/InvoiceGenerator';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import Link from 'next/link';

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

const categories = ['Restaurant', 'Clinic', 'Gym', 'Real Estate', 'E-commerce', 'SaaS', 'Other'];

export function ClientDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [client, setClient] = React.useState<any>(null);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview');

  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [generateInvoice, setGenerateInvoice] = React.useState(false);
  const [invoiceAmount, setInvoiceAmount] = React.useState('');

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = React.useState(false);
  const [newlyCreatedInvoice, setNewlyCreatedInvoice] = React.useState<any>(null);
  const [newlyCreatedProject, setNewlyCreatedProject] = React.useState<any>(null);

  const fetchClientData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Try profile first - using simpler join syntax
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, converter:profiles!converted_by(full_name)')
        .eq('id', id)
        .single();

      if (profileData && profileData.role === 'client') {
        setClient({ ...profileData, type: 'account' });
      } else {
        // Try lead if profile not found or not a client
        const { data: leadData } = await supabase
          .from('leads')
          .select('*, converter:profiles!converted_by(full_name)')
          .eq('id', id)
          .eq('status', 'won')
          .single();
        
        if (leadData) {
          setClient({ 
            ...leadData, 
            full_name: leadData.company || leadData.name, 
            industry: leadData.category || 'Other',
            type: 'converted_lead'
          });
        }
      }

      const [projectsRes, invoicesRes] = await Promise.allSettled([
        supabase.from('projects').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*, projects(name)').eq('client_id', id).order('created_at', { ascending: false })
      ]);

      if (projectsRes.status === 'fulfilled' && projectsRes.value.data) {
        setProjects(projectsRes.value.data);
      }
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data) {
        setInvoices(invoicesRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      // Ensure profile exists to satisfy FK constraints
      await supabase.from('profiles').upsert({
        id: id as string,
        full_name: client.full_name,
        role: 'client'
      }, { onConflict: 'id' });

      const projectData = {
        name: formData.get('name'),
        description: formData.get('description'),
        budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : 0,
        end_date: formData.get('end_date') || null,
        client_id: id as string,
        status: 'active',
      };

      const { data: newProject, error } = await supabase.from('projects').insert(projectData).select().single();

      if (!error && newProject) {
        // Generate invoice if requested
        if (generateInvoice && invoiceAmount) {
          const { data: invData } = await supabase.from('invoices').insert({
            project_id: newProject.id,
            client_id: id as string,
            amount: parseFloat(invoiceAmount),
            status: 'pending',
            due_date: new Date().toISOString(),
            notes: `Project Initialization: ${projectData.name}`
          }).select().single();

          if (invData) {
            setNewlyCreatedInvoice(invData);
            setNewlyCreatedProject(newProject);
            setIsInvoiceModalOpen(true);
          }
        }

        setIsProjectModalOpen(false);
        setGenerateInvoice(false);
        setInvoiceAmount('');
        fetchClientData();
      } else {
        alert(error?.message || "Failed to create project");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const updateData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        website_url: formData.get('website'),
        industry: formData.get('industry'),
        gst_number: formData.get('gst_number'),
        account_status: formData.get('account_status'),
      };

      const { error } = await supabase.from('profiles').update(updateData).eq('id', id);

      if (!error) {
        setIsClientModalOpen(false);
        fetchClientData();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error('Error updating client:', err);
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (id) fetchClientData();
  }, [id, fetchClientData]);

  // Derived Metrics
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
  const outstandingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0);

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-20">
      <InvoiceGenerator
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={newlyCreatedInvoice}
        project={newlyCreatedProject}
        client={client}
      />
      <ProposalGenerator
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        client={client}
      />
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Initialize New Project"
      >
        <form className="space-y-6" onSubmit={handleCreateProject}>
          <div className="space-y-4">
            <Input name="name" label="Project Name" placeholder="e.g. Mobile App Development" required />
            <div className="grid grid-cols-2 gap-4">
              <Input name="budget" label="Budget (INR)" type="number" placeholder="₹0.00" />
              <Input name="end_date" label="Estimated End Date" type="date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Project Description</label>
              <textarea
                name="description"
                className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-all"
                placeholder="Briefly describe the project scope..."
              />
            </div>

            <div className="pt-4 border-t border-zinc-50 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  generateInvoice ? "bg-black border-black" : "border-zinc-200 group-hover:border-zinc-400"
                )}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={generateInvoice}
                    onChange={(e) => setGenerateInvoice(e.target.checked)}
                  />
                  {generateInvoice && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Generate Initialization Invoice</span>
              </label>

              {generateInvoice && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Input
                    label="Advance Amount (INR)"
                    type="number"
                    placeholder="₹0.00"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    required
                  />
                </motion.div>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsProjectModalOpen(false)} className="flex-1 rounded-xl text-zinc-400">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated rounded-xl bg-black text-white hover:bg-zinc-800 h-11">
              {submitting ? 'Processing...' : 'Start Project'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title="Strategic Profile Alignment"
      >
        <form className="space-y-6" onSubmit={handleUpdateClient}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="full_name"
                label="Partner / Company Name"
                placeholder="e.g. Acme Global"
                defaultValue={client?.full_name}
                required
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Account Status</label>
                <select
                  name="account_status"
                  defaultValue={client?.account_status}
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
                  defaultValue={client?.industry}
                  className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <Input
                name="gst_number"
                label="Registered GST / Tax ID"
                placeholder="e.g. 27AAAC..."
                defaultValue={client?.gst_number}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-50 pt-4">
              <Input
                name="email"
                label="Primary Account Email"
                type="email"
                placeholder="strategic@acme.com"
                defaultValue={client?.email}
                required
              />
              <Input
                name="phone"
                label="Point of Contact Phone"
                type="tel"
                placeholder="+1..."
                defaultValue={client?.phone}
              />
            </div>

            <Input
              name="website"
              label="Corporate Website"
              placeholder="https://acme.com"
              defaultValue={client?.website_url}
            />

            <Input
              name="address"
              label="Principal Business Address"
              placeholder="Full HQ Address..."
              defaultValue={client?.address}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsClientModalOpen(false)} className="flex-1 text-zinc-400">Discard</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated rounded-xl bg-black text-white hover:bg-zinc-800 h-11">
              {submitting ? 'Processing...' : 'Align Strategy'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Header Navigation */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <Link href="/clients" className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all shadow-soft">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-black">{client?.full_name}</h1>
              <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm",
                client?.account_status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
              )}>
                {client?.account_status}
              </span>
            </div>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              {client?.industry} Sector Partner
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsProposalModalOpen(true)} variant="outline" className="border-zinc-200 h-11 px-6 rounded-xl hover:bg-zinc-50 shadow-soft">
            <FileText className="w-4 h-4 mr-2" /> Generate Proposal
          </Button>
          <Button onClick={() => setIsClientModalOpen(true)} variant="outline" className="rounded-xl h-11 border-zinc-200 shadow-sm">
            <Pencil className="w-4 h-4 mr-2" /> Alignment
          </Button>
          <Button onClick={() => setIsProjectModalOpen(true)} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95 h-11 rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" /> Initialize Project
          </Button>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Strategic Portfolio', value: projects.length.toString(), icon: Briefcase, color: 'text-zinc-900', trend: 'Projects' },
          { label: 'Lifetime Value', value: `₹${totalBudget.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', trend: 'Total Budget' },
          { label: 'Settled Capital', value: `₹${totalPaid.toLocaleString()}`, icon: ShieldCheck, color: 'text-blue-600', trend: 'Paid' },
          { label: 'Outstanding Account', value: `₹${outstandingAmount.toLocaleString()}`, icon: AlertCircle, color: 'text-red-600', trend: 'Pending' },
        ].map((stat, i) => (
          <Card key={i} className="border-zinc-100 shadow-soft overflow-hidden rounded-3xl group transition-all hover:border-zinc-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all">
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest group-hover:text-zinc-500">{stat.trend}</span>
              </div>
              <p className={cn("text-2xl font-black mb-1", stat.color)}>{stat.value}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="flex gap-8 border-b border-zinc-100 px-2 overflow-x-auto scrollbar-hide">
            {['overview', 'projects', 'financials', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap",
                  activeTab === tab ? "text-black" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="client-tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* Active Projects Glimpse */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-zinc-400" /> Operational Portfolio
                    </h3>
                    <button onClick={() => setActiveTab('projects')} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">Expand View</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.slice(0, 4).map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`} className="p-5 rounded-3xl border border-zinc-100 bg-white shadow-soft group hover:border-zinc-900 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-inner bg-zinc-50"
                          )}>
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-black group-hover:translate-x-1 transition-transform">{project.name}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{project.status}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-200 group-hover:text-black group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                    {projects.length === 0 && (
                      <div className="col-span-full p-12 rounded-[2rem] border-2 border-dashed border-zinc-100 text-center">
                        <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No active strategic projects</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Health Summary */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-zinc-400" /> Capital Flow Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2rem] bg-zinc-900 text-white space-y-4 shadow-xl">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Revenue Status</p>
                      <div className="flex items-end gap-3">
                        <p className="text-4xl font-black">₹{totalPaid.toLocaleString()}</p>
                        <span className="text-emerald-400 text-[10px] font-bold uppercase mb-1">Settled</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: totalBudget > 0 ? `${(totalPaid / totalBudget) * 100}%` : '0%' }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                        {totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0}% of Total Strategic Value
                      </p>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 space-y-4">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recent Invoices</p>
                      <div className="space-y-3">
                        {invoices.slice(0, 3).map(inv => (
                          <div key={inv.id} className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-black">₹{inv.amount.toLocaleString()}</p>
                              <p className="text-[9px] font-bold text-zinc-400 uppercase">{inv.projects?.name || 'General'}</p>
                            </div>
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm border",
                              inv.status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                              {inv.status}
                            </span>
                          </div>
                        ))}
                        {invoices.length === 0 && <p className="text-[10px] font-bold text-zinc-300 uppercase py-4">No billing history</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-black text-black uppercase tracking-[0.2em]">Full Portfolio Execution</h3>
                  <Button onClick={() => setIsProjectModalOpen(true)} size="sm" className="bg-black text-white rounded-xl h-9 text-[10px] font-black uppercase tracking-widest">
                    <Plus className="w-3.5 h-3.5 mr-2" /> New Project
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {projects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="p-5 rounded-3xl border border-zinc-100 hover:border-zinc-300 transition-all bg-white flex items-center justify-between group shadow-soft hover:shadow-elevated">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-inner">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black group-hover:text-zinc-600 transition-colors">{project.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-tighter flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> ₹{project.budget?.toLocaleString()}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-zinc-200" />
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-tighter flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(project.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm",
                          project.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-zinc-50 text-zinc-500 border-zinc-100"
                        )}>
                          {project.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-200 group-hover:text-black group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'financials' && (
              <motion.div
                key="financials"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-black text-black uppercase tracking-[0.2em]">Strategic Billing Log</h3>
                  <Button size="sm" className="bg-black text-white rounded-xl h-9 text-[10px] font-black uppercase tracking-widest">
                    <Plus className="w-3.5 h-3.5 mr-2" /> Issue Invoice
                  </Button>
                </div>
                <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-3xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-100">
                          <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Reference</th>
                          <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Project</th>
                          <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Amount</th>
                          <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-black">INV-{inv.id.substring(0, 8).toUpperCase()}</td>
                            <td className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase">{inv.projects?.name || '---'}</td>
                            <td className="px-6 py-4 text-xs font-black">₹{inv.amount.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter border shadow-sm",
                                inv.status === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                              )}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase">{new Date(inv.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-8">
          {/* Corporate Profile Card */}
          <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2.5rem] bg-zinc-900 text-white">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl shadow-lg">
                  🏙️
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Account Type</p>
                  <p className="text-xs font-bold uppercase tracking-tighter">Strategic Account</p>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-black mb-1">{client?.full_name}</h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">{client?.industry} Infrastructure</p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-600" /> {client?.email || 'No primary email'}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-600" /> {client?.phone || 'No direct line'}
                  </div>
                  {client?.website_url && (
                    <a href={client?.website_url} target="_blank" className="flex items-center gap-4 text-xs font-bold text-blue-400 hover:underline">
                      <Globe className="w-4 h-4 text-zinc-600" /> visit_corporate_site
                    </a>
                  )}
                  <div className="flex items-start gap-4 text-xs font-bold text-zinc-400">
                    <MapPin className="w-4 h-4 text-zinc-600 mt-0.5" />
                    <span className="leading-relaxed">{client?.address || 'Principal address not registered'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Partnership Since</p>
                  <p className="text-[10px] font-bold uppercase">{client?.won_at || client?.created_at ? new Date(client?.won_at || client?.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tax ID / GST</p>
                  <p className="text-[10px] font-bold uppercase tracking-tighter">{client?.gst_number || 'Pending Registry'}</p>
                </div>
              </div>

              <Button className="w-full rounded-2xl bg-white text-black hover:bg-zinc-200 shadow-xl font-black uppercase text-[10px] tracking-widest h-12">
                Open Project Channel
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions / Activity Card */}
          <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2.5rem] bg-white">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" /> Interaction Log
              </h3>

              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                {client?.converter && (
                  <div className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center relative z-10 shadow-sm text-white">
                      <Award className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">Strategic Win</p>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">
                        Secured by {client.converter.full_name}
                      </p>
                    </div>
                  </div>
                )}
                {[
                  { label: 'Strategic Alignment', date: 'Just now', icon: Activity, color: 'text-zinc-400' },
                  { label: 'Project Initialized', date: 'Recent', icon: Plus, color: 'text-blue-500' },
                ].map((act, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className={cn("w-6 h-6 rounded-full bg-white border-2 border-zinc-100 flex items-center justify-center relative z-10 shadow-sm", act.color)}>
                      <act.icon className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">{act.label}</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase">{act.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-[2rem] bg-zinc-50 border border-dashed border-zinc-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                    <MessageSquare className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-xs font-black uppercase text-zinc-400 tracking-tighter">Stakeholder Access</p>
                </div>
                <p className="text-[11px] font-medium text-zinc-500 leading-relaxed mb-4">Partner can access real-time status through their portal. Engagement is currently high.</p>
                <Button variant="outline" className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all">Send Update</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ProposalGenerator
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        client={client}
      />
    </div>
  );
}
