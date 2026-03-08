"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Briefcase, Plus, Search, Filter, MoreHorizontal, Clock, CheckCircle2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { InvoiceGenerator } from '@/modules/finance/InvoiceGenerator';

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

export function ProjectsOverview() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedClientId, setSelectedClientId] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 20;

  const [editingProject, setEditingProject] = React.useState<any>(null);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [generateInvoice, setGenerateInvoice] = React.useState(false);
  const [invoiceAmount, setInvoiceAmount] = React.useState('');

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false);
  const [newlyCreatedInvoice, setNewlyCreatedInvoice] = React.useState<any>(null);
  const [newlyCreatedProject, setNewlyCreatedProject] = React.useState<any>(null);
  const [newlyCreatedClient, setNewlyCreatedClient] = React.useState<any>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, lRes] = await Promise.allSettled([
        supabase.from('projects').select('*, profiles(full_name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name').eq('role', 'client'),
        supabase.from('leads').select('id, company, name').eq('status', 'won'),
      ]);
      
      if (pRes.status === 'fulfilled' && pRes.value.data) setProjects(pRes.value.data);
      
      let clientMap = new Map();
      
      if (cRes.status === 'fulfilled' && cRes.value.data) {
        cRes.value.data.forEach(c => clientMap.set(c.id, { id: c.id, full_name: c.full_name }));
      }
      
      if (lRes.status === 'fulfilled' && lRes.value.data) {
        lRes.value.data.forEach(l => {
          if (!clientMap.has(l.id)) {
            clientMap.set(l.id, { id: l.id, full_name: l.company || l.name });
          }
        });
      }
      setClients(Array.from(clientMap.values()));

      // Check for clientId in URL
      const clientIdParam = searchParams.get('clientId');
      if (clientIdParam) {
        setSelectedClientId(clientIdParam);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInitialData();
  }, [searchParams]);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCreateOrUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      if (selectedClientId) {
        const selectedClient = clients.find(c => c.id === selectedClientId);
        if (selectedClient) {
          await supabase.from('profiles').upsert({
            id: selectedClientId,
            full_name: selectedClient.full_name,
            role: 'client'
          }, { onConflict: 'id' });
        }
      }

      const projectData = {
        name: formData.get('name'),
        description: formData.get('description'),
        budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : 0,
        end_date: formData.get('end_date') || null,
        client_id: selectedClientId || null,
        status: editingProject ? editingProject.status : 'active',
      };

      let error;
      let newProject: any = null;
      if (editingProject) {
        const { error: err } = await supabase.from('projects').update(projectData).eq('id', editingProject.id);
        error = err;
      } else {
        const { data, error: err } = await supabase.from('projects').insert(projectData).select().single();
        error = err;
        newProject = data;
      }

      if (!error) {
        if (!editingProject && generateInvoice && newProject && invoiceAmount) {
          const { data: invData } = await supabase.from('invoices').insert({
            project_id: newProject.id,
            client_id: selectedClientId || null,
            amount: parseFloat(invoiceAmount),
            status: 'pending',
            due_date: new Date().toISOString(),
            notes: `Project Initialization: ${projectData.name}`
          }).select().single();

          if (invData) {
            const selectedClient = clients.find(c => c.id === selectedClientId);
            setNewlyCreatedInvoice(invData);
            setNewlyCreatedProject(newProject);
            setNewlyCreatedClient(selectedClient);
            setIsInvoiceModalOpen(true);
          }
        }

        setIsModalOpen(false);
        setEditingProject(null);
        setSelectedClientId('');
        setGenerateInvoice(false);
        setInvoiceAmount('');
        const { data } = await supabase.from('projects').select('*, profiles(full_name)').order('created_at', { ascending: false });
        if (data) setProjects(data);
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? All associated tasks will be removed.')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (!error) {
        setProjects(projects.filter(p => p.id !== id));
        setActiveMenu(null);
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (project: any) => {
    setEditingProject(project);
    setSelectedClientId(project.client_id || '');
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const filteredProjects = projects.filter(project => 
    project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const currentProjects = filteredProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in pb-20">
      <InvoiceGenerator 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={newlyCreatedInvoice}
        project={newlyCreatedProject}
        client={newlyCreatedClient}
      />
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            Active <span className="font-light text-zinc-400">Projects</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Managing {projects.length} ongoing development streams.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setEditingProject(null); setSelectedClientId(''); setIsModalOpen(true); }} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95 h-11 rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" /> Start Project
          </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-2">
        <div className="relative w-full max-w-xl group">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
          <input 
            type="text" 
            placeholder="Search projects by name or client..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-zinc-200 rounded-2xl text-sm focus:ring-4 focus:ring-black/5 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
            Showing <span className="text-black">{filteredProjects.length}</span> projects
          </p>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedClientId(''); setEditingProject(null); }} 
        title={editingProject ? "Update Project Details" : "Initialize New Project"}
      >
        <form className="space-y-6" onSubmit={handleCreateOrUpdateProject}>
          <div className="space-y-4">
            <Input name="name" label="Project Name" placeholder="e.g. Mobile App Development" defaultValue={editingProject?.name} required />
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <User className="w-3 h-3" /> Assign Client
              </label>
              <select 
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-all"
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.full_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input name="budget" label="Budget (INR)" type="number" placeholder="₹0.00" defaultValue={editingProject?.budget} />
              <Input name="end_date" label="Estimated End Date" type="date" defaultValue={editingProject?.end_date} />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Project Description</label>
              <textarea 
                name="description"
                defaultValue={editingProject?.description}
                className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                placeholder="Briefly describe the project scope..."
              />
            </div>

            {!editingProject && (
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
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); setSelectedClientId(''); setEditingProject(null); }} className="flex-1 rounded-xl text-zinc-400">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated rounded-xl bg-black text-white hover:bg-zinc-800 h-11">
              {submitting ? 'Processing...' : (editingProject ? 'Save Changes' : 'Start Project')}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : (
        <div className="space-y-10">
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProjects.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">No projects found.</p>
              </div>
            ) : currentProjects.map((project) => (
              <motion.div key={project.id} variants={item} className="relative">
                <Card className="hover:shadow-soft border-zinc-100 group transition-all hover:border-zinc-300 overflow-hidden rounded-3xl">
                  <CardContent className="p-0">
                    <div className="h-2 bg-zinc-900 w-full" />
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xl shadow-inner">
                          🏢
                        </div>
                        <div className="relative">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                            className="text-zinc-300 hover:text-black rounded-full"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                          
                          <AnimatePresence>
                            {activeMenu === project.id && (
                              <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setActiveMenu(null)} />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-48 bg-white border border-zinc-100 rounded-2xl shadow-elevated z-[70] overflow-hidden"
                                >
                                  <div className="p-2 space-y-1">
                                    <Link 
                                      href={`/projects/${project.id}`}
                                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 rounded-xl transition-all"
                                    >
                                      <Eye className="w-4 h-4" /> View Details
                                    </Link>
                                    <button 
                                      onClick={() => handleEditClick(project)}
                                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 rounded-xl transition-all"
                                    >
                                      <Pencil className="w-4 h-4" /> Edit Project
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteProject(project.id)}
                                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" /> Delete Project
                                    </button>
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <Link href={`/projects/${project.id}`}>
                        <h3 className="text-lg font-bold text-black mb-1 group-hover:text-zinc-500 transition-colors">{project.name}</h3>
                      </Link>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-6">
                        {project.status}
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                          <span className="text-zinc-400">Progress</span>
                          <span className="text-black">{project.completion_percentage}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-black rounded-full transition-all" style={{ width: `${project.completion_percentage}%` }} />
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold">
                            {project.profiles?.full_name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">{project.profiles?.full_name || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No date'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

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
      )}
    </div>
  );
}
