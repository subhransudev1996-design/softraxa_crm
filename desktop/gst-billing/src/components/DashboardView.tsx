import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  TrendingUp, FileText, Users, Package, 
  ArrowUpRight, Activity, Plus 
} from "lucide-react";

export default function DashboardView({ onAction }: { onAction: (tab: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalClients: 0,
    lowStockItems: 0,
    recentInvoices: [] as any[],
    lowStockData: [] as any[],
    products: [] as any[]
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [invoices, products, customers, variations, returns]: any = await Promise.all([
          invoke("get_invoices"),
          invoke("get_products"),
          invoke("get_customers"),
          invoke("get_all_variations"),
          invoke("get_credit_notes")
        ]);

        const totalInvoiceRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0);
        const totalReturnsLiability = returns.reduce((sum: number, ret: any) => sum + (ret.grand_total || 0), 0);
        const netRevenue = totalInvoiceRevenue - totalReturnsLiability;
        
        // Find variations falling strictly under or at their configured low_stock_alert limit
        const lowStockVariations = variations.filter((v: any) => v.current_stock <= (v.low_stock_alert || 5));

        setMetrics({
          totalRevenue: netRevenue,
          totalInvoices: invoices.length,
          totalClients: customers.length,
          lowStockItems: lowStockVariations.length,
          recentInvoices: invoices.sort((a: any, b: any) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()).slice(0, 5),
          lowStockData: lowStockVariations,
          products: products
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-white" />
            Command <span className="font-bold text-white">Center</span>
          </h2>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Real-time overview of your local billing workspace.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onAction("products")}
            className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-medium text-sm flex items-center gap-2"
          >
            <Package className="w-4 h-4" /> Manage Stock
          </button>
          <button 
            onClick={() => onAction("invoice-builder")}
            className="bg-white text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-elevated"
          >
            <Plus className="w-4 h-4" /> Quick Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Gross Revenue" 
          value={`₹${metrics.totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`} 
          trend="All Time" 
          icon={TrendingUp} 
          primary
        />
        <StatCard 
          label="Invoices Generated" 
          value={metrics.totalInvoices.toString()} 
          trend="Ledger" 
          icon={FileText} 
        />
        <StatCard 
          label="Client Network" 
          value={metrics.totalClients.toString()} 
          trend="Contacts" 
          icon={Users} 
        />
        <StatCard 
          label="Low Stock Alerts" 
          value={metrics.lowStockItems.toString()} 
          trend="Action Req" 
          icon={Package} 
          warning={metrics.lowStockItems > 0}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-[2rem] border border-zinc-800/50 overflow-hidden relative">
          <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
            <h3 className="font-bold">Recent Invoices</h3>
            <button onClick={() => onAction("invoices")} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
              View Ledger →
            </button>
          </div>
          <div className="p-0">
            {metrics.recentInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 font-medium">No activity yet. Create your first invoice.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {metrics.recentInvoices.map((inv, i) => (
                  <div key={i} className="p-4 px-6 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white font-mono">{inv.invoice_number}</p>
                        <p className="text-xs text-zinc-500">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white font-mono">₹{inv.grand_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                      <button onClick={() => onAction(`preview-${inv.id}`)} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors mt-1">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-[2rem] border border-zinc-800/50 flex flex-col relative overflow-hidden">
          <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-orange-400"><Package className="w-4 h-4" /> Stock Alerts</h3>
            <button onClick={() => onAction("products")} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
              Manage
            </button>
          </div>
          <div className="flex-1 max-h-[400px] overflow-y-auto p-4 space-y-3">
             {metrics.lowStockData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full text-zinc-500 py-12">
                    <Package className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs uppercase font-bold tracking-widest">Inventory Optimal</p>
                </div>
             ) : (
                metrics.lowStockData.map((item: any, i: number) => {
                    const prod = metrics.products.find((p: any) => p.id === item.product_id);
                    return (
                        <div key={i} className="flex items-center justify-between bg-zinc-900/40 border border-orange-500/20 p-3 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer group" onClick={() => onAction("products")}>
                            <div>
                                <p className="text-white font-bold text-sm leading-tight group-hover:text-orange-400 transition-colors">{prod?.name || 'Deleted Product'}</p>
                                <p className="text-zinc-500 text-[10px] font-mono mt-0.5">{item.name !== 'Default' ? item.name : 'Base Unit'}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-black font-mono px-2 py-1 rounded ${item.current_stock <= 0 ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/10'}`}>
                                    {item.current_stock} Left
                                </span>
                            </div>
                        </div>
                    );
                })
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon: Icon, primary = false, warning = false }: { label: string, value: string, trend: string, icon: any, primary?: boolean, warning?: boolean }) {
  return (
    <div className={`glass p-6 rounded-[2rem] border ${warning ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-800/50'} relative overflow-hidden`}>
      {primary && <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full" />}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-2 rounded-xl ${warning ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-zinc-400 border border-zinc-800'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-full border border-zinc-800">
          <ArrowUpRight className="w-3 h-3" /> {trend}
        </div>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1 relative z-10">{label}</p>
      <p className={`text-3xl font-black tracking-tight relative z-10 ${warning ? 'text-orange-400' : primary ? 'text-white' : 'text-zinc-200'}`}>{value}</p>
    </div>
  );
}
