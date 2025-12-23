import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Users,
    Target,
    TrendingUp,
    DollarSign,
    Plus,
    Search,
    MoreHorizontal,
    Mail,
    Phone,
    ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from '../../components/DashboardLayout';
import LeadDetailsDrawer from './LeadDetailsDrawer';

interface Lead {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    status: 'new' | 'contacted' | 'negotiation' | 'won' | 'lost';
    source: string;
    project_estimate: number;
    created_at: string;
}

const CRMOverview: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newLead, setNewLead] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        source: 'Website',
        project_estimate: '',
        status: 'new',
        industry: '',
        website: ''
    });
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [stats, setStats] = useState({
        total: 0,
        newThisMonth: 0,
        negotiation: 0,
        conversionRate: 0,
        totalPipeline: 0
    });

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                setLeads(data);

                // Calculate Stats
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

                const total = data.length;
                const newThisMonth = data.filter(l => l.created_at >= startOfMonth).length;
                const negotiation = data.filter(l => l.status === 'negotiation').length;
                const won = data.filter(l => l.status === 'won').length;
                const conversionRate = total > 0 ? (won / total) * 100 : 0;
                const totalPipeline = data.reduce((acc, curr) => acc + (Number(curr.project_estimate) || 0), 0);

                setStats({
                    total,
                    newThisMonth,
                    negotiation,
                    conversionRate,
                    totalPipeline
                });
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('leads')
                .insert([{
                    ...newLead,
                    project_estimate: parseFloat(newLead.project_estimate) || 0
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewLead({
                company_name: '',
                contact_name: '',
                email: '',
                phone: '',
                source: 'Website',
                project_estimate: '',
                status: 'new',
                industry: '',
                website: ''
            });
            fetchLeads();
        } catch (error) {
            console.error('Error adding lead:', error);
            alert('Failed to add lead. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openLeadDetails = (id: string) => {
        setSelectedLeadId(id);
        setIsDrawerOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'won': return 'bg-green-100 text-green-700';
            case 'lost': return 'bg-red-100 text-red-700';
            case 'negotiation': return 'bg-blue-100 text-blue-700';
            case 'contacted': return 'bg-orange-100 text-orange-700';
            case 'new': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-light tracking-tight text-black">
                            CRM <span className="font-semibold text-gray-400">& Sales</span>
                        </h1>
                        <p className="text-gray-400">Manage leads, track deals, and analyze pipeline performance.</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-black appearance-none"
                        >
                            <option value="all">All Leads</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                        </select>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-xl bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200 uppercase text-[10px] font-bold tracking-widest px-6"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Lead
                        </Button>
                    </div>
                </div>

                {/* Modal Overlay */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-semibold text-black">Add New Lead</h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-gray-400 hover:text-black"
                                    >
                                        Cancel
                                    </Button>
                                </div>

                                <form onSubmit={handleAddLead} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={newLead.company_name}
                                                onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                                placeholder="e.g. Acme Corp"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Person</label>
                                            <input
                                                required
                                                type="text"
                                                value={newLead.contact_name}
                                                onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                                            <input
                                                required
                                                type="email"
                                                value={newLead.email}
                                                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={newLead.phone}
                                                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Industry</label>
                                            <input
                                                type="text"
                                                value={newLead.industry}
                                                onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                                placeholder="e.g. Technology"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Website</label>
                                            <input
                                                type="url"
                                                value={newLead.website}
                                                onChange={(e) => setNewLead({ ...newLead, website: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Estimate ($)</label>
                                            <input
                                                type="number"
                                                value={newLead.project_estimate}
                                                onChange={(e) => setNewLead({ ...newLead, project_estimate: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                                placeholder="5000"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source</label>
                                            <select
                                                value={newLead.source}
                                                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none appearance-none"
                                            >
                                                <option value="Website">Website</option>
                                                <option value="Referral">Referral</option>
                                                <option value="LinkedIn">LinkedIn</option>
                                                <option value="Email Campaign">Email Campaign</option>
                                                <option value="Google My Business">Google My Business</option>
                                                <option value="Instagram">Instagram</option>
                                                <option value="WhatsApp Campaign">WhatsApp Campaign</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-6 rounded-2xl bg-black text-white hover:bg-gray-800 shadow-xl shadow-gray-200 mt-4 transition-all"
                                    >
                                        {isSubmitting ? 'Adding Lead...' : 'Confirm & Add Lead'}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Leads</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.total}</p>
                                    <p className="text-[10px] text-green-500 font-bold mt-1">+{stats.newThisMonth} this month</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-black" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Negotiation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">
                                        {stats.negotiation}
                                    </p>
                                    <p className="text-[10px] text-blue-500 font-bold mt-1">Status: High Intent</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-black" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Conv. Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.conversionRate.toFixed(1)}%</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Won / Total Ratio</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-black" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign className="w-20 h-20 text-white" />
                        </div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">
                                        ${(stats.totalPipeline / 1000).toFixed(1)}k
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Estimated Project Value</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Leads Table Section */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm shadow-gray-50">
                    <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-lg font-bold text-black">Recent Leads</h3>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Company</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Value</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            <div className="animate-pulse flex justify-center">Loading leads...</div>
                                        </td>
                                    </tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="w-12 h-12 opacity-10" />
                                                <p>No leads match your search criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            onClick={() => openLeadDetails(lead.id)}
                                            className="hover:bg-gray-50/50 transition-all cursor-pointer group"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-black">{lead.company_name}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{lead.source}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-black">{lead.contact_name}</span>
                                                    <div className="flex items-center gap-3 mt-1 text-gray-400">
                                                        <Mail className="w-3 h-3" />
                                                        <Phone className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold text-black">${Number(lead.project_estimate || 0).toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-5 text-right font-medium">
                                                <div className="flex items-center justify-end gap-2 outline-none">
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-gray-100 outline-none">
                                                        <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-black" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-gray-100 outline-none">
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

                {isDrawerOpen && selectedLeadId && (
                    <LeadDetailsDrawer
                        leadId={selectedLeadId}
                        onClose={() => setIsDrawerOpen(false)}
                        onUpdate={fetchLeads}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default CRMOverview;
