import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart,
    Plus,
    MoreHorizontal,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Calendar,
    Search,
    Activity,
    Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from '../../components/DashboardLayout';
import AddTransactionModal from './AddTransactionModal';
import InvoiceDetailsDrawer from './InvoiceDetailsDrawer';

interface Invoice {
    id: string;
    amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    due_date: string;
    project_id?: string;
    client_id?: string;
    created_at: string;
}

interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    project_id?: string;
    date: string;
}

const FinanceOverview: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [timeLogs, setTimeLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'income' | 'expenses' | 'analytics'>('income');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const [invoicesRes, expensesRes, projectsRes, timeLogsRes] = await Promise.all([
                supabase.from('invoices').select('*, profiles:client_id(full_name), projects:project_id(name)').order('created_at', { ascending: false }),
                supabase.from('expenses').select('*, projects:project_id(name)').order('date', { ascending: false }),
                supabase.from('projects').select('*'),
                supabase.from('time_logs').select('*, tasks(project_id), profiles(hourly_rate)')
            ]);

            if (invoicesRes.data) setInvoices(invoicesRes.data);
            if (expensesRes.data) setExpenses(expensesRes.data);
            if (projectsRes.data) setProjects(projectsRes.data);
            if (timeLogsRes.data) setTimeLogs(timeLogsRes.data);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const totalExpenses = expenses
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const pendingRevenue = invoices
        .filter(inv => inv.status === 'pending')
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const netProfit = totalRevenue - totalExpenses;

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv as any).profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv as any).projects?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch =
            exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (exp as any).projects?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const projectAnalytics = projects.map(project => {
        const projectInvoices = invoices.filter(inv => inv.project_id === project.id && inv.status === 'paid');
        const projectExpenses = expenses.filter(exp => exp.project_id === project.id);
        const projectLogs = timeLogs.filter(log => log.tasks?.project_id === project.id);

        const revenue = projectInvoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
        const directExpenses = projectExpenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);
        const laborCost = projectLogs.reduce((acc, log) => {
            const hours = (log.duration_seconds || 0) / 3600;
            const rate = Number(log.profiles?.hourly_rate) || 0;
            return acc + (hours * rate);
        }, 0);

        const totalCost = directExpenses + laborCost;
        const margin = revenue - totalCost;
        const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

        return {
            ...project,
            revenue,
            totalCost,
            margin,
            marginPercent
        };
    }).filter(p => p.revenue > 0 || p.totalCost > 0);

    const filteredAnalytics = projectAnalytics.filter(proj =>
        proj.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Dynamic Revenue Goal Calculation (Target = 120% of current revenue for demo purposes, or based on a mock target)
    // In a real app, this would be fetched from a settings table.
    const monthlyTarget = Math.max(totalRevenue * 1.2, 50000); // Ensure at least 50k target
    const revenueProgress = Math.min((totalRevenue / monthlyTarget) * 100, 100);
    const remainingTarget = monthlyTarget - totalRevenue;

    const handleExport = () => {
        let dataToExport: any[] = [];
        let filename = 'finance_export.csv';

        if (activeTab === 'income') {
            dataToExport = filteredInvoices.map(inv => ({
                ID: inv.id,
                Client: (inv as any).profiles?.full_name || 'N/A',
                Project: (inv as any).projects?.name || 'N/A',
                Status: inv.status,
                Amount: inv.amount,
                Date: inv.created_at
            }));
            filename = 'invoices_export.csv';
        } else if (activeTab === 'expenses') {
            dataToExport = filteredExpenses.map(exp => ({
                Description: exp.description,
                Category: exp.category,
                Project: (exp as any).projects?.name || 'N/A',
                Amount: exp.amount,
                Date: exp.date
            }));
            filename = 'expenses_export.csv';
        } else {
            dataToExport = filteredAnalytics.map(proj => ({
                Project: proj.name,
                Revenue: proj.revenue,
                Cost: proj.totalCost,
                Margin: proj.margin,
                MarginPercent: proj.marginPercent
            }));
            filename = 'analytics_export.csv';
        }

        if (dataToExport.length === 0) {
            alert('No data to export.');
            return;
        }

        const headers = Object.keys(dataToExport[0]).join(',');
        const rows = dataToExport.map(row => Object.values(row).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <>
                {loading && (
                    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                )}
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-light tracking-tight text-black">
                                Financial <span className="font-semibold text-gray-400">Analysis</span>
                            </h1>
                            <p className="text-gray-400">Monitor revenue, expenses, and overall company profitability.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleExport} className="rounded-xl border-gray-200 text-gray-500 hover:text-black">
                                <Download className="w-4 h-4 mr-2" /> Export CSV
                            </Button>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="rounded-xl bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Transaction
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-black">${(totalRevenue / 1000).toFixed(1)}k</p>
                                        <div className="flex items-center gap-1 text-green-500 mt-1">
                                            <ArrowUpRight className="w-3 h-3" />
                                            <span className="text-[10px] font-bold">12% vs last month</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Expenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-black">${(totalExpenses / 1000).toFixed(1)}k</p>
                                        <div className="flex items-center gap-1 text-red-500 mt-1">
                                            <ArrowDownRight className="w-3 h-3" />
                                            <span className="text-[10px] font-bold">4% increase</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                        <TrendingDown className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Net Profit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-black">${(netProfit / 1000).toFixed(1)}k</p>
                                        <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-widest">Operating Margin</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                        <PieChart className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-2xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <DollarSign className="w-20 h-20 text-white" />
                            </div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Pending</CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-bold">${(pendingRevenue / 1000).toFixed(1)}k</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Unpaid Invoices</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>

                {/* Main Content Tabs */}
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm shadow-gray-50">
                    <div className="border-b border-gray-50 px-8 flex items-center gap-8">
                        {[
                            { id: 'income', label: 'Income', icon: DollarSign },
                            { id: 'expenses', label: 'Expenses', icon: Wallet },
                            { id: 'analytics', label: 'Analytics', icon: Activity }
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
                                {activeTab === 'income' ? 'Revenue Stream' : activeTab === 'expenses' ? 'Resource Leakage' : 'Project Profitability'}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {activeTab === 'income' ? 'Track invoices and incoming payments from clients.' :
                                    activeTab === 'expenses' ? 'Monitor business and project-specific costs.' :
                                        'Deep dive into project margins and labor efficiency.'}
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

                    {activeTab === 'income' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Invoice / Client</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Project</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredInvoices.length === 0 ? (
                                        <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">No revenue records found matching your search.</td></tr>
                                    ) : (
                                        filteredInvoices.map(inv => (
                                            <tr
                                                key={inv.id}
                                                onClick={() => {
                                                    setSelectedInvoice(inv);
                                                    setIsDrawerOpen(true);
                                                }}
                                                className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-black group-hover:text-blue-600 transition-colors">INV-{inv.id.slice(0, 6).toUpperCase()}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{(inv as any).profiles?.full_name || 'Generic Client'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-medium text-gray-600">{(inv as any).projects?.name || 'Non-Project'}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`text-[9px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest ${inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                        inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right font-bold text-black text-sm">
                                                    ${(Number(inv.amount) || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Expense Detail</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Category</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Project</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredExpenses.length === 0 ? (
                                        <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">No expenses found matching your search.</td></tr>
                                    ) : (
                                        filteredExpenses.map(exp => (
                                            <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-black">{exp.description || 'Business Expense'}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(exp.date).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[10px] font-bold px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl uppercase tracking-widest">{exp.category}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-medium text-gray-400">{(exp as any).projects?.name || 'Direct Company Cost'}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right font-bold text-red-600 text-sm">
                                                    -${(Number(exp.amount) || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-50 bg-gray-50/30 border-b border-gray-50">
                                <div className="p-8">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Top Performer</p>
                                    <h4 className="text-lg font-bold text-black">{projectAnalytics.sort((a, b) => b.margin - a.margin)[0]?.name || '---'}</h4>
                                    <p className="text-xs text-green-500 font-bold mt-1">Highest Profit Margin</p>
                                </div>
                                <div className="p-8">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Burn</p>
                                    <h4 className="text-lg font-bold text-black">${totalExpenses.toLocaleString()}</h4>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Direct + Indirect Costs</p>
                                </div>
                                <div className="p-8">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Avg. Margin</p>
                                    <h4 className="text-lg font-bold text-black">{filteredAnalytics.length > 0 ? (filteredAnalytics.reduce((acc, p) => acc + p.marginPercent, 0) / filteredAnalytics.length).toFixed(1) : 0}%</h4>
                                    <p className="text-xs text-blue-500 font-bold mt-1">Cross-Project Average</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Project Analysis</th>
                                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Revenue</th>
                                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Estimated Cost</th>
                                            <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Profit Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredAnalytics.length === 0 ? (
                                            <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic">No projects found.</td></tr>
                                        ) : (
                                            filteredAnalytics.map(proj => (
                                                <tr key={proj.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs">
                                                                {proj.name[0]}
                                                            </div>
                                                            <span className="text-sm font-bold text-black">{proj.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm font-bold text-black">${proj.revenue.toLocaleString()}</td>
                                                    <td className="px-8 py-6 text-sm font-medium text-gray-400">${proj.totalCost.toLocaleString()}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <span className={`text-sm font-bold ${proj.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                ${proj.margin.toLocaleString()}
                                                            </span>
                                                            <div className="w-24 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${proj.marginPercent > 30 ? 'bg-green-500' : proj.marginPercent > 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${Math.min(Math.max(proj.marginPercent, 0), 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    <Card className="bg-white border-gray-100 border shadow-sm rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-bold text-black uppercase tracking-widest">Revenue Goals</h4>
                            <TrendingUp className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Target (${(monthlyTarget / 1000).toFixed(0)}k)</span>
                                    <span className="text-sm font-bold text-black">{revenueProgress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-black h-full transition-all duration-1000" style={{ width: `${revenueProgress}%` }} />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                {remainingTarget > 0
                                    ? `$${(remainingTarget / 1000).toFixed(1)}k remaining to hit monthly projections.`
                                    : 'Monthly review target exceeded! Great job.'
                                }
                            </p>
                        </div>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-bold text-black uppercase tracking-widest">Auto-Reports</h4>
                            <Download className="w-4 h-4 text-black" />
                        </div>
                        <div className="space-y-4">
                            <Button
                                variant="ghost"
                                onClick={() => alert('Generating Profit & Loss Report...')}
                                className="w-full justify-between h-12 rounded-2xl hover:bg-gray-50 group px-4"
                            >
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-black">Profit & Loss Q3</span>
                                </div>
                                <MoreHorizontal className="w-4 h-4 text-gray-300" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => alert('Downloading Tax Summary...')}
                                className="w-full justify-between h-12 rounded-2xl hover:bg-gray-50 group px-4"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-black">Tax Summary 2025</span>
                                </div>
                                <MoreHorizontal className="w-4 h-4 text-gray-300" />
                            </Button>
                        </div>
                    </Card>
                </div>

                <AddTransactionModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchFinanceData}
                />

                <InvoiceDetailsDrawer
                    invoice={selectedInvoice}
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    onUpdate={fetchFinanceData}
                />
            </>
        </DashboardLayout>
    );
};

export default FinanceOverview;
