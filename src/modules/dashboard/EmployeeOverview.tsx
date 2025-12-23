import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Trophy,
    Calendar,
    ChevronRight,
    Star,
    Activity
} from "lucide-react";
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';

const EmployeeOverview: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        reviewCount: 0,
        weeklyHours: 0,
        pointsProgress: 0
    });
    const [activeTasks, setActiveTasks] = useState<any[]>([]);
    const [deadlines, setDeadlines] = useState<any[]>([]);

    useEffect(() => {
        if (!profile?.id) return;
        fetchEmployeeData();
    }, [profile?.id]);

    const fetchEmployeeData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Tasks to Review
            const { count: reviewCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('reviewer_id', profile?.id)
                .eq('status', 'review');

            // 2. Fetch Weekly Hours
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const { data: logs } = await supabase
                .from('time_logs')
                .select('duration_seconds')
                .eq('user_id', profile?.id)
                .gte('start_time', startOfWeek.toISOString());

            const totalSeconds = logs?.reduce((acc, log) => acc + (log.duration_seconds || 0), 0) || 0;
            const weeklyHours = totalSeconds / 3600;

            // 3. Fetch Active Tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*, projects(name)')
                .eq('assignee_id', profile?.id)
                .in('status', ['todo', 'in_progress'])
                .order('due_date', { ascending: true })
                .limit(3);

            // 4. Fetch Upcoming Deadlines
            const { data: deadlineTasks } = await supabase
                .from('tasks')
                .select('title, due_date')
                .eq('assignee_id', profile?.id)
                .is('status', 'in_progress')
                .not('due_date', 'is', null)
                .gt('due_date', new Date().toISOString())
                .order('due_date', { ascending: true })
                .limit(2);

            setStats({
                reviewCount: reviewCount || 0,
                weeklyHours,
                pointsProgress: ((profile?.points || 0) % 100) // Simple logic for % to next level
            });
            setActiveTasks(tasks || []);
            setDeadlines(deadlineTasks || []);

        } catch (error) {
            console.error('Error fetching employee dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Welcome Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-light tracking-tight text-black">
                        Good Morning, <span className="font-semibold text-gray-400">{profile?.full_name?.split(' ')[0] || 'Team Mate'}</span>
                    </h1>
                    <p className="text-gray-400 italic font-medium">"Focus on progress, not perfection."</p>
                </div>

                {/* Personal Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Trophy className="w-20 h-20 text-white" />
                        </div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Points</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold">{profile?.points || 0}</p>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level {profile?.level || 1}</span>
                            </div>
                            <div className="mt-4 w-full bg-white/10 rounded-full h-1">
                                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${stats.pointsProgress}%` }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl group hover:border-black transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Tasks to Review</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-black">{stats.reviewCount.toString().padStart(2, '0')}</p>
                                <p className="text-xs text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded-full">Pending Action</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl group hover:border-black transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Weekly Hours</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2 text-black">
                                <p className="text-3xl font-bold">{stats.weeklyHours.toFixed(1)}h</p>
                                <p className="text-xs text-gray-400">/ 40h goal</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Focus Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* My Active Tasks */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-black flex items-center gap-2">
                                <Activity className="w-5 h-5" /> My Active Tasks
                            </h3>
                            <button className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest">View All</button>
                        </div>

                        <div className="space-y-4">
                            {activeTasks.length > 0 ? activeTasks.map((task, idx) => (
                                <div key={idx} className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-black transition-all cursor-pointer shadow-sm shadow-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${task.priority === 'critical' || task.priority === 'high' ? 'bg-red-500' :
                                            task.priority === 'medium' ? 'bg-black' : 'bg-gray-200'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-bold text-black leading-tight">{task.title}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{task.projects?.name || 'No Project'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Due</p>
                                            <p className={`text-xs font-bold ${new Date(task.due_date).toDateString() === new Date().toDateString() ? 'text-red-500' : 'text-black'}`}>
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'No Date'}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-all" />
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400 italic">No active tasks assigned.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Achievement Road */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-black flex items-center gap-2">
                            <Star className="w-5 h-5 text-black" /> Achievements
                        </h3>
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm shadow-gray-50 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 transform rotate-12 group hover:rotate-0 transition-all">
                                <Trophy className="w-8 h-8 text-black" />
                            </div>
                            <h4 className="text-sm font-bold text-black uppercase tracking-widest">Early Adopter Badge</h4>
                            <p className="text-xs text-gray-400 mt-2 max-w-[200px]">You've earned this for being one of the first employees in our system!</p>
                            <div className="mt-6 flex gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100" />
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100" />
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 border-dashed text-gray-300 text-[8px] font-bold">LOCKED</div>
                            </div>
                        </div>

                        <div className="p-6 bg-black rounded-2xl text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <h4 className="text-xs font-bold uppercase tracking-widest">Upcoming Deadlines</h4>
                            </div>
                            <div className="space-y-3">
                                {deadlines.length > 0 ? deadlines.map((dl, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 font-medium truncate max-w-[150px]">{dl.title}</span>
                                        <span className="font-bold">{new Date(dl.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                )) : (
                                    <p className="text-[10px] text-gray-500 italic">No immediate deadlines.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeOverview;
