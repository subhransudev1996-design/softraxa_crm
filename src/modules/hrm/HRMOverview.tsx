import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Users,
    UserPlus,
    Shield,
    DollarSign,
    Search,
    Filter,
    MoreHorizontal,
    TrendingUp,
    Clock,
    Calendar,
    Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeDetailsDrawer from './EmployeeDetailsDrawer';
import LeaveRequestDialog from './LeaveRequestDialog';
import InviteMemberDialog from './InviteMemberDialog';

interface EmployeeProfile {
    id: string;
    full_name: string;
    role: 'admin' | 'pm' | 'employee' | 'client';
    points: number;
    level: number;
    avatar_url: string | null;
    hourly_rate: number | null;
    created_at: string;
}

const HRMOverview: React.FC = () => {
    const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'leaves'>('directory');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // HRM Specific States
    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [updatingLeave, setUpdatingLeave] = useState<string | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        avgLevel: 0,
        attendanceToday: 0,
        estPayroll: 0
    });

    useEffect(() => {
        fetchEmployees();
        fetchAttendance();
        fetchLeaves();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (!error && data) setEmployees(data);
        setLoading(false);
    };

    const fetchAttendance = async () => {
        const { data } = await supabase
            .from('attendance')
            .select('*, profiles:user_id(full_name, avatar_url)')
            .order('clock_in', { ascending: false })
            .limit(20);
        if (data) setAttendanceLogs(data);
    };

    const fetchLeaves = async () => {
        const { data } = await supabase
            .from('leave_requests')
            .select('*, profiles:user_id(full_name, avatar_url)')
            .order('created_at', { ascending: false });
        if (data) setLeaveRequests(data);
    };

    useEffect(() => {
        calculateStats();
    }, [employees, attendanceLogs]);

    const calculateStats = () => {
        const total = employees.length;
        const avgLevel = total > 0 ? employees.reduce((acc, curr) => acc + (curr.level || 0), 0) / total : 0;

        // Attendance Today
        const today = new Date().toISOString().split('T')[0];
        const presentToday = attendanceLogs.filter(log => log.clock_in.startsWith(today)).length;
        const attendanceToday = total > 0 ? (presentToday / total) * 100 : 0;

        // Est Payroll (Robust)
        const estPayroll = employees.reduce((acc, curr) => acc + (Number(curr.hourly_rate || 0) * 160), 0);

        setStats({
            total,
            avgLevel,
            attendanceToday,
            estPayroll
        });
    };

    const handleLeaveAction = async (requestId: string, status: 'approved' | 'rejected') => {
        setUpdatingLeave(requestId);
        try {
            const { error } = await supabase
                .from('leave_requests')
                .update({ status })
                .eq('id', requestId);

            if (error) throw error;
            fetchLeaves();
        } catch (error) {
            console.error('Error updating leave status:', error);
        } finally {
            setUpdatingLeave(null);
        }
    };

    const openEmployeeDetails = (id: string) => {
        setSelectedEmployeeId(id);
        setIsDrawerOpen(true);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-black text-white';
            case 'pm': return 'bg-blue-100 text-blue-700';
            case 'employee': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-50 text-gray-400';
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || emp.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-light tracking-tight text-black">
                            Human <span className="font-semibold text-gray-400">Resources</span>
                        </h1>
                        <p className="text-gray-400">Manage your team, roles, and resource allocation.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm h-[44px]">
                            <Filter className="w-4 h-4 text-gray-400 ml-3 my-auto" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest outline-none px-3 py-1.5 cursor-pointer appearance-none min-w-[100px]"
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Admins</option>
                                <option value="pm">Managers</option>
                                <option value="employee">Employees</option>
                                <option value="client">Clients</option>
                            </select>
                        </div>
                        <InviteMemberDialog />
                        <LeaveRequestDialog />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Team</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.total}</p>
                                    <p className="text-[10px] text-green-500 font-bold mt-1">Active Resources</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Avg. Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.avgLevel.toFixed(1)}</p>
                                    <p className="text-[10px] text-blue-500 font-bold mt-1">Skill Proficiency</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Attendance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{Math.round(stats.attendanceToday)}%</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Today's Presence</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign className="w-20 h-20 text-white" />
                        </div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Est. Payroll</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">${(stats.estPayroll / 1000).toFixed(1)}k</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Monthly Resource Cost</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm shadow-gray-50">
                    <div className="border-b border-gray-50 px-8 flex items-center gap-8">
                        {[
                            { id: 'directory', label: 'Team Directory', icon: Users },
                            { id: 'attendance', label: 'Attendance', icon: Clock },
                            { id: 'leaves', label: 'Leave Requests', icon: Calendar }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-6 border-b-2 transition-all font-bold text-xs uppercase tracking-widest ${activeTab === tab.id
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-400 hover:text-black'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-black">
                                {activeTab === 'directory' ? 'Team Directory' : activeTab === 'attendance' ? 'Attendance Logs' : 'Leave Management'}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {activeTab === 'directory' ? 'Review and manage your team members and their roles.' :
                                    activeTab === 'attendance' ? 'Track daily presence and time-logs across the organization.' :
                                        'Review and approve employee time-off requests.'}
                            </p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search records..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                            />
                        </div>
                    </div>

                    {activeTab === 'directory' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Team Member</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Role & Access</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Level & Points</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Hourly Rate</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Settings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400">
                                                <div className="animate-pulse flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
                                                    <span>Synchronizing team data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Users className="w-12 h-12 opacity-10" />
                                                    <p>No team members matching your search.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((emp) => (
                                            <tr key={emp.id} onClick={() => openEmployeeDetails(emp.id)} className="hover:bg-gray-50/50 transition-all cursor-pointer group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 font-bold text-gray-400 overflow-hidden">
                                                            {emp.avatar_url ? (
                                                                <img src={emp.avatar_url} alt={emp.full_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                emp.full_name?.split(' ').map((n: string) => n[0]).join('')
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-black">{emp.full_name || 'Incomplete Profile'}</span>
                                                            <span className="text-xs text-gray-400 mt-0.5">Joined {new Date(emp.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest ${getRoleColor(emp.role)}`}>
                                                            {emp.role}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Award className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-xs font-bold text-black">Level {emp.level}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{emp.points.toLocaleString()} Points</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-black">
                                                        {emp.hourly_rate ? `$${emp.hourly_rate}` : 'Not set'}
                                                        <span className="text-[8px] text-gray-400 uppercase ml-1">/hr</span>
                                                    </p>
                                                </td>
                                                <td className="px-8 py-6 text-right font-medium">
                                                    <div className="flex items-center justify-end gap-2 outline-none">
                                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-gray-100 outline-none">
                                                            <Shield className="w-4 h-4 text-gray-400 group-hover:text-black" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-gray-100 outline-none">
                                                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Team Member</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Check In</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Check Out</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {attendanceLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400">No attendance logs available for today.</td>
                                        </tr>
                                    ) : (
                                        attendanceLogs
                                            .filter(log =>
                                                log.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                log.status.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50/50 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden">
                                                                <img src={log.profiles?.avatar_url || ''} className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="text-sm font-bold text-black">{log.profiles?.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm text-gray-600 font-medium">
                                                        {new Date(log.clock_in).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-8 py-6 text-sm font-bold text-black">
                                                        {new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-8 py-6 text-sm font-bold text-black">
                                                        {log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className={`text-[9px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest ${log.status === 'on_time' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'leaves' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Team Member</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Leave Type</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Duration</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Reason</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {leaveRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400">No pending leave requests.</td>
                                        </tr>
                                    ) : (
                                        leaveRequests
                                            .filter(req =>
                                                req.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                req.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                req.status.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((req) => (
                                                <tr key={req.id} className="hover:bg-gray-50/50 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden">
                                                                <img src={req.profiles?.avatar_url || ''} className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="text-sm font-bold text-black">{req.profiles?.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-xs font-bold uppercase text-gray-400 tracking-widest">{req.type}</td>
                                                    <td className="px-8 py-6 text-sm font-medium text-black">
                                                        {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-8 py-6 text-sm font-medium text-gray-400 truncate max-w-[200px]">{req.reason}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {req.status === 'pending' ? (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={updatingLeave === req.id}
                                                                        onClick={() => handleLeaveAction(req.id, 'approved')}
                                                                        className="text-green-500 hover:text-green-600 hover:bg-green-50 font-bold text-[10px] uppercase"
                                                                    >
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={updatingLeave === req.id}
                                                                        onClick={() => handleLeaveAction(req.id, 'rejected')}
                                                                        className="text-red-500 hover:text-red-100 hover:bg-red-50 font-bold text-[10px] uppercase"
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${req.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                                                                    {req.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {isDrawerOpen && selectedEmployeeId && (
                    <EmployeeDetailsDrawer
                        employeeId={selectedEmployeeId}
                        onClose={() => setIsDrawerOpen(false)}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default HRMOverview;
