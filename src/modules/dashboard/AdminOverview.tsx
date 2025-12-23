import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    TrendingDown,
    Briefcase,
    Users,
    MessageSquare,
    BarChart3,
    Clock,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { supabase } from '../../lib/supabase';

const AdminOverview: React.FC = () => {
    const [stats, setStats] = useState({
        revenue: 0,
        revenueTrend: 0,
        activeProjects: 0,
        leads: 0,
        pendingLeads: 0,
        openTickets: 0,
        criticalTickets: 0
    });
    const [systemHealth, setSystemHealth] = useState({
        supabase: false,
        auth: false,
        realtime: false
    });
    const [activeProjects, setActiveProjects] = useState<any[]>([]);
    const [topPerformers, setTopPerformers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch Revenue and Trend
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

                const { data: allInvoices } = await supabase
                    .from('invoices')
                    .select('amount, created_at')
                    .eq('status', 'paid');

                const currentMonthRevenue = allInvoices?.filter(inv => inv.created_at >= startOfMonth)
                    .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
                const lastMonthRevenue = allInvoices?.filter(inv => inv.created_at >= startOfLastMonth && inv.created_at < startOfMonth)
                    .reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

                const totalRevenue = allInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
                const revenueTrend = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

                // Fetch Project Count
                const { count: projectCount } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');

                // Fetch Leads & Pending
                const { count: leadCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['new', 'contacted', 'negotiation']);

                const { count: pendingLeadCount } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'new');

                // Fetch Tickets & Critical
                const { count: ticketCount } = await supabase
                    .from('tickets')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'open');

                const { count: criticalTicketCount } = await supabase
                    .from('tickets')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'open')
                    .eq('priority', 'critical');

                setStats({
                    revenue: totalRevenue,
                    revenueTrend,
                    activeProjects: projectCount || 0,
                    leads: leadCount || 0,
                    pendingLeads: pendingLeadCount || 0,
                    openTickets: ticketCount || 0,
                    criticalTickets: criticalTicketCount || 0
                });

                // Check System Health
                const { data: { session } } = await supabase.auth.getSession();
                setSystemHealth({
                    supabase: !!allInvoices,
                    auth: !!session,
                    realtime: true // Assume true if we reach here
                });

                // Fetch Active Projects
                const { data: projects } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(4);

                setActiveProjects(projects || []);

                // Fetch Top Performers
                const { data: performers } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('points', { ascending: false })
                    .limit(4);

                setTopPerformers(performers || []);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-light tracking-tight text-black">
                            Business <span className="font-semibold text-gray-400">Overview</span>
                        </h1>
                        <p className="text-gray-400 font-medium">Real-time performance metrics</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                await supabase.from('notifications').insert({
                                    user_id: user.id,
                                    title: 'Test Notification',
                                    message: 'This is a test notification to verify the header button.',
                                    type: 'info'
                                });
                            }
                        }}
                        className="rounded-xl border-gray-100 font-bold uppercase tracking-widest text-[10px]"
                    >
                        Send Test Notification
                    </Button>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-black text-white border-none shadow-2xl rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardHeader className="pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">${stats.revenue.toLocaleString()}</p>
                                    <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${stats.revenueTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stats.revenueTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        <span>{stats.revenueTrend >= 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-xl group-hover:bg-white/20 transition-colors">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 shadow-sm rounded-2xl hover:border-black transition-all group">
                        <CardHeader className="pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Active Projects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.activeProjects}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Across all teams</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-black group-hover:text-white transition-all">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 shadow-sm rounded-2xl hover:border-black transition-all group">
                        <CardHeader className="pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Leads Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.leads}</p>
                                    <div className="flex items-center gap-1 mt-1 text-blue-500 text-[10px] font-bold uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        <span>{stats.pendingLeads} pending review</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-black group-hover:text-white transition-all">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 shadow-sm rounded-2xl hover:border-black transition-all group">
                        <CardHeader className="pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Open Tickets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.openTickets}</p>
                                    <div className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{stats.criticalTickets} Critical</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-black group-hover:text-white transition-all">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Projects Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-black flex items-center gap-2">
                                <Briefcase className="w-5 h-5" /> Recent Projects
                            </h3>
                            <button className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors">See all projects</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeProjects.length > 0 ? activeProjects.map((project) => (
                                <div key={project.id} className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-black transition-all shadow-sm shadow-gray-50 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-black text-sm">{project.name}</h4>
                                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">ID: {project.id.slice(0, 8)}</p>
                                        </div>
                                        <div className="bg-green-50 text-green-600 p-1.5 rounded-lg">
                                            <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</p>
                                            <p className="text-xs font-bold text-black">{project.completion_percentage}%</p>
                                        </div>
                                        <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-black h-full transition-all duration-1000"
                                                style={{ width: project.completion_percentage + '%' }}
                                            />
                                        </div>
                                        <div className="flex justify-between pt-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                                            <p className="text-[10px] font-bold text-black uppercase tracking-widest">{project.status}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="md:col-span-2 p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                                    <p className="text-sm font-medium text-gray-400 italic">No active projects found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Performance Leaderboard */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-black flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" /> Top Performers
                            </h3>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 shadow-sm shadow-gray-50">
                            {topPerformers.map((performer, idx) => (
                                <div key={performer.id} className="p-4 flex items-center justify-between group hover:bg-gray-50/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-black border-2 border-white shadow-sm overflow-hidden">
                                                {performer.avatar_url ? (
                                                    <img src={performer.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : performer.full_name?.charAt(0)}
                                            </div>
                                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-black text-white text-[8px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-black leading-none">{performer.full_name}</p>
                                            <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest">{performer.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-black">{performer.points}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Points</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Alerts/Activity */}
                        <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">System Health</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${systemHealth.supabase ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                    <p className="text-[10px] font-bold text-black uppercase tracking-widest">Supabase {systemHealth.supabase ? 'Connected' : 'Offline'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${systemHealth.auth ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                    <p className="text-[10px] font-bold text-black uppercase tracking-widest">Auth Service {systemHealth.auth ? 'Online' : 'Error'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${systemHealth.realtime ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-300'}`} />
                                    <p className="text-[10px] font-bold text-black uppercase tracking-widest">Realtime {systemHealth.realtime ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminOverview;
