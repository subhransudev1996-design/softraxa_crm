import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ShoppingCart, Plus, Search, RefreshCw, Eye, Trash2, Edit } from "lucide-react";

interface Purchase {
  id: number;
  purchase_number: string;
  vendor_id: number;
  items: string;
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  grand_total: number;
  purchase_date: string;
}

export default function PurchasesView({ onBuildPurchase, onViewPurchase }: { onBuildPurchase: () => void, onViewPurchase: (id: number) => void }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data: Purchase[] = await invoke("get_purchases");
      setPurchases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this purchase? This will permanently deduct the added stock and clear serial numbers!")) return;
    try {
      await invoke("delete_purchase", { id });
      loadPurchases();
    } catch (err) {
      console.error(err);
      alert("Failed to delete purchase. " + String(err));
    }
  };

  const handleEdit = (_id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    alert("Full edit functionality is locked for data integrity. Please delete this inward receipt and log a new one, or adjust stock manually.");
  };

  const filtered = purchases.filter(p => 
    p.purchase_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-white" />
            Purchase <span className="font-bold text-white">Inwards</span>
          </h2>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Complete history of all incoming vendor mapped purchases.
          </p>
        </div>
        
        <button 
          onClick={onBuildPurchase}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Log Purchase Bill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50">
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Inwards</div>
            <div className="text-3xl font-black">{purchases.length}</div>
        </div>
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50">
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Spend</div>
            <div className="text-3xl font-black text-white">₹{purchases.reduce((sum, p) => sum + p.grand_total, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50">
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">CGST + SGST ITC</div>
            <div className="text-3xl font-black text-zinc-300">₹{purchases.reduce((sum, p) => sum + p.cgst_total + p.sgst_total, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50">
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">IGST ITC Total</div>
            <div className="text-3xl font-black text-zinc-300">₹{purchases.reduce((sum, p) => sum + p.igst_total, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
        </div>
      </div>

      <div className="glass rounded-[2rem] border border-zinc-800/50 overflow-hidden relative">
        <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              placeholder="Search vendor invoice number..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-zinc-600 uppercase"
            />
          </div>
          <button onClick={loadPurchases} className="p-2 text-zinc-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30 text-xs uppercase tracking-widest text-zinc-500 font-bold">
                <th className="px-6 py-4">Purchase No.</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Subtotal</th>
                <th className="px-6 py-4 text-right">Tax (ITC)</th>
                <th className="px-6 py-4 text-right">Grand Total</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && purchases.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">Loading inwards...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ShoppingCart className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-400 font-medium">No purchases tracked.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors group">
                    <td className="px-6 py-4 font-bold font-mono text-white">{p.purchase_number}</td>
                    <td className="px-6 py-4 text-zinc-400">{new Date(p.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">₹{p.subtotal.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">₹{(p.cgst_total + p.sgst_total + p.igst_total).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-white">₹{p.grand_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onViewPurchase(p.id)} title="View & Print Ledger" className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleEdit(p.id, e)} title="Edit Purchase" className="p-2 hover:bg-zinc-800 rounded-lg text-blue-400 hover:text-blue-300 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDelete(p.id, e)} title="Delete & Rollback Stock" className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
  );
}
