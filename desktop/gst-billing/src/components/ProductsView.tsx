import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Package, Plus, Search, Trash2, Barcode, RefreshCw, Eye, ChevronLeft, Layers } from "lucide-react";
import ProductDetails from "./ProductDetails";

export default function ProductsView() {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  if (viewMode === 'detail' && selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={() => { setViewMode('list'); setSelectedProduct(null); }} />;
  }

  return <ProductList onSelect={(p) => { setSelectedProduct(p); setViewMode('detail'); }} />;
}

function ProductList({ onSelect }: { onSelect: (p: any) => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variations, setVariations] = useState<any[]>([]);
  const [viewingProductId, setViewingProductId] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState({ 
    name: "", description: "", category_id: "", hsn_sac: "", tax_id: "", has_variations: true,
    mrp: "", purchase_price: "", selling_price: "", current_stock: "", sku: "", batch_no: "", barcode: "", expiry_date: ""
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, c, t, v]: any = await Promise.all([
        invoke("get_products"), invoke("get_categories"), invoke("get_taxes"), invoke("get_all_variations")
      ]);
      setProducts(p); setCategories(c); setTaxes(t); setVariations(v);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("add_product", {
        name: form.name, 
        description: form.description || null,
        categoryId: form.category_id ? Number(form.category_id) : null,
        hsnSac: form.hsn_sac || null,
        taxId: form.tax_id ? Number(form.tax_id) : null,
        hasVariations: form.has_variations,
        mrp: form.has_variations ? null : Number(form.mrp || 0),
        purchasePrice: form.has_variations ? null : Number(form.purchase_price || 0),
        sellingPrice: form.has_variations ? null : Number(form.selling_price || 0),
        stock: form.has_variations ? null : Number(form.current_stock || 0),
        sku: form.has_variations ? null : (form.sku || null),
        batchNo: form.has_variations ? null : (form.batch_no || null),
        barcode: form.has_variations ? null : (form.barcode || null),
        expiryDate: form.has_variations ? null : (form.expiry_date || null),
      });
      setIsModalOpen(false);
      setForm({ name: "", description: "", category_id: "", hsn_sac: "", tax_id: "", has_variations: true, mrp: "", purchase_price: "", selling_price: "", current_stock: "", sku: "", batch_no: "", barcode: "", expiry_date: "" });
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this Product AND ALL its physical stock? This is irreversible.")) return;
    await invoke("delete_product", { id });
    loadData();
  };

  if (viewingProductId) {
    return <ProductDetails productId={viewingProductId} onBack={() => setViewingProductId(null)} />;
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-white" />
            Inventory <span className="font-bold text-white">Master</span>
          </h2>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Manage base products, their specific variations, pricing, and hardware serials.
          </p>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-elevated hover:bg-zinc-200">
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      <div className="glass rounded-[2rem] border border-zinc-800/50 overflow-hidden relative">
        <div className="p-4 border-b border-zinc-800/50 flex justify-between bg-zinc-900/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white outline-none" />
          </div>
          <button onClick={loadData} className="p-2 text-zinc-400 hover:text-white"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-900/30 text-xs uppercase tracking-widest text-zinc-500 font-bold">
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">HSN/SAC</th>
                <th className="px-6 py-4">Total Stock</th>
                <th className="px-6 py-4">Configuration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map(p => {
                const cat = categories.find(c => c.id === p.category_id);
                const tax = taxes.find(t => t.id === p.tax_id);
                const hasVariationsFlag = p.has_variations === 1 || p.has_variations === true; // SQLite resolves boolean to 1/0
                return (
                  <tr key={p.id} className="hover:bg-zinc-900/30 group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-xs text-zinc-500 mt-1 flex gap-2">
                        {cat && <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{cat.name}</span>}
                        {tax && <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{tax.name}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-400">{p.hsn_sac || '---'}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const productVars = variations.filter(v => v.product_id === p.id);
                        const totalStock = productVars.reduce((acc, curr) => acc + (curr.current_stock || 0), 0);
                        return (
                          <div className={`font-mono font-bold ${totalStock > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {totalStock} Unit{totalStock !== 1 ? 's' : ''}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${hasVariationsFlag ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {hasVariationsFlag ? 'Variants Expected' : 'Single Product Unit'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => onSelect(p)} className="px-4 py-2 bg-zinc-800 text-white rounded-lg font-bold text-xs hover:bg-zinc-700 mr-2">
                        {hasVariationsFlag ? 'Manage Variations' : 'Manage Stock / Serials'}
                      </button>
                      <button onClick={() => setViewingProductId(p.id)} className="p-2 text-blue-400 hover:text-blue-300 mr-1" title="View Full Ledger"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#09090b] border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Master Product Configurator</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Master Name (e.g. iPhone 15 / Red T-Shirt)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-white/20" />
              <div className="grid grid-cols-2 gap-4">
                <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 appearance-none outline-none focus:ring-2 focus:ring-white/20">
                  <option value="">No Category Assigned</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={form.tax_id} onChange={e => setForm({...form, tax_id: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 appearance-none outline-none focus:ring-2 focus:ring-white/20">
                  <option value="">No Tax Assigned</option>
                  {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate_percent}%)</option>)}
                </select>
              </div>
              <input value={form.hsn_sac} onChange={e => setForm({...form, hsn_sac: e.target.value})} placeholder="HSN/SAC Code (Optional)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none font-mono focus:ring-2 focus:ring-white/20" />
              
              <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 mt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={form.has_variations} 
                        onChange={e => setForm({...form, has_variations: e.target.checked})} 
                        className="w-5 h-5 accent-emerald-500 rounded bg-zinc-900"
                    />
                    <div>
                        <div className="font-bold text-sm">Product has Variations (Sizes, Colors, Specs)</div>
                        <div className="text-xs text-zinc-500">Enable this if you wish to link multiple configurations under this master product.</div>
                    </div>
                </label>
              </div>

              {!form.has_variations && (
                <div className="p-4 border border-emerald-500/20 rounded-xl bg-emerald-500/5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-emerald-500 font-bold text-xs uppercase tracking-widest mb-2">Single Product Ledger Data</div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Purch. Price</label>
                            <input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-zinc-500" placeholder="0.00"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Selling Price</label>
                            <input type="number" step="0.01" value={form.selling_price} onChange={e => setForm({...form, selling_price: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-zinc-500" placeholder="0.00"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">MRP</label>
                            <input type="number" step="0.01" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-zinc-500" placeholder="0.00"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Manual Stock</label>
                            <input type="number" value={form.current_stock} onChange={e => setForm({...form, current_stock: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-zinc-500" placeholder="0"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">SKU Code</label>
                            <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-zinc-500" placeholder="SYS-12X"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Batch Number</label>
                            <input value={form.batch_no} onChange={e => setForm({...form, batch_no: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-zinc-500" placeholder="BTH-40"/>
                        </div>
                    </div>
                </div>
              )}

              <button type="submit" className="w-full py-4 bg-white text-black font-bold rounded-xl mt-6 shadow-elevated">Save & Initialize Product Matrix</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductDetail({ product, onBack }: { product: any, onBack: () => void }) {
  const [variations, setVariations] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Managing Serials Mode
  const [managingSerialsFor, setManagingSerialsFor] = useState<any>(null);

  const [form, setForm] = useState({ name: "", sku: "", barcode: "", batch_no: "", expiry_date: "", mrp: "", purchase_price: "", selling_price: "", current_stock: "", low_stock_alert: "5" });

  const hasVariationsFlag = product.has_variations === 1 || product.has_variations === true;

  useEffect(() => { loadVariations(); }, []);

  const loadVariations = async () => {
    try {
      setLoading(true);
      const data: any = await invoke("get_product_variations", { productId: product.id });
      setVariations(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("add_product_variation", {
        productId: product.id,
        name: form.name,
        sku: form.sku || null,
        barcode: form.barcode || null,
        batchNo: form.batch_no || null,
        expiryDate: form.expiry_date || null,
        mrp: Number(form.mrp || 0),
        purchasePrice: Number(form.purchase_price || 0),
        sellingPrice: Number(form.selling_price || 0),
        currentStock: Number(form.current_stock || 0),
        lowStockAlert: Number(form.low_stock_alert || 5)
      });
      setIsModalOpen(false);
      setForm({ name: "", sku: "", barcode: "", batch_no: "", expiry_date: "", mrp: "", purchase_price: "", selling_price: "", current_stock: "", low_stock_alert: "5" });
      loadVariations();
    } catch (e) { console.error(e); }
  };

  if (managingSerialsFor) {
    return <SerialManager variation={managingSerialsFor} onBack={() => setManagingSerialsFor(null)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white font-bold text-sm tracking-widest uppercase transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Master Library
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-light tracking-tight">{product.name}</h2>
          <p className="text-zinc-500 font-medium">HSN: {product.hsn_sac || 'N/A'}</p>
        </div>
        {hasVariationsFlag && (
          <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2">
            <Layers className="w-4 h-4" /> Add Configuration
          </button>
        )}
      </div>

      <div className="glass overflow-hidden rounded-[2rem] border border-zinc-800/50">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/30 text-xs uppercase text-zinc-500 font-bold">
            <tr>
              <th className="px-6 py-4">{hasVariationsFlag ? 'Variation Details' : 'Identity'}</th>
              <th className="px-6 py-4">Financial Core (Purch / Sale / MRP)</th>
              <th className="px-6 py-4">Ledger Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {variations.map(v => (
              <tr key={v.id} className="hover:bg-zinc-900/30">
                <td className="px-6 py-4">
                  <div className="font-bold tracking-tight text-white mb-1">{v.name === 'Default' && !hasVariationsFlag ? product.name : v.name}</div>
                  <div className="flex gap-2 text-[10px] font-mono text-zinc-500">
                    {v.sku && <span className="bg-zinc-900 px-1 rounded border border-zinc-800">SKU: {v.sku}</span>}
                    {v.batch_no && <span className="bg-zinc-900 px-1 rounded border border-zinc-800">BTH: {v.batch_no}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 border-l border-zinc-800/50 w-[300px]">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Purchase</div>
                    <div className="font-mono text-zinc-300">₹{v.purchase_price.toFixed(2)}</div>
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Selling</div>
                    <div className="font-mono font-bold text-white">₹{v.selling_price.toFixed(2)}</div>
                    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">MRP</div>
                    <div className="font-mono text-zinc-500 line-through">₹{v.mrp.toFixed(2)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-orange-400">{v.current_stock}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setManagingSerialsFor(v)} className="px-3 py-1.5 bg-zinc-800 text-white rounded text-xs hover:bg-zinc-700 mr-2 border border-zinc-700">Hard Serials DB</button>
                  {hasVariationsFlag && (
                    <button onClick={async () => { await invoke("delete_product_variation", { id: v.id }); loadVariations(); }} className="text-zinc-500 hover:text-red-400 align-middle"><Trash2 className="w-4 h-4 inline" /></button>
                  )}
                </td>
              </tr>
            ))}
            {variations.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Data matrix not found correctly.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#09090b] border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">Variation Configurator</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Variant Identifier (e.g. Red - 128GB)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-white/20" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">SKU Code</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Unique SKU" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 font-mono text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Batch Number</label>
                  <input value={form.batch_no} onChange={e => setForm({...form, batch_no: e.target.value})} placeholder="Mfg Batch" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 font-mono text-sm text-white outline-none" />
                </div>
              </div>
              
              <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/40">
                <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-3">Financial Profile</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Purchase Price</label>
                    <input required type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className="w-full bg-black/50 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-sm text-white outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Sale Price</label>
                    <input required type="number" step="0.01" value={form.selling_price} onChange={e => setForm({...form, selling_price: e.target.value})} className="w-full bg-black/50 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-sm text-white outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">MRP (Shown Strikethrough)</label>
                    <input required type="number" step="0.01" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} className="w-full bg-black/50 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-sm text-white outline-none" placeholder="0.00" />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 flex items-center gap-1">Quantity On Hand</label>
                      <input required type="number" value={form.current_stock} onChange={e => setForm({...form, current_stock: e.target.value})} className="w-full bg-black/50 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-sm text-emerald-400 outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 flex items-center gap-1 text-rose-400">Min Stock Warning</label>
                      <input required type="number" value={form.low_stock_alert} onChange={e => setForm({...form, low_stock_alert: e.target.value})} className="w-full bg-black/50 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-sm text-rose-400 outline-none" placeholder="5" />
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-white text-black font-bold rounded-xl mt-4 shadow-elevated">Inject Financial Variation</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SerialManager({ variation, onBack }: { variation: any, onBack: () => void }) {
  const [serials, setSerials] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [sno, setSno] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setSerials(await invoke("get_serial_numbers", { variationId: variation.id }));
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sno) return;
    await invoke("add_serial_number", { variationId: variation.id, serialNumber: sno });
    setSno(""); load();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white font-bold text-sm tracking-widest uppercase transition-colors">
        <ChevronLeft className="w-4 h-4" /> Go Back
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
          <Barcode className="w-8 h-8" />
          Hardware <span className="font-bold">Serials Log</span>
        </h2>
        <div className="text-right">
          <div className="text-sm font-bold bg-zinc-900 border border-zinc-800 px-3 py-1 rounded">{variation.name}</div>
          <div className="text-xs text-orange-400 mt-2 font-mono">Count Match: Ledger ({variation.current_stock}) vs Scanned ({serials.length})</div>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-4 p-4 glass rounded-[1.5rem] border border-zinc-800/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none" />
        <input required value={sno} onChange={e => setSno(e.target.value)} placeholder="Physical Scanner Barcode Output / Type [ENTER]" className="flex-1 bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-6 py-4 text-sm focus:ring-2 focus:ring-emerald-500/50 text-emerald-400 font-mono uppercase outline-none shadow-inner" />
        <button type="submit" className="bg-emerald-500 text-black px-8 py-4 rounded-xl font-bold shadow-elevated hover:bg-emerald-400 transition-colors">Register Unit</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4">
        {serials.map(s => (
          <div key={s.id} className={`p-4 rounded-xl border flex flex-col justify-between ${s.status === 'AVAILABLE' ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`text-[10px] tracking-widest font-bold px-2 py-0.5 rounded ${s.status === 'AVAILABLE' ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-500/20 text-emerald-500'}`}>{s.status}</div>
                {s.status === 'AVAILABLE' && (
                <button onClick={async () => { await invoke("delete_serial_number", { id: s.id }); load(); }} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
            </div>
            <div className="font-mono text-sm font-bold text-white tracking-widest truncate">{s.serial_number}</div>
          </div>
        ))}
        {serials.length === 0 && <div className="col-span-full p-12 text-center text-zinc-500 border border-zinc-800 border-dashed rounded-[2rem]">No physical serial numbers scanned into system logic.</div>}
      </div>
    </div>
  );
}
