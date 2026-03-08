"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Star, Target, Zap, ShieldCheck, TrendingUp, ChevronRight, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/modules/auth/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

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

const levelMilestones = [
  { level: 1, name: 'Novice', minXp: 0, maxXp: 500 },
  { level: 2, name: 'Specialist', minXp: 501, maxXp: 1500 },
  { level: 3, name: 'Expert', minXp: 1501, maxXp: 3500 },
  { level: 4, name: 'Master', minXp: 3501, maxXp: 7000 },
  { level: 5, name: 'Legend', minXp: 7001, maxXp: 15000 },
];

export function GamificationOverview() {
  const { profile } = useAuth();
  const [leaderboard, setLeaderboard] = React.useState<any[]>([]);
  const [achievements, setAchievements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchGamificationData = async () => {
    setLoading(true);
    try {
      const [leaderboardRes, tasksRes, wikiRes] = await Promise.allSettled([
        supabase.from('profiles')
          .select('*')
          .eq('role', 'employee')
          .order('points', { ascending: false })
          .limit(10),
        supabase.from('tasks').select('id, status').eq('assignee_id', profile?.id),
        supabase.from('wiki_articles').select('id').eq('author_id', profile?.id),
      ]);
      
      if (leaderboardRes.status === 'fulfilled') setLeaderboard(leaderboardRes.value.data || []);
      
      // Calculate dynamic achievements
      const userAchievements = [];
      if (tasksRes.status === 'fulfilled') {
        const completedCount = tasksRes.value.data?.filter(t => t.status === 'done').length || 0;
        if (completedCount >= 1) userAchievements.push({ name: 'First Milestone', xp: '+10 XP', desc: 'Completed your first official task', icon: '🎯' });
        if (completedCount >= 10) userAchievements.push({ name: 'Reliable Architect', xp: '+100 XP', desc: 'Completed 10 major project tasks', icon: '🏗️' });
      }
      if (wikiRes.status === 'fulfilled') {
        const wikiCount = wikiRes.value.data?.length || 0;
        if (wikiCount >= 1) userAchievements.push({ name: 'Knowledge Sharer', xp: '+50 XP', desc: 'Published your first wiki article', icon: '📚' });
      }
      
      // Fallback achievements if user is new
      if (userAchievements.length === 0) {
        userAchievements.push({ name: 'Welcome Aboard', xp: '+5 XP', desc: 'Joined the Softraxa CRM ecosystem', icon: '✨' });
      }
      
      setAchievements(userAchievements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (profile?.id) fetchGamificationData();
  }, [profile?.id]);

  const currentLevelInfo = levelMilestones.find(m => (profile?.points || 0) <= m.maxXp) || levelMilestones[levelMilestones.length - 1];
  const progress = Math.min(100, Math.round(((profile?.points || 0) - currentLevelInfo.minXp) / (currentLevelInfo.maxXp - currentLevelInfo.minXp) * 100));
  const userRank = leaderboard.findIndex(e => e.id === profile?.id) + 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em]">Calculating Glory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            Company <span className="font-light text-zinc-400">Hall of Fame</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Track levels, points, and unlock achievements.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3 pr-2">
            {leaderboard.slice(0, 4).map((user) => (
              <div key={user.id} className="w-10 h-10 rounded-2xl border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400 overflow-hidden shadow-soft" title={user.full_name}>
                {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} /> : <span>{user.full_name?.charAt(0)}</span>}
              </div>
            ))}
          </div>
          <span className="text-xs font-bold text-zinc-500 pr-2">Top Performers</span>
          <Button className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95">
            <Award className="w-4 h-4 mr-2" /> Global Leaderboard
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-1 space-y-6">
          <motion.div variants={item}>
            <Card className="bg-zinc-900 text-white border-none shadow-elevated relative overflow-hidden group p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl group-hover:bg-white/10 transition-colors" />
              <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-zinc-800 flex items-center justify-center text-3xl shadow-soft ring-1 ring-zinc-700 border-2 border-white/5">
                  {profile?.points && profile.points > 1000 ? '👑' : '🏆'}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">My Current Level</h2>
                  <p className="text-6xl font-black">{profile?.level || 1}</p>
                </div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                    <span>{currentLevelInfo.name}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-white rounded-full" />
                  </div>
                </div>
                <div className="pt-4 flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xl font-bold">{profile?.points || 0}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Total XP</p>
                  </div>
                  <div className="w-px h-8 bg-zinc-800" />
                  <div className="text-center">
                    <p className="text-xl font-bold">{userRank > 0 ? `#${userRank}` : 'Unranked'}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Global Rank</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-zinc-100 shadow-soft">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400">Level Progression Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {levelMilestones.slice(0, 4).map((l, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    profile?.level === l.level ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white border-zinc-100 text-zinc-400"
                  )}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">Lvl {l.level}</span>
                      <span className="text-xs font-medium uppercase tracking-widest">{l.name}</span>
                    </div>
                    <span className="text-[10px] font-bold">{l.minXp}-{l.maxXp} XP</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Achievement Unlocks</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((a, i) => (
                <motion.div key={i} variants={item}>
                  <Card className="hover:shadow-soft border-zinc-100 group cursor-pointer transition-all hover:border-zinc-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-2xl shadow-inner border border-zinc-100">
                          {a.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-sm font-bold text-black mb-1 group-hover:text-zinc-500 transition-colors">{a.name}</h3>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{a.xp}</span>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium">{a.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Leaderboard Elite</div>
            <Card className="border-zinc-100 shadow-soft overflow-hidden">
              <div className="divide-y divide-zinc-50">
                {leaderboard.map((user, i) => (
                  <div key={user.id} className={cn(
                    "p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer group",
                    user.id === profile?.id ? "bg-zinc-50/50" : ""
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-xs font-black text-zinc-300 group-hover:text-black">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </div>
                      <div className="w-10 h-10 rounded-2xl border border-zinc-200 overflow-hidden shadow-soft flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
                        {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{user.full_name?.charAt(0)}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-black group-hover:text-zinc-500 transition-colors">
                          {user.full_name} {user.id === profile?.id && <span className="text-[10px] font-black text-emerald-500 ml-2 uppercase tracking-tighter">(You)</span>}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Level {user.level || 1} • {user.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-sm font-black text-black">{user.points || 0}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Lifetime XP</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
