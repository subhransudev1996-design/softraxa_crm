import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BarChart3, TrendingUp, TrendingDown, IndianRupee, Percent, CreditCard, RefreshCw, CalendarDays, Wallet } from "lucide-react";

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'all';

export default function ReportsView() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('month');
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inv, pur, ret]: any = await Promise.all([
        invoke("get_invoices"),
        invoke("get_purchases"),
        invoke("get_credit_notes")
      ]);
      setInvoices(inv);
      setPurchases(pur);
      setReturns(ret);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Filtering Logic
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    
    switch(filter) {
      case 'today':
        return d.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo && d <= now;
      case 'month':
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case 'year':
        return d.getFullYear() === now.getFullYear();
      case 'all':
      default:
        return true;
    }
  };

  const fInvoices = invoices.filter(i => filterByDate(i.invoice_date));
  const fPurchases = purchases.filter(p => filterByDate(p.invoice_date));
  const fReturns = returns.filter(r => filterByDate(r.cn_date));

  // Aggregations
  // 1. Sales (Invoices)
  const totalSalesBase = fInvoices.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const totalSalesTax = fInvoices.reduce((sum, i) => sum + ((i.cgst_total||0) + (i.sgst_total||0) + (i.igst_total||0)), 0);
  const totalSales = fInvoices.reduce((sum, i) => sum + (i.grand_total || 0), 0);
  
  // 2. Returns (Credit Notes)
  const totalReturnsBase = fReturns.reduce((sum, r) => sum + (r.subtotal || 0), 0);
  const totalReturnsTax = fReturns.reduce((sum, r) => sum + ((r.cgst_total||0) + (r.sgst_total||0) + (r.igst_total||0)), 0);
  const totalReturns = fReturns.reduce((sum, r) => sum + (r.grand_total || 0), 0);

  // 3. Net Output (Sales - Returns)
  const netSalesBase = totalSalesBase - totalReturnsBase;
  const netOutputTax = totalSalesTax - totalReturnsTax;
  const netSalesRevenue = totalSales - totalReturns;

  // 4. Purchases (Input)
  const totalPurchasesBase = fPurchases.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  const netInputTax = fPurchases.reduce((sum, p) => sum + ((p.cgst_total||0) + (p.sgst_total||0) + (p.igst_total||0)), 0);
  const totalPurchases = fPurchases.reduce((sum, p) => sum + (p.grand_total || 0), 0);

  // 5. Final Liabilities & Cashflow
  // Tax Liability meaning: Tax collected from sales minus tax paid on purchases. If negative, you have Input Tax Credit (ITC).
  const gstLiability = netOutputTax - netInputTax;
  
  // Simple Cashflow metric = Money in (Net Sales Rev) - Money out (Total Purchases Paid)
  // This is a rough estimation of liquid accumulation.
  const netCashflow = netSalesRevenue - totalPurchases;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-white" />
            Financial <span className="font-bold text-white">Reports</span>
          </h2>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Real-time analytics for your sales, purchases, and GST tax liability.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/50 shadow-inner">
          {(['today', 'week', 'month', 'year', 'all'] as TimeFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                filter === t 
                  ? 'bg-white text-black shadow-lg scale-105' 
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {t}
            </button>
          ))}
          <button onClick={loadData} className="p-2 ml-2 text-zinc-500 hover:text-white transition-colors bg-zinc-800/30 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Row 1: Revenue vs Cost */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" /> Gross Sales
              </div>
              <div className="text-3xl font-bold font-mono text-white mb-1">₹{totalSales.toFixed(2)}</div>
              <div className="text-xs text-zinc-500 font-medium">{fInvoices.length} Invoices Issued</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <IndianRupee className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                <TrendingDown className="w-3 h-3 text-orange-500" /> Gross Reversals
              </div>
              <div className="text-3xl font-bold font-mono text-orange-400 mb-1">₹{totalReturns.toFixed(2)}</div>
              <div className="text-xs text-zinc-500 font-medium">{fReturns.length} Credit Notes</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <RefreshCw className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl relative overflow-hidden group shadow-[0_0_30px_rgba(52,211,153,0.05)]">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                 Net Sales Revenue
              </div>
              <div className="text-4xl font-bold font-mono text-emerald-300 mb-1">₹{netSalesRevenue.toFixed(2)}</div>
              <div className="text-xs text-emerald-500/70 font-bold uppercase tracking-widest">Effective Income</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-inner">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row 2: Purchases & Tax */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Purchases */}
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-pink-500" /> Supply Purchases
              </div>
              <div className="text-3xl font-bold font-mono text-pink-400 mb-1">₹{totalPurchases.toFixed(2)}</div>
              <div className="text-xs text-zinc-500 font-medium">Outbound Capital Spent</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
              <TrendingDown className="w-6 h-6 text-pink-400" />
            </div>
          </div>
        </div>

        {/* Tax Liability Breakdown */}
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl lg:col-span-2 relative overflow-hidden">
           <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none"></div>
           <div className="flex flex-col md:flex-row justify-between gap-8 h-full">
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                   <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-4">
                     <Percent className="w-3 h-3 text-indigo-400" /> Output Tax vs Input Tax
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <div className="text-xs text-zinc-500 mb-1">Output Tax (Accrued via Sales)</div>
                         <div className="text-xl font-bold font-mono text-white">₹{netOutputTax.toFixed(2)}</div>
                      </div>
                      <div>
                         <div className="text-xs text-zinc-500 mb-1">Input Tax (Paid via Purchases)</div>
                         <div className="text-xl font-bold font-mono text-zinc-400">₹{netInputTax.toFixed(2)}</div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="w-px bg-zinc-800 hidden md:block"></div>

              <div className="flex-1 flex flex-col justify-center">
                 <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                   Net GST Liability <span className="text-zinc-600 normal-case ml-2">(Output - Input)</span>
                 </div>
                 {gstLiability >= 0 ? (
                    <div>
                      <div className="text-4xl font-bold font-mono text-red-400 mb-1">₹{gstLiability.toFixed(2)}</div>
                      <div className="text-xs text-red-500/70 font-bold uppercase tracking-widest">Payable To Govt</div>
                    </div>
                 ) : (
                    <div>
                      <div className="text-4xl font-bold font-mono text-emerald-400 mb-1">-₹{Math.abs(gstLiability).toFixed(2)}</div>
                      <div className="text-xs text-emerald-500/70 font-bold uppercase tracking-widest">Input Tax Credit (ITC) Available</div>
                    </div>
                 )}
              </div>

           </div>
        </div>
      </div>

      {/* Summary Table block */}
      <div className="glass rounded-[2rem] border border-zinc-800/50 p-6 shadow-xl">
         <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-blue-400"/> Period Financial Summary</h3>
         
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
               <div className="text-xs text-zinc-500 mb-1 uppercase tracking-widest font-bold">Total Operations</div>
               <div className="text-2xl text-white font-mono font-bold">{fInvoices.length + fReturns.length + fPurchases.length} <span className="text-sm font-sans font-medium text-zinc-500">Docs</span></div>
            </div>
            
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
               <div className="text-xs text-zinc-500 mb-1 uppercase tracking-widest font-bold">Net Base Sales</div>
               <div className="text-2xl text-emerald-300 font-mono font-bold">₹{netSalesBase.toFixed(2)}</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
               <div className="text-xs text-zinc-500 mb-1 uppercase tracking-widest font-bold">Net Base Purchases</div>
               <div className="text-2xl text-pink-300 font-mono font-bold">₹{totalPurchasesBase.toFixed(2)}</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-700 shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
               <div className="relative z-10">
                 <div className="text-xs text-zinc-400 mb-1 uppercase tracking-widest font-bold">Net Cashflow</div>
                 <div className={`text-2xl font-mono font-bold ${netCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {netCashflow >= 0 ? '+' : '-'}₹{Math.abs(netCashflow).toFixed(2)}
                 </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
