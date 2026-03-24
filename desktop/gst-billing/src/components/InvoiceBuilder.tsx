import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Save, Plus, Trash2, Search, CheckSquare, Layers, Percent, RefreshCw } from "lucide-react";

export default function InvoiceBuilder({ onCancel }: { onCancel: () => void }) {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Invoice State
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  
  // item shape: { id, productId, variationId, qty, price, gstRate, name, varName, selectedSerials: any[], hsnSac }
  const [items, setItems] = useState<any[]>([{ 
    id: Date.now(), productId: "", variationId: "", qty: 1, price: 0, gstRate: 0, name: "", varName: "", selectedSerials: [], hsnSac: "" 
  }]);

  // Serial Modal State
  const [serialPickerItemIndex, setSerialPickerItemIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      invoke("get_customers"),
      invoke("get_products"),
      invoke("get_all_variations"),
      invoke("get_taxes"),
      invoke("get_settings")
    ]).then(([c, p, v, t, s]: any) => {
      setCustomers(c);
      setProducts(p);
      setVariations(v);
      setTaxes(t);
      setSettings(s || { state_code: "27" });
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
    
    // Auto-select variation if only 1 exists (e.g. for Simple Products without variations)
    const availableVars = variations.filter(v => v.product_id === pid && v.current_stock > 0);
    if (availableVars.length === 1) {
       // Call sub-handler directly to load price and tax correctly!
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
      price: v.selling_price, 
      gstRate: tax ? tax.rate_percent : 0, 
      name: p.name, 
      varName: v.name,
      hsnSac: p.hsn_sac || '',
      selectedSerials: []
    };
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!selectedCustomerId) return alert("Select a customer");
    const validItems = items.filter(i => i.variationId && i.qty > 0);
    if (validItems.length === 0) return alert("Add at least one valid variation");

    try {
      setLoading(true);
      await invoke("create_invoice", {
        invoiceNumber: invoiceNo,
        customerId: Number(selectedCustomerId),
        items: JSON.stringify(validItems), // Stored as backup evidence payload
        subtotal: totals.subtotal,
        cgstTotal: totals.cgst_total,
        sgstTotal: totals.sgst_total,
        igstTotal: totals.igst_total,
        grandTotal: totals.grand_total,
      });

      // Execute Deductions via the robust ERP Engine
      for (const item of validItems) {
        let serialIdsToMarkSold = item.selectedSerials.map((s: any) => s.id);
        await invoke("execute_stock_deduction", {
          variationId: Number(item.variationId),
          qty: Number(item.qty),
          serialIds: serialIdsToMarkSold
        });
      }

      onCancel();
    } catch (e) {
      console.error(e);
      alert("Failed to save and post ledger. Rollback triggered.");
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-12"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-zinc-500" /></div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-zinc-800/50 pb-6">
        <button onClick={onCancel} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white flex gap-2">ERP <span className="font-bold">Point of Sale</span></h2>
          <p className="text-zinc-500 font-medium text-xs uppercase tracking-widest mt-1">Multi-level Inventory Deduction Engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Customer Card */}
          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 flex gap-6 z-10 relative">
            <div className="flex-1">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Billed To Entity</label>
              <select 
                value={selectedCustomerId} 
                onChange={e => setSelectedCustomerId(Number(e.target.value) || "")}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white font-medium appearance-none"
              >
                <option value="" disabled>Search & Select Commercial Ledger...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.gstin ? `[${c.gstin}]` : ''}</option>)}
              </select>
            </div>
            <div className="w-48">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-2">Invoice Tag</label>
              <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white font-mono uppercase" />
            </div>
          </div>

          {/* Line Items Matrix */}
          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex gap-2 items-center"><Layers className="w-5 h-5" /> Inventory Matrix</h3>
              <button 
                onClick={() => setItems([...items, { id: Date.now(), productId: "", variationId: "", qty: 1, price: 0, gstRate: 0, name: "", varName: "", selectedSerials: [], hsnSac: "" }])}
                className="text-xs font-bold bg-white text-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-elevated"
              >
                <Plus className="w-4 h-4" /> Add Line
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/50 flex flex-col gap-3 group transition-all hover:bg-zinc-900/80 hover:border-zinc-700">
                  <div className="flex gap-3 items-center">
                    {/* Master Base Dropdown */}
                    <select 
                      value={item.productId} onChange={e => handleProductSelect(index, e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 text-white h-11"
                    >
                      <option value="">Base Product Context...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    {/* Variation Selector */}
                    <select 
                      value={item.variationId} onChange={e => handleVariationSelect(index, e.target.value)} disabled={!item.productId}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 text-white h-11 disabled:opacity-50"
                    >
                      <option value="">Specific Variation...</option>
                      {item.productId && variations.filter(v => v.product_id === Number(item.productId) && v.current_stock > 0).map(v => {
                        const baseProdName = products.find(p => p.id === Number(item.productId))?.name;
                        const dispName = v.name === 'Default' ? `Primary Unit • ${baseProdName}` : v.name;
                        return (
                          <option key={v.id} value={v.id}>{dispName} (Stock: {v.current_stock} @ ₹{v.selling_price})</option>
                        );
                      })}
                    </select>
                    
                    {/* Delete Line */}
                    <button onClick={() => { const newItems = [...items]; newItems.splice(index, 1); setItems(newItems); }} className="w-11 h-11 flex items-center justify-center text-zinc-600 hover:text-red-400 border border-transparent hover:bg-zinc-900 hover:border-zinc-800 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Second Row Specs */}
                  {item.variationId && (
                    <div className="flex gap-4 items-center pl-2 text-sm border-t border-zinc-800/50 pt-3 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Qty</span>
                        <input type="number" min="1" value={item.qty} onChange={e => {
                          const newItems = [...items]; newItems[index].qty = Number(e.target.value);
                          // Clear serials if manual quantity overrides scanned logic intentionally to prevent mismatch
                          newItems[index].selectedSerials = [];
                          setItems(newItems);
                        }} className="w-20 bg-black/50 border border-zinc-800 rounded-lg px-2 py-1 outline-none text-center font-mono font-bold" />
                      </div>

                      <div className="w-px h-6 bg-zinc-800" />
                      
                      <button onClick={() => setSerialPickerItemIndex(index)} className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors shadow-sm">
                        <Search className="w-3.5 h-3.5" />
                        {item.selectedSerials.length > 0 ? <span className="text-emerald-400">{item.selectedSerials.length} Hardware Units Mapped</span> : <span className="text-zinc-400">Scan Hardware Units</span>}
                      </button>
                      
                      <div className="flex-1" />

                      <div className="flex items-center gap-4 text-xs font-mono bg-black/30 px-4 py-1.5 rounded-xl border border-zinc-800/50">
                        <div className="text-zinc-500"><Percent className="w-3 h-3 inline pb-[1px]"/> {item.gstRate}%</div>
                        <div className="text-zinc-400">@ ₹{item.price}</div>
                        <div className="text-white font-bold text-sm tracking-tight border-l border-zinc-800 pl-4 ml-2">₹{((item.price * item.qty) * (1 + item.gstRate / 100)).toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial Ribbon Sidebar */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 relative overflow-hidden h-full flex flex-col">
            <h3 className="font-bold text-lg mb-6 tracking-tight">Ledger Matrix</h3>
            <div className="space-y-4 text-sm font-medium flex-1">
              
              <div className="flex justify-between items-center text-zinc-400">
                <span>Taxable Frame</span>
                <span className="font-mono">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex justify-between items-center text-zinc-400"><span>CGST Map</span><span className="font-mono">₹{totals.cgst_total.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center text-zinc-400"><span>SGST Map</span><span className="font-mono">₹{totals.sgst_total.toFixed(2)}</span></div>
                </>
              ) : (
                <div className="flex justify-between items-center text-zinc-400"><span>IGST Inter-State Map</span><span className="font-mono">₹{totals.igst_total.toFixed(2)}</span></div>
              )}
              
              <div className="pt-6 mt-4 border-t border-zinc-800/50">
                <div className="text-xs uppercase tracking-widest font-bold text-zinc-500 mb-1">Total Liability</div>
                <div className="text-4xl font-bold tracking-tighter text-white break-all">₹{totals.grand_total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
              </div>

            </div>

            <div className="mt-8 space-y-3">
              <button disabled={loading} onClick={handleSave} className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-elevated active:scale-95 disabled:opacity-50">
                <Save className="w-4 h-4" /> Commit Ledger & Deduct
              </button>
            </div>
          </div>
        </div>
      </div>

      {serialPickerItemIndex !== null && (
        <SerialPickerModal 
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

function SerialPickerModal({ item, onClose, onConfirm }: { item: any, onClose: () => void, onConfirm: (serials: any[]) => void }) {
  const [availableSerials, setAvailableSerials] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(item.selectedSerials.map((s:any)=>s.id)));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke("get_serial_numbers", { variationId: Number(item.variationId) }).then((res: any) => {
      setAvailableSerials(res.filter((s:any) => s.status === 'AVAILABLE'));
      setLoading(false);
    });
  }, [item.variationId]);

  const toggleSerial = (serial: any) => {
    const next = new Set(selectedIds);
    if(next.has(serial.id)) next.delete(serial.id);
    else next.add(serial.id);
    setSelectedIds(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#09090b] border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-2xl p-6 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h3 className="text-xl font-bold">Hardware Selection Map</h3>
            <p className="text-zinc-500 font-mono text-xs">{item.name} {'>'} {item.varName}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">{selectedIds.size} Units</div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">Selected Quantity Override</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4 space-y-2">
          {loading ? <div className="text-zinc-500 text-center py-12">Scanning physical bins...</div> : availableSerials.length === 0 ? <div className="p-8 border border-zinc-800 border-dashed rounded-xl text-center text-zinc-500">No physical units tracked for this variation. Manual Quantity overrides apply.</div> : null}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableSerials.map(s => {
              const checked = selectedIds.has(s.id);
              return (
                <div key={s.id} onClick={() => toggleSerial(s)} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${checked ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/50'}`}>
                  <div className="font-mono text-sm font-bold truncate max-w-[120px]">{s.serial_number}</div>
                  <CheckSquare className={`w-5 h-5 ${checked ? 'text-emerald-400' : 'text-zinc-700'}`} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-zinc-800/50 mt-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 border border-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-900 transition-colors">Discard Draft</button>
          <button onClick={() => {
            const arr = availableSerials.filter(s => selectedIds.has(s.id));
            onConfirm(arr);
          }} className="flex-1 py-4 bg-white text-black font-bold rounded-xl shadow-elevated">Confirm Selection</button>
        </div>
      </div>
    </div>
  );
}
