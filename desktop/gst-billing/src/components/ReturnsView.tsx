import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileDown, Plus, Search, RefreshCw, Trash2, Calendar, IndianRupee } from "lucide-react";

export default function ReturnsView({ onBuildReturn, onViewReturn }: { onBuildReturn: () => void, onViewReturn: (id: number) => void }) {
  const [returns, setReturns] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [cnData, custData]: any = await Promise.all([
        invoke("get_credit_notes"),
        invoke("get_customers")
      ]);
      setReturns(cnData);
      setCustomers(custData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this Credit Note? This will NOT reverse inventory stock.")) return;
    try {
      await invoke("delete_credit_note", { id });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = returns.filter(r => 
    r.cn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
            <FileDown className="w-8 h-8 text-white" />
            Sales <span className="font-bold text-white">Returns</span>
          </h2>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Manage Credit Notes, inventory reversals, and financial refund tracking.
          </p>
        </div>
        
        <button 
          onClick={onBuildReturn}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Issue Credit Note
        </button>
      </div>

      <div className="glass rounded-[2rem] border border-zinc-800/50 overflow-hidden relative">
        <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              placeholder="Search by Note # or Invoice #..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-zinc-600"
            />
          </div>
          <button onClick={loadData} className="p-2 text-zinc-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-900/30 text-zinc-400 border-b border-zinc-800/50 uppercase tracking-widest text-[10px]">
                <th className="px-6 py-4 font-bold">Credit Note #</th>
                <th className="px-6 py-4 font-bold">Original Invoice</th>
                <th className="px-6 py-4 font-bold">Date Issued</th>
                <th className="px-6 py-4 font-bold">Client Name</th>
                <th className="px-6 py-4 font-bold">Base Refund</th>
                <th className="px-6 py-4 font-bold">Total Refund</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && returns.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-8 text-zinc-500">Loading ledger...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-8 text-zinc-500">No returns found.</td></tr>
              ) : (
                filtered.map(r => {
                  const client = customers.find(c => c.id === r.customer_id);
                  return (
                    <tr key={r.id} className="hover:bg-zinc-900/30 group transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-orange-400">{r.cn_number}</td>
                      <td className="px-6 py-4 font-mono text-zinc-400">{r.invoice_number || 'N/A'}</td>
                      <td className="px-6 py-4 text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {new Date(r.cn_date).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{client?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-zinc-400 font-mono flex items-center gap-1">
                        <IndianRupee className="w-3 h-3 text-zinc-500" />{r.subtotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white flex items-center gap-1">
                        <IndianRupee className="w-3 h-3 text-white" />{r.grand_total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onViewReturn(r.id)} className="px-4 py-2 bg-zinc-800 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-zinc-700 transition-colors">
                            View CN
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
