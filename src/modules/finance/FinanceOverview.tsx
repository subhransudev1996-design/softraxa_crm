"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, Calendar, FileText, ChevronRight, TrendingUp, Filter, Search, MoreHorizontal, Receipt, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/modules/auth/AuthContext';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { InvoiceGenerator } from '@/modules/finance/InvoiceGenerator';

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

export function FinanceOverview() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [type, setType] = React.useState<'revenue' | 'expense'>('revenue');
  const [projects, setProjects] = React.useState<any[]>([]);
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [pRes, iRes, eRes] = await Promise.allSettled([
        supabase.from('projects').select('id, name'),
        supabase.from('invoices').select('*, projects(name), profiles(*)').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*, projects(name)').order('created_at', { ascending: false }),
      ]);

      if (pRes.status === 'fulfilled' && pRes.value.data) setProjects(pRes.value.data);
      
      const allTransactions: any[] = [];
      if (iRes.status === 'fulfilled' && iRes.value.data) {
        iRes.value.data.forEach((inv: any) => allTransactions.push({ ...inv, type: 'revenue' }));
      }
      if (eRes.status === 'fulfilled' && eRes.value.data) {
        eRes.value.data.forEach((exp: any) => allTransactions.push({ ...exp, type: 'expense' }));
      }

      setTransactions(allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      project_id: formData.get('project_id') || null,
      amount: parseFloat(formData.get('amount') as string),
    };

    try {
      let error;
      if (type === 'revenue') {
        ({ error } = await supabase.from('invoices').insert({ 
          ...payload, 
          status: 'paid', 
          due_date: new Date().toISOString(),
          notes: formData.get('description')
        }));
      } else {
        ({ error } = await supabase.from('expenses').insert({ 
          ...payload, 
          description: formData.get('description'), 
          category: 'general', 
          date: new Date().toISOString() 
        }));
      }

      if (!error) {
        setIsModalOpen(false);
        fetchFinanceData();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netBalance = totalRevenue - totalExpense;

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in pb-20">
      <InvoiceGenerator 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
        project={selectedInvoice?.projects}
        client={selectedInvoice?.profiles}
      />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            Finance <span className="font-light text-zinc-400">Ledger</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Managing corporate capital and project cashflow.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setType('expense'); setIsModalOpen(true); }} variant="outline" className="rounded-xl h-11 border-zinc-200">
            <ArrowDownRight className="w-4 h-4 mr-2" /> Log Expense
          </Button>
          <Button onClick={() => { setType('revenue'); setIsModalOpen(true); }} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95 h-11 rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" /> New Transaction
          </Button>
        </div>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={type === 'revenue' ? "Log Revenue Transaction" : "Record Corporate Expense"}
      >
        <form className="space-y-6" onSubmit={handleCreateTransaction}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input name="amount" label="Transaction Amount (INR)" type="number" placeholder="₹0.00" required />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> Project Link
                </label>
                <select name="project_id" className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-all">
                  <option value="">General Corporate</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Memo / Description</label>
              <textarea 
                name="description"
                className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-all"
                placeholder="Details of the transaction..."
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl text-zinc-400">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated rounded-xl bg-black text-white hover:bg-zinc-800 h-11">
              {submitting ? 'Processing...' : 'Confirm Entry'}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Expenses', value: `₹${totalExpense.toLocaleString()}`, icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Net Balance', value: `₹${netBalance.toLocaleString()}`, icon: DollarSign, color: 'text-black', bg: 'bg-zinc-100' },
            ].map((stat, i) => (
              <Card key={i} className="border-zinc-100 shadow-soft overflow-hidden rounded-3xl group transition-all hover:border-zinc-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all", stat.bg)}>
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
                  </div>
                  <p className={cn("text-2xl font-black mb-1", stat.color)}>{stat.value}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recent Transactions</div>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
                    <input type="text" placeholder="Search ledger..." className="pl-9 pr-4 py-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-black/5 w-48" />
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter
                  </Button>
                </div>
              </div>

              <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-3xl">
                <div className="divide-y divide-zinc-50">
                  {transactions.map((t, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        if (t.type === 'revenue') {
                          setSelectedInvoice(t);
                          setIsInvoiceModalOpen(true);
                        }
                      }}
                      className={cn(
                        "p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors group",
                        t.type === 'revenue' ? "cursor-pointer" : ""
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          t.type === 'revenue' ? "bg-emerald-50 text-emerald-600 group-hover:bg-zinc-900 group-hover:text-white" : "bg-red-50 text-red-600"
                        )}>
                          {t.type === 'revenue' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-black mb-0.5 group-hover:text-zinc-500 transition-colors">
                            {t.type === 'revenue' ? (t.projects?.name || 'General Revenue') : (t.projects?.name || 'General Expense')}
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-medium mb-1.5 flex items-center gap-2">
                            {t.type === 'revenue' ? t.notes : t.description}
                            {t.type === 'revenue' && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">(View Invoice)</span>}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className={cn("text-sm font-black", t.type === 'revenue' ? "text-emerald-600" : "text-black")}>
                            {t.type === 'revenue' ? '+' : '-'}₹{t.amount.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{t.status || 'Settled'}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-zinc-300 group-hover:text-black transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Financial Tools</div>
              <Card className="p-6 border-zinc-100 shadow-soft rounded-3xl space-y-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Capital Growth
                  </h4>
                  <p className="text-[11px] font-medium text-zinc-500">Corporate revenue has increased by 12% compared to the previous quarter.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" /> Audit Ready
                  </h4>
                  <p className="text-[11px] font-medium text-zinc-500">All transactions are verified and linked to strategic project IDs.</p>
                </div>
                <Button variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest rounded-xl">
                  Download Ledger
                </Button>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ShieldCheck(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>; }
