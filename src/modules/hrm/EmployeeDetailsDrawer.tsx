import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    X,
    User,
    Clock,
    Calendar,
    Mail,
    Phone,
    Shield,
    Award,
    MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmployeeDetailsDrawerProps {
    employeeId: string;
    onClose: () => void;
}

const EmployeeDetailsDrawer: React.FC<EmployeeDetailsDrawerProps> = ({ employeeId, onClose }) => {
    const [employee, setEmployee] = useState<any>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leaves'>('overview');

    useEffect(() => {
        if (employeeId) fetchDetails();
    }, [employeeId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            // Fetch Employee Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', employeeId)
                .single();

            // Fetch Attendance Logs
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', employeeId)
                .order('clock_in', { ascending: false })
                .limit(10);

            // Fetch Leave Requests
            const { data: leaveData } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('user_id', employeeId)
                .order('created_at', { ascending: false });

            setEmployee(profileData);
            setAttendance(attendanceData || []);
            setLeaves(leaveData || []);
        } catch (error) {
            console.error('Error fetching employee details:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateEmployee = async (updates: any) => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', employeeId);
            if (error) throw error;
            fetchDetails();
        } catch (error) {
            console.error('Error updating employee:', error);
            alert('Failed to update employee profile.');
        } finally {
            setUpdating(false);
        }
    };

    if (!employeeId) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[110] transform transition-transform animate-in slide-in-from-right duration-300 border-l border-gray-100">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-black text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                            {employee?.avatar_url ? (
                                <img src={employee.avatar_url} alt={employee.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{employee?.full_name || 'Loading Employee...'}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-white/10 rounded-md">
                                    {employee?.role || 'Employee'}
                                </span>
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                                    LVL {employee?.level}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-white rounded-full">
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                {/* Tabs Navigation */}
                <div className="px-8 flex items-center gap-8 border-b border-gray-50 bg-gray-50/50">
                    {[
                        { id: 'overview', label: 'Overview', icon: User },
                        { id: 'attendance', label: 'Attendance', icon: Clock },
                        { id: 'leaves', label: 'Leaves', icon: Calendar }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-all text-xs font-bold uppercase tracking-widest ${activeTab === tab.id
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-400 hover:text-black'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto bg-white">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        </div>
                    ) : (
                        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {activeTab === 'overview' && (
                                <div className="space-y-8">
                                    {/* Contact Information */}
                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Contact Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                                                    <p className="text-sm font-medium text-black">user@softraxa.com</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                                                    <p className="text-sm font-medium text-black">{employee?.phone || 'Not set'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Skills Section */}
                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Specialized Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {employee?.skills?.length > 0 ? employee.skills.map((skill: string) => (
                                                <span key={skill} className="px-3 py-1.5 bg-black/5 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl border border-black/5">
                                                    {skill}
                                                </span>
                                            )) : (
                                                <p className="text-xs text-gray-400 italic">No skills listed yet.</p>
                                            )}
                                        </div>
                                    </section>

                                    {/* Performance Stats */}
                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Performance Stats</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="bg-gray-50 border-none rounded-2xl shadow-none">
                                                <CardContent className="p-4 flex flex-col gap-1">
                                                    <Award className="w-4 h-4 text-gray-400 mb-2" />
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={employee?.points || 0}
                                                            onChange={(e) => updateEmployee({ points: parseInt(e.target.value) || 0 })}
                                                            disabled={updating}
                                                            className="text-2xl font-bold text-black bg-transparent w-full outline-none"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Points</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-gray-50 border-none rounded-2xl shadow-none">
                                                <CardContent className="p-4 flex flex-col gap-1">
                                                    <Shield className="w-4 h-4 text-gray-400 mb-2" />
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-2xl font-bold text-black">$</span>
                                                        <input
                                                            type="number"
                                                            value={employee?.hourly_rate || 0}
                                                            onChange={(e) => updateEmployee({ hourly_rate: parseFloat(e.target.value) || 0 })}
                                                            disabled={updating}
                                                            className="text-2xl font-bold text-black bg-transparent w-full outline-none"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hourly Rate</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'attendance' && (
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Recent Attendance Logs</h4>
                                    {attendance.length === 0 ? (
                                        <div className="py-20 text-center text-gray-400 border border-dashed border-gray-100 rounded-3xl">
                                            <Clock className="w-10 h-10 opacity-10 mx-auto mb-4" />
                                            <p className="text-xs font-medium">No attendance logs found for this period.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {attendance.map(log => (
                                                <div key={log.id} className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-black transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.status === 'on_time' ? 'bg-green-50' : 'bg-red-50'}`}>
                                                            <MapPin className={`w-5 h-5 ${log.status === 'on_time' ? 'text-green-500' : 'text-red-500'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-black">{new Date(log.clock_in).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                                {new Date(log.clock_in).toLocaleTimeString()} - {log.clock_out ? new Date(log.clock_out).toLocaleTimeString() : 'Active'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest ${log.status === 'on_time' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {log.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'leaves' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Leave History & Requests</h4>
                                        <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-black p-0 h-auto">Approve Batch</Button>
                                    </div>
                                    {leaves.length === 0 ? (
                                        <div className="py-20 text-center text-gray-400 border border-dashed border-gray-100 rounded-3xl">
                                            <Calendar className="w-10 h-10 opacity-10 mx-auto mb-4" />
                                            <p className="text-xs font-medium">No leave requests recorded.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {leaves.map(req => (
                                                <div key={req.id} className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-black transition-all group">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{req.type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                                            <Calendar className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-black">{new Date(req.start_date).toLocaleDateString()} &rarr; {new Date(req.end_date).toLocaleDateString()}</p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{req.reason || 'No reason provided.'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsDrawer;
