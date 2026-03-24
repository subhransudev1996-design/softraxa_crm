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
  Award, TrendingUp, History, ShieldCheck, Target,
  Star, Zap, Trophy, Flame
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
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function EmployeeDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [employee, setEmployee] = React.useState<any>(null);
  const [addedLeads, setAddedLeads] = React.useState<any[]>([]);
  const [wonLeads, setWonLeads] = React.useState<any[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('leads');
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);

  const fetchEmployeeData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, addedLeadsRes, wonLeadsRes, tasksRes] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('leads').select('*').eq('created_by', id).order('created_at', { ascending: false }),
        supabase.from('leads').select('*').eq('converted_by', id).eq('status', 'won').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*, projects(name)').eq('assignee_id', id).order('created_at', { ascending: false })
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        setEmployee(profileRes.value.data);
      }
      if (addedLeadsRes.status === 'fulfilled' && addedLeadsRes.value.data) {
        setAddedLeads(addedLeadsRes.value.data);
      }
      if (wonLeadsRes.status === 'fulfilled' && wonLeadsRes.value.data) {
        setWonLeads(wonLeadsRes.value.data);
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.data) {
        setTasks(tasksRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching employee data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (id) fetchEmployeeData();
  }, [id, fetchEmployeeData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-zinc-300" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Profile not found</p>
        <Button onClick={() => router.back()} variant="outline" className="rounded-xl">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-20">
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Employee Profile"
      >
        <form 
          className="space-y-6" 
          onSubmit={async (e) => {
            e.preventDefault();
            setUpdating(true);
            const formData = new FormData(e.currentTarget);
            const fullName = formData.get('full_name') as string;
            const phone = formData.get('phone') as string;
            
            const { error } = await supabase
              .from('profiles')
              .update({ 
                full_name: fullName,
                phone: phone
              })
              .eq('id', id);

            if (!error) {
              setEmployee({ ...employee, full_name: fullName, phone: phone });
              setIsEditModalOpen(false);
              alert('Profile updated successfully!');
            } else {
              alert(error.message);
            }
            setUpdating(false);
          }}
        >
          <div className="space-y-4">
            <Input 
              name="full_name" 
              label="Full Name" 
              defaultValue={employee.full_name} 
              placeholder="e.g. Sarah Williams" 
              required 
            />
            <Input 
              name="phone" 
              label="Phone Number" 
              defaultValue={employee.phone} 
              placeholder="+91 99999 99999" 
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={updating} className="flex-1 shadow-elevated">
              {updating ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all shadow-soft">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2.5rem] bg-zinc-900 text-white flex items-center justify-center text-2xl font-black shadow-2xl relative overflow-hidden group">
               {employee.avatar_url ? (
                 <img src={employee.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
               ) : (
                 employee.full_name?.charAt(0).toUpperCase()
               )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-black">{employee.full_name}</h1>
                <span className={cn(
                  "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border shadow-sm",
                  employee.role === 'admin' ? "bg-black text-white" : "bg-zinc-50 text-zinc-500"
                )}>
                  {employee.role}
                </span>
              </div>
              <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Level {employee.level || 1} • Strategic Member
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl h-11 border-zinc-200 shadow-sm font-bold uppercase text-[10px] tracking-widest"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Pencil className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        </div>
      </header>

      {/* Gamification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Contribution', value: `${employee.points || 0} XP`, icon: Zap, color: 'text-zinc-900', trend: 'Global XP' },
          { label: 'Won Leads', value: wonLeads.length.toString(), icon: Trophy, color: 'text-emerald-600', trend: 'Success' },
          { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'done').length.toString(), icon: Activity, color: 'text-blue-600', trend: 'Ongoing' },
          { label: 'Leads Sourced', value: addedLeads.length.toString(), icon: Target, color: 'text-purple-600', trend: 'Pipeline' },
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
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="flex gap-8 border-b border-zinc-100 px-2 overflow-x-auto scrollbar-hide">
            {['leads', 'tasks', 'activity'].map((tab) => (
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
                  <motion.div layoutId="emp-tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'leads' && (
              <motion.div
                key="leads"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Won Leads Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-emerald-500" /> Successfully Closed
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wonLeads.map(lead => (
                      <Link key={lead.id} href={`/crm/${lead.id}`} className="p-5 rounded-3xl border border-zinc-100 bg-emerald-50/30 group hover:border-emerald-500 transition-all flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-black group-hover:translate-x-1 transition-transform">{lead.company || lead.name}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Value: ₹{lead.value?.toLocaleString()}</p>
                        </div>
                        <Award className="w-5 h-5 text-emerald-500" />
                      </Link>
                    ))}
                    {wonLeads.length === 0 && (
                      <p className="text-[10px] font-bold text-zinc-300 uppercase py-4">No deals closed yet</p>
                    )}
                  </div>
                </div>

                {/* Sourced Leads Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" /> Recently Sourced
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addedLeads.map(lead => (
                      <Link key={lead.id} href={`/crm/${lead.id}`} className="p-5 rounded-3xl border border-zinc-100 bg-white group hover:border-zinc-900 transition-all flex items-center justify-between shadow-soft">
                        <div>
                          <p className="text-sm font-bold text-black group-hover:translate-x-1 transition-transform">{lead.company || lead.name}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{lead.status} • {new Date(lead.created_at).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-200 group-hover:text-black transition-all" />
                      </Link>
                    ))}
                    {addedLeads.length === 0 && (
                      <p className="text-[10px] font-bold text-zinc-300 uppercase py-4">No leads sourced yet</p>
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
                <div className="grid grid-cols-1 gap-4">
                  {tasks.map(task => (
                    <div key={task.id} className="p-6 rounded-3xl border border-zinc-100 bg-white shadow-soft flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg",
                          task.status === 'done' ? "bg-emerald-500" : "bg-zinc-900"
                        )}>
                          {task.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black">{task.title}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{task.projects?.name} • Due {new Date(task.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-black">{task.progress || 0}%</p>
                        <div className="w-24 h-1.5 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-black rounded-full" style={{ width: `${task.progress || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
                      <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">No assigned operations</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                 <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                    {wonLeads.map(l => (
                      <div key={l.id} className="flex gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center relative z-10 shadow-sm text-white">
                          <Trophy className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-black">Conversion Victory</p>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase">Won deal for {l.company}</p>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase">{new Date(l.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                    {addedLeads.slice(0, 5).map(l => (
                      <div key={l.id} className="flex gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center relative z-10 shadow-sm text-white">
                          <Plus className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-black">New Lead Registered</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Added {l.company} to pipeline</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-8">
          {/* Identity Card */}
          <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2.5rem] bg-zinc-900 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <CardContent className="p-8 space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl shadow-lg border border-white/10">
                  ⚡
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Growth Phase</p>
                  <p className="text-xs font-bold uppercase tracking-tighter">Level {employee.level || 1} Elite</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-black mb-1 leading-tight">{employee.full_name}</h4>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{employee.role} Access Status</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-600" /> {employee.email || 'No email registered'}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-600" /> {employee.phone || 'No phone registered'}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <Calendar className="w-4 h-4 text-zinc-600" /> Joined {new Date(employee.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-zinc-600" /> Status: {employee.status || 'Active'}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Performance Score</p>
                  <p className="text-[10px] font-bold uppercase">{employee.points || 0} XP</p>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-white rounded-full" style={{ width: `${( (employee.points || 0) % 100 )}%` }} />
                </div>
              </div>

              <Button className="w-full rounded-2xl bg-white text-black hover:bg-zinc-200 shadow-xl font-black uppercase text-[10px] tracking-widest h-12">
                Conduct Performance Review
              </Button>
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2.5rem] bg-white">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                 {[
                   { label: 'Closer', color: 'bg-emerald-100 text-emerald-700', icon: Trophy, active: wonLeads.length > 0 },
                   { label: 'Hunter', color: 'bg-purple-100 text-purple-700', icon: Target, active: addedLeads.length > 5 },
                   { label: 'Grinder', color: 'bg-blue-100 text-blue-700', icon: Zap, active: tasks.length > 10 },
                   { label: 'Early Bird', color: 'bg-amber-100 text-amber-700', icon: Clock, active: true },
                 ].map((badge, i) => (
                   <div key={i} className={cn(
                     "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                     badge.active ? badge.color : "bg-zinc-50 text-zinc-300 border border-zinc-100 opacity-50 grayscale"
                   )}>
                     <badge.icon className="w-3 h-3" />
                     {badge.label}
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
