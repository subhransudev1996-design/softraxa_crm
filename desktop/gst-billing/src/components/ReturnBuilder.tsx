import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Save, Plus, Trash2, Layers, Percent, RefreshCw, Barcode } from "lucide-react";

export default function ReturnBuilder({ onCancel }: { onCancel: () => void }) {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Return State
  const [cnNo, setCnNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  
  // item shape: { id, productId, variationId, qty, price, gstRate, name, varName, selectedSerials: string[], hsnSac }
  const [items, setItems] = useState<any[]>([]);

  const [serialPickerItemIndex, setSerialPickerItemIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      invoke("get_customers"),
      invoke("get_products"),
      invoke("get_all_variations"),
      invoke("get_taxes"),
      invoke("get_settings"),
      invoke("get_invoices")
    ]).then(([c, p, vr, t, s, i]: any) => {
      setCustomers(c);
      setProducts(p);
      setVariations(vr);
      setTaxes(t);
      setSettings(s || { state_code: "27" });
      setInvoices(i);
      setLoading(false);
    });
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const isInterState = selectedCustomer?.state_code && settings?.state_code && 
                       (selectedCustomer.state_code.slice(0, 2) !== settings.state_code.slice(0, 2));

  const calculateTotals = () => {
    let subtotal = 0, cgst_total = 0, sgst_total = 0, igst_total = 0;

    items.forEach(item => {
      if (!item.variationId) return;
      const base = item.price * item.qty;
      subtotal += base;
      const tax_amt = base * (item.gstRate / 100);
      
      if (isInterState) igst_total += tax_amt;
      else { cgst_total += tax_amt / 2; sgst_total += tax_amt / 2; }
    });

    return { subtotal, cgst_total, sgst_total, igst_total, grand_total: subtotal + cgst_total + sgst_total + igst_total };
  };

  const totals = calculateTotals();

  const handleProductSelect = (index: number, productId: string) => {
    const newItems = [...items];
    const pid = Number(productId);
    newItems[index] = { ...newItems[index], productId, variationId: "", qty: 1, price: 0, gstRate: 0, name: "", varName: "", selectedSerials: [], hsnSac: "" };
    
    // Auto-select variation if only 1 exists
    const availableVars = variations.filter(v => v.product_id === pid);
    if (availableVars.length === 1) {
       setTimeout(() => handleVariationSelect(index, String(availableVars[0].id)), 10);
    }

    setItems(newItems);
  };

  const handleVariationSelect = (index: number, variationId: string) => {
    const newItems = [...items];
    const v = variations.find(v => v.id === Number(variationId));
    if(!v) return;
    
    const p = products.find(p => p.id === v.product_id);
    const tax = taxes.find(t => t.id === p?.tax_id);
    
    newItems[index] = { 
      ...newItems[index], 
      variationId, 
      price: v.selling_price || 0, // Default to selling price (because it's a refund for a sale)
      gstRate: tax ? tax.rate_percent : 0, 
      name: p?.name || 'Unknown Product', 
      varName: v.name || 'Unknown Variation',
      hsnSac: p?.hsn_sac || '',
      selectedSerials: []
    };
    setItems(newItems);
  };

  const handleInvoiceSelect = (invNum: string) => {
    setInvoiceNo(invNum);
    const inv = invoices.find(i => i.invoice_number === invNum);
    if (inv && inv.items) {
      try {
        const parsed = JSON.parse(inv.items);
        const mapped = parsed.map((item: any) => ({
          id: Date.now() + Math.random(),
          productId: item.productId,
          variationId: item.variationId,
          qty: item.qty, // Pre-fill with max quantity they bought
          price: item.price,
          gstRate: item.gstRate,
          name: item.name,
          varName: item.varName,
          hsnSac: item.hsnSac,
          selectedSerials: [], // Clear selected serials, they must re-scan what they are returning
          originalQty: item.qty // store original bought to prevent returning more than bought
        }));
        setItems(mapped);
      } catch (e) {
        console.error("Failed to parse invoice items", e);
      }
    } else {
      setItems([]);
    }
  };

  const handleSave = async () => {
    if (!selectedCustomerId) return alert("Select a customer for the return");
    if (!cnNo.trim()) return alert("Enter Credit Note / Return Number");
    const validItems = items.filter(i => i.variationId && i.qty > 0);
    if (validItems.length === 0) return alert("Add at least one valid returned variation");

    try {
      setLoading(true);
      await invoke("create_credit_note", {
        cnNumber: cnNo,
        invoiceNumber: invoiceNo || null,
        customerId: Number(selectedCustomerId),
        items: JSON.stringify(validItems),
        subtotal: totals.subtotal,
        cgstTotal: totals.cgst_total,
        sgstTotal: totals.sgst_total,
        igstTotal: totals.igst_total,
        grandTotal: totals.grand_total,
      });

      // Execute Additions to restore stock via the Return Engine
      for (const item of validItems) {
        await invoke("execute_return_stock_addition", {
          variationId: Number(item.variationId),
          qty: Number(item.qty),
          serials: item.selectedSerials
        });
      }

      onCancel();
    } catch (e) {
      console.error(e);
      alert("Failed to save Credit Note and update ledger. Error: " + (e instanceof Error ? e.message : JSON.stringify(e)));
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-12"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-zinc-500" /></div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
      <div className="flex items-center gap-4 border-b border-zinc-800/50 pb-6">
        <button onClick={onCancel} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white flex gap-2">Issue <span className="font-bold">Credit Note</span></h2>
          <p className="text-zinc-500 font-medium text-xs uppercase tracking-widest mt-1">Process Sales Returns & Tax Reversals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 flex gap-6 z-10 relative">
            <div className="flex-1">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Original Client</label>
              <select 
                value={selectedCustomerId} 
                onChange={e => {
                  setSelectedCustomerId(Number(e.target.value) || "");
                  setInvoiceNo("");
                  setItems([]);
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white font-medium appearance-none"
              >
                <option value="" disabled>Search & Select Commercial Ledger...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.gstin ? `[${c.gstin}]` : ''}</option>)}
              </select>
            </div>
            <div className="w-48">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Credit Note / Return # <span className="text-red-500">*</span></label>
              <input value={cnNo} onChange={e => setCnNo(e.target.value)} placeholder="CN-001" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/50 text-orange-400 font-mono uppercase placeholder:text-zinc-700 focus:text-white transition-colors" />
            </div>
            <div className="w-48">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Ref Invoice #</label>
              <select 
                value={invoiceNo} 
                onChange={e => handleInvoiceSelect(e.target.value)} 
                disabled={!selectedCustomerId}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 border-zinc-700 focus:ring-white/20 text-white font-mono uppercase appearance-none"
              >
                <option value="">No Invoice Selected</option>
                {invoices
                  .filter(i => i.customer_id === Number(selectedCustomerId))
                  .sort((a,b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())
                  .map(inv => (
                    <option key={inv.id} value={inv.invoice_number}>
                      {inv.invoice_number} ({new Date(inv.invoice_date).toLocaleDateString()}) - ₹{inv.grand_total}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex gap-2 items-center"><Layers className="w-5 h-5" /> Return Matrix</h3>
              <button 
                onClick={() => setItems([...items, { id: Date.now(), productId: "", variationId: "", qty: 1, price: 0, gstRate: 0, name: "", varName: "", selectedSerials: [], hsnSac: "" }])}
                className="text-xs font-bold bg-zinc-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-elevated hover:bg-zinc-700 transition"
              >
                <Plus className="w-4 h-4" /> Add Line
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/50 flex flex-col gap-3 group transition-all hover:bg-zinc-900/80 hover:border-zinc-700">
                  <div className="flex gap-3 items-center">
                    <select 
                      value={item.productId} onChange={e => handleProductSelect(index, e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 text-white h-11"
                    >
                      <option value="">Base Product Context...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <select 
                      value={item.variationId} onChange={e => handleVariationSelect(index, e.target.value)} disabled={!item.productId}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 text-white h-11 disabled:opacity-50"
                    >
                      <option value="">Specific Variation to Return...</option>
                      {item.productId && variations.filter(v => v.product_id === Number(item.productId)).map(v => {
                        const baseProdName = products.find(p => p.id === Number(item.productId))?.name;
                        const dispName = v.name === 'Default' ? `Primary Unit • ${baseProdName}` : v.name;
                        return (
                          <option key={v.id} value={v.id}>{dispName} (Current Stock: {v.current_stock})</option>
                        );
                      })}
                    </select>
                    
                    <button onClick={() => { const newItems = [...items]; newItems.splice(index, 1); setItems(newItems); }} className="w-11 h-11 flex items-center justify-center text-zinc-600 hover:text-red-400 border border-transparent hover:bg-zinc-900 hover:border-zinc-800 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.variationId && (
                    <div className="flex gap-4 items-center pl-2 text-sm border-t border-zinc-800/50 pt-3 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest leading-tight">Returned<br/>Qty</span>
                        <input type="number" min="0" max={item.originalQty || undefined} value={item.qty} onChange={e => {
                          const newItems = [...items]; 
                          let val = Number(e.target.value);
                          if (item.originalQty && val > item.originalQty) val = item.originalQty;
                          newItems[index].qty = val;
                          newItems[index].selectedSerials = [];
                          setItems(newItems);
                        }} className="w-20 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg px-2 py-1 outline-none text-center font-mono font-bold focus:border-orange-500 transition-colors" />
                      </div>

                      <div className="w-px h-6 bg-zinc-800" />
                      
                      <button onClick={() => setSerialPickerItemIndex(index)} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors shadow-sm text-zinc-300">
                        <Barcode className="w-3.5 h-3.5" />
                        {item.selectedSerials.length > 0 ? <span className="text-orange-400">{item.selectedSerials.length} Hardware Units Tracked</span> : <span className="text-zinc-400">Scan Return Units</span>}
                      </button>
                      
                      <div className="flex-1" />

                      <div className="flex items-center gap-4 text-xs font-mono bg-black/30 px-4 py-1.5 rounded-xl border border-zinc-800/50">
                        <div className="text-zinc-500"><Percent className="w-3 h-3 inline pb-[1px]"/> {item.gstRate}%</div>
                        
                        <div className="flex items-center gap-2 group cursor-text">
                            <span className="text-zinc-500">Refund Cost (per item): ₹</span>
                            <input 
                              type="number" step="0.01" value={item.price} 
                              onChange={e => {
                                  const newItems = [...items]; 
                                  newItems[index].price = Number(e.target.value); 
                                  setItems(newItems);
                              }}
                              className="w-20 bg-transparent border-b border-dashed border-zinc-600 focus:border-white outline-none font-bold text-white transition-colors"
                            />
                        </div>

                        <div className="text-white font-bold text-sm tracking-tight border-l border-zinc-800 pl-4 ml-2">₹{((item.price * item.qty) * (1 + item.gstRate / 100)).toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-[2rem] border border-orange-500/10 bg-orange-500/5 relative overflow-hidden h-full flex flex-col pt-8">
            <h3 className="font-bold text-lg mb-6 tracking-tight text-orange-200">Refund Liability</h3>
            <div className="space-y-4 text-sm font-medium flex-1">
              
              <div className="flex justify-between items-center text-zinc-400">
                <span>Taxable Frame Restored</span>
                <span className="font-mono">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex justify-between items-center text-zinc-400"><span>CGST Reversal</span><span className="font-mono text-orange-400">₹{totals.cgst_total.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center text-zinc-400"><span>SGST Reversal</span><span className="font-mono text-orange-400">₹{totals.sgst_total.toFixed(2)}</span></div>
                </>
              ) : (
                <div className="flex justify-between items-center text-zinc-400"><span>IGST Reversal</span><span className="font-mono text-orange-400">₹{totals.igst_total.toFixed(2)}</span></div>
              )}
              
              <div className="pt-6 mt-4 border-t border-orange-500/20">
                <div className="text-[10px] uppercase tracking-widest font-bold text-orange-500/50 mb-1">Total Return Payable</div>
                <div className="text-4xl font-bold tracking-tighter text-white break-all">₹{totals.grand_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
              </div>

            </div>

            <div className="mt-8 space-y-3">
              <button disabled={loading} onClick={handleSave} className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50">
                <Save className="w-5 h-5" /> Commit Credit Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {serialPickerItemIndex !== null && (
        <SerialInputModal 
          item={items[serialPickerItemIndex]} 
          onClose={() => setSerialPickerItemIndex(null)}
          onConfirm={(serials) => {
            const newItems = [...items];
            newItems[serialPickerItemIndex].selectedSerials = serials;
            newItems[serialPickerItemIndex].qty = serials.length > 0 ? serials.length : newItems[serialPickerItemIndex].qty;
            setItems(newItems);
            setSerialPickerItemIndex(null);
          }}
        />
      )}
    </div>
  );
}

function SerialInputModal({ item, onClose, onConfirm }: { item: any, onClose: () => void, onConfirm: (serials: string[]) => void }) {
  const [serials, setSerials] = useState<string[]>([...item.selectedSerials]);
  const [sno, setSno] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sno || serials.includes(sno)) return;
    setSerials([...serials, sno]);
    setSno("");
  };

  const removeSerial = (index: number) => {
    const arr = [...serials];
    arr.splice(index, 1);
    setSerials(arr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#09090b] border border-orange-500/20 shadow-2xl rounded-2xl w-full max-w-2xl p-6 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h3 className="text-xl font-bold">Return Hardware Log</h3>
            <p className="text-zinc-500 font-mono text-xs">{item.name} {'>'} {item.varName}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-400">{serials.length} Processing</div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">Return to Inventory</div>
          </div>
        </div>

        <form onSubmit={handleAdd} className="flex gap-4 p-4 glass rounded-2xl border border-zinc-800/50 mb-4 shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />
            <input required value={sno} onChange={e => setSno(e.target.value)} placeholder="Physical Scanner Barcode Output / Type [ENTER]" className="flex-1 bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-6 py-4 text-sm focus:ring-2 focus:ring-orange-500/50 text-orange-400 font-mono uppercase outline-none shadow-inner" />
            <button type="submit" className="bg-orange-500 text-black px-8 py-4 rounded-xl font-bold shadow-elevated hover:bg-orange-400 transition-colors">Queue Unit</button>
        </form>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4 space-y-2">
          {serials.length === 0 ? <div className="p-8 border border-zinc-800 border-dashed rounded-xl text-center text-zinc-500">No physical units scanned. Skip if tracking non-serialized inventory.</div> : null}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {serials.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between group">
                  <div className="font-mono text-sm font-bold text-orange-300 truncate max-w-[120px]">{s}</div>
                  <button onClick={() => removeSerial(idx)} className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-zinc-800/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 border border-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-900 transition-colors">Discard Scan Matrix</button>
          <button onClick={() => onConfirm(serials)} className="flex-1 py-4 bg-orange-500 text-black font-bold rounded-xl shadow-elevated">Confirm Return Pool</button>
        </div>
      </div>
    </div>
  );
}
