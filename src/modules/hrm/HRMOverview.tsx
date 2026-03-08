"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Plus, Search, Filter, MoreHorizontal, Calendar, Award, UserCheck, ShieldCheck, ChevronRight, Trash2, Ban, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
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

export function HRMOverview() {
  const { user, profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('all');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) setEmployees(data || []);
      else alert(error.message);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('full_name') as string;
    const role = formData.get('role') as string;
    
    try {
      // Use signUp to create a real Auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });

      if (!error && data.user) {
        // Explicitly update the profile to ensure the role is set correctly, 
        // bypassing any trigger defaults or delays
        await supabase
          .from('profiles')
          .update({ 
            role: role,
            full_name: fullName 
          })
          .eq('id', data.user.id);

        alert(`Account created successfully for ${fullName}! Assigned Role: ${role.toUpperCase()}`);
        setIsModalOpen(false);
        fetchEmployees();
      } else if (error) {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockUser = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    if (!confirm(`Are you sure you want to ${newStatus === 'blocked' ? 'block' : 'unblock'} this user?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (!error) {
        fetchEmployees();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('CRITICAL ACTION: This will permanently delete the user account and all their profile data. They will no longer be able to log in. Are you sure?')) return;

    try {
      const { error } = await supabase.rpc('delete_user', { target_user_id: id });

      if (!error) {
        alert('User has been permanently deleted from the system.');
        fetchEmployees();
      } else {
        alert(`Deletion Failed: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred during deletion.');
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            Human <span className="font-light text-zinc-400">Resources</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Managing {employees.length} team members and operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95">
            <Plus className="w-4 h-4 mr-2" /> Invite Member
          </Button>
        </div>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Invite New Team Member"
      >
        <form className="space-y-6" onSubmit={handleInvite}>
          <div className="space-y-4">
            <Input name="full_name" label="Full Name" placeholder="e.g. Sarah Williams" required />
            <Input name="email" label="Email Address" type="email" placeholder="colleague@softraxa.com" required />
            <Input name="password" label="Temporary Password" type="password" placeholder="••••••••" required />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Assigned Role</label>
              <select name="role" className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400">
                <option value="employee">Employee</option>
                <option value="pm">Project Manager</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated">
              {submitting ? 'Creating Account...' : 'Create Member Account'}
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
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { label: 'Total Team', value: employees.length.toString(), icon: Users },
              { label: 'Admins', value: employees.filter(e => e.role === 'admin').length.toString(), icon: ShieldCheck },
              { label: 'Managers', value: employees.filter(e => e.role === 'pm').length.toString(), icon: UserCheck },
              { label: 'Members', value: employees.filter(e => e.role === 'member').length.toString(), icon: UserCheck },
              { label: 'Avg. Level', value: (employees.length > 0 ? (employees.reduce((sum, e) => sum + (e.level || 1), 0) / employees.length).toFixed(1) : '0'), icon: Award },
            ].map((stat, i) => (
              <motion.div key={i} variants={item}>
                <Card className="border-zinc-100 shadow-soft">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center mb-4">
                      <stat.icon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <p className="text-2xl font-black text-black">{stat.value}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-2">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Team Directory</div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64 group">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search members..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-4 focus:ring-black/5 outline-none transition-all"
                  />
                </div>
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-10 px-4 bg-white border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-black/5 transition-all"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="pm">Managers</option>
                  <option value="employee">Employees</option>
                  <option value="member">Members</option>
                  <option value="client">Clients</option>
                </select>
              </div>
            </div>

            <Card className="border-zinc-100 shadow-soft overflow-hidden">
              <div className="divide-y divide-zinc-50">
                {employees
                  .filter(e => {
                    const matchesRole = roleFilter === 'all' || e.role === roleFilter;
                    const matchesSearch = e.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesRole && matchesSearch;
                  })
                  .map((employee) => (
                  <Link key={employee.id} href={`/hrm/${employee.id}`}>
                    <div className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-3xl border-2 border-white bg-zinc-100 overflow-hidden shadow-soft flex items-center justify-center text-xs font-bold text-zinc-400 uppercase relative">
                          {employee.avatar_url ? <img src={employee.avatar_url} alt="" /> : employee.full_name?.charAt(0)}
                          {employee.status === 'blocked' && (
                            <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[1px] flex items-center justify-center">
                              <Ban className="w-5 h-5 text-red-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-black group-hover:text-zinc-500 transition-colors">{employee.full_name}</h3>
                            {employee.status === 'blocked' && (
                              <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Blocked</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase">
                            <span>{employee.role}</span>
                            <div className="w-1 h-1 rounded-full bg-zinc-200" />
                            <span>Joined {new Date(employee.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {profile?.role === 'admin' && employee.id !== user?.id && (
                          <div className="flex items-center gap-2 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBlockUser(employee.id, employee.status); }}
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                employee.status === 'blocked' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-zinc-50 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                              )}
                              title={employee.status === 'blocked' ? "Unblock User" : "Block User"}
                            >
                              {employee.status === 'blocked' ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteUser(employee.id); }}
                              className="w-8 h-8 rounded-lg bg-zinc-50 text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all"
                              title="Delete User Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-xs font-bold text-black">Level {employee.level || 1}</p>
                          <p className="text-[10px] text-zinc-400 uppercase font-bold">{employee.points || 0} XP</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-black transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
