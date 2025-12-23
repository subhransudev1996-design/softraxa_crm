import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    LifeBuoy,
    Clock,
    CheckCircle2,
    Plus,
    Filter,
    Search,
    MoreHorizontal,
    User,
    Tag,
    MessageSquare,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from '../../components/DashboardLayout';
import CreateTicketModal from './CreateTicketModal';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    client_id: string;
    assigned_to: string;
    project_id: string;
    created_at: string;
}

const SupportOverview: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Derived Stats
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const criticalTickets = tickets.filter(t => t.priority === 'critical').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setTickets(data);
        }
        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'open': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-yellow-100 text-yellow-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-blue-600 bg-blue-50';
            case 'low': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-400 bg-gray-50';
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const updateStatus = async (id: string, newStatus: Ticket['status']) => {
        try {
            const { error } = await supabase
                .from('tickets')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchTickets();
        } catch (err) {
            console.error('Error updating ticket status:', err);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-light tracking-tight text-black">
                            Support <span className="font-semibold text-gray-400">Desk</span>
                        </h1>
                        <p className="text-gray-400">Manage client tickets, priorities, and resolution timelines.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm h-[44px]">
                            <Filter className="w-4 h-4 text-gray-400 ml-3 my-auto" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest outline-none px-3 py-1.5 cursor-pointer appearance-none min-w-[100px]"
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-xl bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
                        >
                            <Plus className="w-4 h-4 mr-2" /> New Ticket
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Open Tickets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">
                                        {openTickets}
                                    </p>
                                    <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-widest">Needs Triage</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Avg Response</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">4.2h</p>
                                    <p className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-widest">Within SLA</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Critical</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">
                                        {criticalTickets}
                                    </p>
                                    <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-widest">Immediate Action</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CheckCircle2 className="w-20 h-20 text-white" />
                        </div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Resolved</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">
                                        {resolvedCount}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Closed this month</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tickets Section */}
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm shadow-gray-50">
                    <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-black">Ticket Pipeline</h3>
                            <p className="text-sm text-gray-400">Track and resolve customer inquiries and technical issues.</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tickets..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Ticket Subject</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Priority</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Assignee</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-gray-400 animate-pulse font-bold tracking-widest uppercase text-[10px]">
                                            Synchronizing Support Data...
                                        </td>
                                    </tr>
                                ) : filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <LifeBuoy className="w-12 h-12 opacity-10" />
                                                <p>No tickets found in the current pipeline.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-gray-50/50 transition-all cursor-pointer group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-black group-hover:text-gray-600 transition-colors">{ticket.subject}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">#{ticket.id.slice(0, 8)} • {new Date(ticket.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center w-fit gap-1.5 ${getPriorityColor(ticket.priority)}`}>
                                                    <Tag className="w-3 h-3" />
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                        <User className="w-3.5 h-3.5 text-gray-300" />
                                                    </div>
                                                    <span className="text-xs font-bold text-black">Unassigned</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 outline-none">
                                                    {ticket.status !== 'resolved' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); updateStatus(ticket.id, 'resolved'); }}
                                                            className="text-green-500 hover:text-green-600 hover:bg-green-50 font-bold text-[10px] uppercase"
                                                        >
                                                            Resolve
                                                        </Button>
                                                    )}
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
                </div>
            </div>
            <CreateTicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTickets}
            />
        </DashboardLayout >
    );
};

export default SupportOverview;
