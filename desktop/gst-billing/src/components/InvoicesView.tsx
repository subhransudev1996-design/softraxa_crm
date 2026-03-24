import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileText, Plus, Search, RefreshCw, Eye, Trash2, Edit } from "lucide-react";

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  items: string;
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  grand_total: number;
  invoice_date: string;
}

export default function InvoicesView({ onBuildInvoice, onViewInvoice }: { onBuildInvoice: () => void, onViewInvoice: (id: number) => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data: Invoice[] = await invoke("get_invoices");
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this invoice? This will restore the sold stock and mark serial numbers as available again!")) return;
    try {
      await invoke("delete_invoice", { id });
      loadInvoices();
    } catch (err) {
      console.error(err);
      alert("Failed to delete invoice. " + String(err));
    }
  };

  const handleEdit = (_id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    alert("Full edit functionality is locked for GST integrity. Please cancel/delete this invoice and generate a new one.");
  };

  const filtered = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-white" />
            Tax <span className="font-bold text-white">Invoices</span>
          </h2>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Complete history of all generated sales invoices, securely stored on your machine.
          </p>
        </div>
        
        <button 
          onClick={onBuildInvoice}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50">
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Invoices</div>
            <div className="text-3xl font-black">{invoices.length}</div>
        </div>
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50">
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Revenue</div>
            <div className="text-3xl font-black text-white">₹{invoices.reduce((sum, inv) => sum + inv.grand_total, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50">
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">CGST + SGST</div>
            <div className="text-3xl font-black text-zinc-300">₹{invoices.reduce((sum, inv) => sum + inv.cgst_total + inv.sgst_total, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
        </div>
        <div className="glass p-6 rounded-[2rem] border border-zinc-800/50">
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">IGST Total</div>
            <div className="text-3xl font-black text-zinc-300">₹{invoices.reduce((sum, inv) => sum + inv.igst_total, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
        </div>
      </div>

      <div className="glass rounded-[2rem] border border-zinc-800/50 overflow-hidden relative">
        <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              placeholder="Search invoice number..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-zinc-600 uppercase"
            />
          </div>
          <button onClick={loadInvoices} className="p-2 text-zinc-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30 text-xs uppercase tracking-widest text-zinc-500 font-bold">
                <th className="px-6 py-4">Invoice No.</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Subtotal</th>
                <th className="px-6 py-4 text-right">Tax (GST)</th>
                <th className="px-6 py-4 text-right">Grand Total</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">Loading records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-400 font-medium">No invoices found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-zinc-900/30 transition-colors group">
                    <td className="px-6 py-4 font-bold font-mono text-white">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-zinc-400">{new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">₹{inv.subtotal.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">₹{(inv.cgst_total + inv.sgst_total + inv.igst_total).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-white">₹{inv.grand_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onViewInvoice(inv.id)} title="View & Print Document" className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleEdit(inv.id, e)} title="Edit Invoice" className="p-2 hover:bg-zinc-800 rounded-lg text-blue-400 hover:text-blue-300 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDelete(inv.id, e)} title="Delete & Restore Stock" className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 hover:text-red-400 transition-colors">
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
