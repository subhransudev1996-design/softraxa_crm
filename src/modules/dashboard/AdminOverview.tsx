"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, Users, CheckCircle2, DollarSign, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Calendar, Briefcase, Plus, Clock
} from 'lucide-react';
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
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function AdminOverview() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [stats, setStats] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, lRes, iRes] = await Promise.allSettled([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('invoices').select('amount'),
      ]);

      const projectsData = pRes.status === 'fulfilled' ? (pRes.value.data || []) : [];
      const tasksData = tRes.status === 'fulfilled' ? (tRes.value.data || []) : [];
      const leadsData = lRes.status === 'fulfilled' ? (lRes.value.data || []) : [];
      const invoicesData = iRes.status === 'fulfilled' ? (iRes.value.data || []) : [];

      const totalRevenue = invoicesData.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const today = new Date().toISOString().split('T')[0];
      const followUpsToday = leadsData.filter(l => l.follow_up_date === today).length;
      const pendingTasks = tasksData.filter(t => t.status !== 'done').length;

      setStats([
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, change: '+12%', trend: 'up', icon: DollarSign, color: 'bg-zinc-500/10 text-zinc-900' },
        { label: 'Followups Today', value: followUpsToday.toString(), change: 'Action Required', trend: 'up', icon: Clock, color: 'bg-orange-500/10 text-orange-600' },
        { label: 'Pending Tasks', value: pendingTasks.toString(), change: 'Workstation', trend: 'up', icon: CheckCircle2, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Active Projects', value: projectsData.length.toString(), change: 'Managing', trend: 'up', icon: Briefcase, color: 'bg-zinc-500/10 text-zinc-900' },
      ]);

      setProjects(projectsData.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.from('projects').insert({
        name: formData.get('name'),
        budget: parseFloat(formData.get('budget') as string) || 0,
        status: 'active'
      });
      if (!error) {
        setIsModalOpen(false);
        // Create a notification
        await supabase.from('notifications').insert({
          user_id: user?.id,
          title: 'Project Created',
          message: `New project "${formData.get('name')}" has been initialized successfully.`,
          type: 'success'
        });
        fetchDashboardData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-black flex items-center gap-3">
            Admin <span className="font-light text-zinc-400">Hub</span>
          </h1>
          <p className="text-zinc-500 font-medium">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" /> Schedule
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Project"
      >
        <form className="space-y-6" onSubmit={handleCreateProject}>
          <div className="grid grid-cols-1 gap-6">
            <Input name="name" label="Project Name" placeholder="e.g. Enterprise CRM" required />
            <Input name="budget" label="Budget" type="number" placeholder="₹0.00" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : (
        <>
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, idx) => (
              <motion.div key={idx} variants={item}>
                <Card className="hover:shadow-elevated transition-all duration-300 border-zinc-100 group">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className={cn("p-2.5 rounded-2xl", stat.color)}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className={cn(
                        "flex items-center text-[11px] font-bold px-2 py-1 rounded-lg",
                        stat.trend === 'up' ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
                      )}>
                        {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {stat.change}
                      </div>
                    </div>
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-4">{stat.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-zinc-900 group-hover:scale-105 transition-transform origin-left">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-zinc-100 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-black rounded-full" />
                  <CardTitle className="text-lg font-bold">Project Progress</CardTitle>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-5 h-5 text-zinc-400" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projects.length === 0 ? (
                    <div className="text-center py-10 text-zinc-400 text-sm italic">No projects active.</div>
                  ) : projects.map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-lg shadow-soft border border-zinc-200">
                          🏢
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black mb-1">{p.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{p.end_date ? `Due ${new Date(p.end_date).toLocaleDateString()}` : 'No deadline'}</span>
                            <div className="h-1 w-1 rounded-full bg-zinc-300" />
                            <span className="capitalize">{p.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                          <div className="h-full bg-black rounded-full transition-all" style={{ width: `${p.completion_percentage}%` }} />
                        </div>
                        <span className="text-xs font-bold text-black">{p.completion_percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-100 shadow-soft overflow-hidden">
              <CardHeader className="bg-zinc-900 text-white pb-6 pt-8">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-zinc-400" />
                  Activity Stream
                </CardTitle>
                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest mt-1">Live Updates</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-100">
                  {[
                    { text: 'Dashboard synchronized with database', time: 'Just now' },
                    { text: 'Real-time project tracking enabled', time: '1m ago' },
                    { text: 'Financial ledger online', time: '2m ago' },
                  ].map((activity, i) => (
                    <div key={i} className="pl-6 relative group">
                      <div className="absolute left-[3px] top-1.5 w-2 h-2 rounded-full bg-zinc-200 border-2 border-white ring-1 ring-zinc-300 group-hover:bg-black transition-colors" />
                      <p className="text-xs text-zinc-600 font-medium leading-tight group-hover:text-black transition-colors">{activity.text}</p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-tighter">{activity.time}</p>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-8 text-[11px] font-bold text-zinc-400 hover:text-black hover:bg-zinc-50 border-t border-zinc-50 rounded-none h-12 uppercase tracking-widest">
                  View All History
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
