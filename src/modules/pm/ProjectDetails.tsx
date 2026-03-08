"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Briefcase, Calendar, Clock, CheckCircle2, 
  ArrowLeft, MoreHorizontal, Plus, Users, 
  DollarSign, Target, Activity, ChevronRight,
  MessageSquare, LayoutGrid, ListTodo, FileText,
  AlertCircle, Pencil, Trash2, ExternalLink,
  TrendingUp, ArrowUpRight, ArrowDownRight, Receipt, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import Link from 'next/link';
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

export function ProjectDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = React.useState<any>(null);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview');

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, iRes, eRes] = await Promise.allSettled([
        supabase.from('projects').select('*, profiles:client_id(*)').eq('id', id).single(),
        supabase.from('tasks').select('*, profiles:assignee_id(full_name)').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('project_id', id).order('created_at', { ascending: false })
      ]);

      if (pRes.status === 'fulfilled' && pRes.value.data) setProject(pRes.value.data);
      if (tRes.status === 'fulfilled' && tRes.value.data) setTasks(tRes.value.data);
      if (iRes.status === 'fulfilled' && iRes.value.data) setInvoices(iRes.value.data || []);
      if (eRes.status === 'fulfilled' && eRes.value.data) setExpenses(eRes.value.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (id) fetchProjectData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em]">Synchronizing Data...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-black mb-2">Project Not Found</h2>
        <Button onClick={() => router.push('/projects')} variant="ghost">Back to Directory</Button>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netPosition = totalRevenue - totalExpense;

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-20">
      <InvoiceGenerator 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
        project={project}
        client={project?.profiles}
      />

      {/* Header Navigation */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <Link href="/projects" className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all shadow-soft">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-black">{project.name}</h1>
              <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm",
                project.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-zinc-50 text-zinc-500 border-zinc-100"
              )}>
                {project.status}
              </span>
            </div>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
              {project.profiles?.full_name || 'Individual Client'} Account
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 border-zinc-200 shadow-sm">
            <Pencil className="w-4 h-4 mr-2" /> Alignment
          </Button>
          <Button className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95 h-11 rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" /> Initialize Stream
          </Button>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Budget Allocation', value: `₹${project.budget?.toLocaleString() || '0'}`, icon: DollarSign, color: 'text-emerald-600', trend: 'Total' },
          { label: 'Net Position', value: `₹${netPosition.toLocaleString()}`, icon: TrendingUp, color: netPosition >= 0 ? 'text-blue-600' : 'text-red-600', trend: 'Profit/Loss' },
          { label: 'Execution Rate', value: `${progressPercentage}%`, icon: Activity, color: 'text-zinc-900', trend: 'Tasks' },
          { label: 'Deadline', value: project.end_date ? new Date(project.end_date).toLocaleDateString() : 'TBD', icon: Calendar, color: 'text-red-600', trend: 'Target' },
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
            {['overview', 'tasks', 'financials', 'team'].map((tab) => (
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
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full" />
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
                {/* Description & Objectives */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" /> Strategic Context
                  </h3>
                  <div className="p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 leading-relaxed text-zinc-600 text-sm font-medium">
                    {project.description || "No detailed strategic context provided for this project. Use the edit feature to add mission objectives and technical scope."}
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Target className="w-4 h-4 text-zinc-400" /> Milestone Tracking
                    </h3>
                    <span className="text-[10px] font-black bg-zinc-900 text-white px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">{progressPercentage}% Complete</span>
                  </div>
                  <div className="h-4 bg-zinc-100 rounded-full overflow-hidden shadow-inner p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-black rounded-full shadow-lg relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
                    </motion.div>
                  </div>
                </div>

                {/* Active Task Glimpse */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-zinc-400" /> High-Priority Streams
                    </h3>
                    <Link href={`/tasks?projectId=${id}`} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">Launch Taskboard</Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="p-5 rounded-3xl border border-zinc-100 bg-white shadow-soft group hover:border-zinc-900 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-2 h-10 rounded-full",
                            task.status === 'done' ? "bg-emerald-500" : "bg-amber-500"
                          )} />
                          <div>
                            <p className="text-sm font-bold text-black group-hover:translate-x-1 transition-transform">{task.title}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{task.status.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-200 group-hover:text-black group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="col-span-full p-12 rounded-[2rem] border-2 border-dashed border-zinc-100 text-center">
                        <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No active task streams</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                   <h3 className="text-sm font-black text-black uppercase tracking-[0.2em]">All Project Iterations</h3>
                   <Button size="sm" className="bg-black text-white rounded-xl h-9 text-[10px] font-black uppercase tracking-widest">
                     <Plus className="w-3.5 h-3.5 mr-2" /> New Task
                   </Button>
                </div>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 rounded-2xl border border-zinc-100 hover:border-zinc-300 transition-all bg-white flex items-center justify-between group shadow-soft hover:shadow-elevated">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase",
                          task.status === 'done' ? "bg-emerald-50 text-emerald-600" : "bg-zinc-50 text-zinc-400"
                        )}>
                          {task.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : '...'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black group-hover:text-blue-600 transition-colors">{task.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-tighter flex items-center gap-1">
                              <Users className="w-3 h-3" /> {task.profiles?.full_name || 'Unassigned'}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-zinc-200" />
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-tighter flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={cn(
                           "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest border shadow-sm",
                           task.priority === 'critical' ? "bg-black text-white border-black" : "bg-zinc-100 text-zinc-500 border-zinc-200"
                         )}>
                           {task.priority}
                         </span>
                         <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-zinc-300 hover:text-black">
                           <MoreHorizontal className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
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
                className="space-y-10"
              >
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 rounded-[2.5rem] bg-zinc-900 text-white space-y-4 shadow-xl">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Revenue Breakdown</p>
                    <div className="flex items-end gap-3">
                      <p className="text-4xl font-black">₹{totalRevenue.toLocaleString()}</p>
                      <span className="text-emerald-400 text-[10px] font-bold uppercase mb-1">Settled</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full" 
                        style={{ width: project.budget > 0 ? `${(totalRevenue / project.budget) * 100}%` : '0%' }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                      {project.budget > 0 ? Math.round((totalRevenue / project.budget) * 100) : 0}% of Budget Value Invoiced
                    </p>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 space-y-4">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Direct Expenditures</p>
                    <div className="flex items-end gap-3">
                      <p className="text-4xl font-black text-black">₹{totalExpense.toLocaleString()}</p>
                      <span className="text-red-500 text-[10px] font-bold uppercase mb-1">Total Costs</span>
                    </div>
                    <div className="flex gap-2">
                       {['Payroll', 'Software', 'General'].map(cat => (
                         <span key={cat} className="text-[8px] font-black px-2 py-1 bg-white border border-zinc-200 rounded-lg uppercase text-zinc-400">
                           {cat}
                         </span>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Combined Ledger */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-zinc-400" /> Transaction Ledger
                    </h3>
                    <div className="flex gap-2">
                       <Button size="sm" variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest">
                         <FileText className="w-3 h-3 mr-1.5" /> Export
                       </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Interleave Invoices and Expenses by date */}
                    {[
                      ...invoices.map(i => ({ ...i, ledgerType: 'revenue' })),
                      ...expenses.map(e => ({ ...e, ledgerType: 'expense' }))
                    ]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((entry, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          if (entry.ledgerType === 'revenue') {
                            setSelectedInvoice(entry);
                            setIsInvoiceModalOpen(true);
                          }
                        }}
                        className={cn(
                          "p-5 rounded-2xl border border-zinc-100 bg-white flex items-center justify-between group shadow-soft transition-all",
                          entry.ledgerType === 'revenue' ? "cursor-pointer hover:border-zinc-900" : ""
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            entry.ledgerType === 'revenue' 
                              ? "bg-emerald-50 text-emerald-600 group-hover:bg-zinc-900 group-hover:text-white" 
                              : "bg-zinc-50 text-zinc-400"
                          )}>
                            {entry.ledgerType === 'revenue' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-black">{entry.ledgerType === 'revenue' ? entry.notes || 'Invoiced Amount' : entry.description || 'Project Expense'}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                              {new Date(entry.created_at).toLocaleDateString()} • {entry.ledgerType}
                              {entry.ledgerType === 'revenue' && <span className="text-emerald-500 font-black tracking-tighter">(Click to View Document)</span>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className={cn("text-sm font-black", entry.ledgerType === 'revenue' ? "text-emerald-600" : "text-black")}>
                              {entry.ledgerType === 'revenue' ? '+' : '-'}₹{entry.amount?.toLocaleString()}
                            </p>
                            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter">{entry.status || 'Settled'}</span>
                          </div>
                          {entry.ledgerType === 'revenue' && <ChevronRight className="w-4 h-4 text-zinc-200 group-hover:text-black transition-all" />}
                        </div>
                      </div>
                    ))}
                    {invoices.length === 0 && expenses.length === 0 && (
                      <div className="p-12 rounded-[2rem] border-2 border-dashed border-zinc-100 text-center">
                        <CreditCard className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No financial movements recorded</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-8">
          {/* Client Identity Card */}
          <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2.5rem] bg-zinc-900 text-white">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl shadow-lg">
                  🏢
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Identity</p>
                  <p className="text-xs font-bold uppercase tracking-tighter">Registered Stakeholder</p>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-black mb-1">{project.profiles?.full_name || 'Individual Entity'}</h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Principal Project Sponsor</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-600" /> {project.profiles?.email || 'No primary email'}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-600" /> {project.profiles?.phone || 'No direct line'}
                  </div>
                  {project.profiles?.website_url && (
                    <a href={project.profiles.website_url} target="_blank" className="flex items-center gap-4 text-xs font-bold text-blue-400 hover:underline">
                      <ExternalLink className="w-4 h-4" /> visit_corporate_site
                    </a>
                  )}
                </div>
              </div>

              <Link href={`/clients/${project.client_id}`}>
                <Button className="w-full rounded-2xl bg-white text-black hover:bg-zinc-200 shadow-xl font-black uppercase text-[10px] tracking-widest h-12">
                  Launch Client Portal
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Project Parameters Card */}
          <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2.5rem] bg-white">
            <CardContent className="p-8 space-y-6">
               <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                 <LayoutGrid className="w-4 h-4 text-zinc-400" /> Infrastructure
               </h3>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                   <p className="text-[10px] font-black text-zinc-400 uppercase">Version</p>
                   <p className="text-sm font-black">v1.0.4-production</p>
                 </div>
                 <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                   <p className="text-[10px] font-black text-zinc-400 uppercase">Architecture</p>
                   <p className="text-sm font-black capitalize">{project.status} Cluster</p>
                 </div>
                 <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                   <p className="text-[10px] font-black text-zinc-400 uppercase">Deployment</p>
                   <p className="text-sm font-black">{new Date(project.created_at).toLocaleDateString()}</p>
                 </div>
               </div>

               <div className="p-6 rounded-[2rem] bg-zinc-50 border border-dashed border-zinc-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-xs font-black uppercase text-zinc-400 tracking-tighter">Internal Communications</p>
                  </div>
                  <p className="text-[11px] font-medium text-zinc-500 leading-relaxed mb-4">Team synchronization and automated notifications are operational for this stream.</p>
                  <Button variant="outline" className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest border-zinc-200">Open Channels</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Mail(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><rect width="20" height="16" x="2" y="4" rx="2"/></svg>; }
function Phone(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>; }
