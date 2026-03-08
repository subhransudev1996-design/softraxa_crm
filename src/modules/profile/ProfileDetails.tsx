"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { User, Mail, Shield, Trophy, MapPin, Briefcase, Calendar, Edit3, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/modules/auth/AuthContext';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export function ProfileDetails() {
  const { profile, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [stats, setStats] = React.useState({
    tasksDone: 0,
    wikiEdits: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch real task count
        const { count: tasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assignee_id', user.id)
          .eq('status', 'completed');

        // Fetch attendance count
        const { count: attendanceCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats({
          tasksDone: tasksCount || 0,
          wikiEdits: 0, // Placeholder until wiki logic is fully implemented
          attendanceRate: attendanceCount ? Math.min(100, (attendanceCount / 22) * 100) : 0 // Assuming 22 working days avg
        });
      } catch (err) {
        console.error('Error fetching profile stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.get('full_name'),
          avatar_url: formData.get('avatar_url'),
        })
        .eq('id', user?.id);

      if (!error) {
        setIsModalOpen(false);
        window.location.reload(); // Refresh to update context
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            My <span className="font-light text-zinc-400">Profile</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Personal details and workspace stats.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95">
          <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
        </Button>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Update Profile"
      >
        <form className="space-y-6" onSubmit={handleUpdateProfile}>
          <div className="space-y-4">
            <Input name="full_name" label="Full Name" defaultValue={profile?.full_name || ''} required />
            <Input name="avatar_url" label="Avatar URL" placeholder="https://..." defaultValue={profile?.avatar_url || ''} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated">
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-zinc-100 shadow-soft overflow-hidden">
            <div className="h-32 bg-zinc-900 relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-elevated overflow-hidden border-4 border-white">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="absolute bottom-0 right-0 w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-elevated opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <CardContent className="pt-16 pb-8 text-center">
              <h2 className="text-xl font-black text-black mb-1">{profile?.full_name || 'Softraxa User'}</h2>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">{profile?.role || 'Guest'}</p>
              <div className="flex items-center justify-center gap-2">
                <div className="px-3 py-1 rounded-full bg-zinc-100 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-200">
                  Level {profile?.level || 1}
                </div>
                <div className="px-3 py-1 rounded-full bg-black text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                  {profile?.points || 0} XP
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-100 shadow-soft">
            <CardHeader>
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Tasks Done', value: stats.tasksDone.toString(), icon: Trophy },
                { label: 'Wiki Edits', value: stats.wikiEdits.toString(), icon: Briefcase },
                { label: 'Attendance', value: `${Math.round(stats.attendanceRate)}%`, icon: Calendar },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <stat.icon className="w-4 h-4 text-zinc-300" />
                    <span className="text-xs font-medium text-zinc-500">{stat.label}</span>
                  </div>
                  <span className="text-xs font-black text-black">{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="border-zinc-100 shadow-soft">
            <CardHeader className="border-b border-zinc-50 pb-6 mb-6">
              <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: 'Full Name', value: profile?.full_name || 'N/A', icon: User },
                  { label: 'Email Address', value: user?.email || 'N/A', icon: Mail },
                  { label: 'Account Status', value: profile?.status?.toUpperCase() || 'ACTIVE', icon: Shield },
                  { label: 'System Role', value: profile?.role?.toUpperCase() || 'EMPLOYEE', icon: Shield },
                ].map((info, i) => (
                  <div key={i} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <info.icon className="w-3 h-3" />
                      {info.label}
                    </label>
                    <p className="text-sm font-bold text-black border-b border-zinc-100 pb-2">{info.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-100 shadow-soft">
            <CardHeader className="border-b border-zinc-50 pb-6 mb-6">
              <CardTitle className="text-lg font-bold">Workspace Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div>
                    <p className="text-sm font-bold text-black">Automatic Notifications</p>
                    <p className="text-xs text-zinc-500 font-medium">Receive real-time alerts for task updates.</p>
                  </div>
                  <div className="w-10 h-5 bg-black rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div>
                    <p className="text-sm font-bold text-black">Public Activity Stream</p>
                    <p className="text-xs text-zinc-500 font-medium">Allow teammates to see your achievements.</p>
                  </div>
                  <div className="w-10 h-5 bg-zinc-200 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
