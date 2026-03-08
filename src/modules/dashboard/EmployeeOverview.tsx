"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Trophy, Star, CheckCircle2, Zap, 
  ArrowRight, ShieldCheck, Target, Flame 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/modules/auth/AuthContext';
import { cn } from '@/lib/utils';

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

export function EmployeeOverview() {
  const { profile } = useAuth();

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
            <Zap className="w-3 h-3" /> System Online
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            My <span className="font-light text-zinc-400">Workspace</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}. You have 5 tasks to review today.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-zinc-100 shadow-soft">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Team" />
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-zinc-500 pr-2">Team Online</p>
        </div>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={item} className="lg:col-span-1">
          <Card className="h-full bg-zinc-900 text-white border-none shadow-elevated relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl group-hover:bg-white/10 transition-colors" />
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Total Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-5xl font-black mb-1">{profile?.level || 1}</p>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Current Level</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold mb-1">{profile?.points || 0}</p>
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Points earned</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-tighter">
                  <span className="text-zinc-400">Next Level</span>
                  <span>75%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-white rounded-full" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
                  <Flame className="w-4 h-4 text-zinc-400 mb-2" />
                  <p className="text-lg font-bold">12</p>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Day Streak</p>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
                  <Star className="w-4 h-4 text-zinc-400 mb-2" />
                  <p className="text-lg font-bold">#4</p>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase">Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border-zinc-100 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold">Focus Tasks</CardTitle>
              </div>
              <Button variant="ghost" className="text-xs font-bold text-zinc-400 hover:text-black">
                View Board <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Update Brand Guidelines', project: 'Softraxa Rebrand', priority: 'High', due: 'Today' },
                  { title: 'Fix Auth Race Condition', project: 'CRM Core', priority: 'Critical', due: 'In 2h' },
                  { title: 'Client Meeting Prep', project: 'Acme Corp', priority: 'Medium', due: 'Tomorrow' },
                  { title: 'Documentation Review', project: 'Wiki', priority: 'Low', due: 'Fri' },
                ].map((task, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-zinc-50 bg-zinc-50/50 hover:bg-white hover:shadow-soft hover:border-zinc-200 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <div className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest",
                        task.priority === 'Critical' ? "bg-zinc-900 text-white" : 
                        task.priority === 'High' ? "bg-zinc-200 text-zinc-900" : "bg-zinc-100 text-zinc-600"
                      )}>
                        {task.priority}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{task.due}</span>
                    </div>
                    <p className="text-sm font-bold text-black group-hover:text-zinc-500 transition-colors mb-1">{task.title}</p>
                    <p className="text-[11px] text-zinc-500 font-medium">{task.project}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-zinc-100 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-zinc-900" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {[
                { name: 'Fast Learner', desc: 'Completed 5 wiki articles', icon: '📚' },
                { name: 'Bug Hunter', desc: 'Fixed a critical issue', icon: '🐛' },
                { name: 'Team Player', desc: 'Reviewed 10 tasks', icon: '🤝' },
                { name: 'Early Bird', desc: 'Clocked in on time for a week', icon: '🌅' },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:scale-105 transition-transform cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-xl shadow-inner">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">{badge.name}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
