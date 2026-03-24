import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Box, Tag, Package, FileText, Calendar, IndianRupee, Layers } from "lucide-react";

export default function ProductDetails({ productId, onBack }: { productId: number, onBack: () => void }) {
  const [product, setProduct] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [tax, setTax] = useState<any>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, c, t, v, pur, ven]: any = await Promise.all([
          invoke("get_products"),
          invoke("get_categories"),
          invoke("get_taxes"),
          invoke("get_all_variations"),
          invoke("get_purchases"),
          invoke("get_vendors")
        ]);

        const prod = p.find((x: any) => x.id === productId);
        setProduct(prod);
        setCategory(c.find((x: any) => x.id === prod?.category_id));
        setTax(t.find((x: any) => x.id === prod?.tax_id));

        const prodVars = v.filter((x: any) => x.product_id === productId);
        setVariations(prodVars);

        // Extract purchases where this product is present in items JSON
        const history: any[] = [];
        pur.forEach((purchase: any) => {
          try {
            const items = JSON.parse(purchase.items || "[]");
            items.forEach((item: any) => {
              // Convert both to strings for safe comparison
              if (String(item.productId) === String(productId)) {
                history.push({
                  ...purchase,
                  matchedItem: item,
                  vendorName: ven.find((x: any) => x.id === purchase.vendor_id)?.name || "Unknown Vendor"
                });
              }
            });
          } catch (e) {
            console.error("Failed to parse purchase items", e);
          }
        });

        // Sort by newest first
        history.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
        setPurchaseHistory(history);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId]);

  if (loading) return <div className="p-12 text-center text-zinc-500">Loading comprehensive data...</div>;
  if (!product) return <div className="p-12 text-center text-red-500">Product not found.</div>;

  const totalStock = variations.reduce((acc, curr) => acc + (curr.current_stock || 0), 0);
  const hasVariationsFlag = product.has_variations === 1 || product.has_variations === true;

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
      <div className="flex items-center gap-4 border-b border-zinc-800/50 pb-6 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white">{product.name}</h2>
          <p className="text-zinc-500 font-medium text-xs mt-1 uppercase tracking-widest">Master Product Ledger & Telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Master Identity */}
        <div className="space-y-6 lg:col-span-1">
          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px] transition-all group-hover:blur-none group-hover:opacity-20">
               <Box className="w-24 h-24 text-white" />
            </div>
            
            <h3 className="font-bold text-lg mb-6 flex gap-2 items-center"><FileText className="w-5 h-5 text-emerald-400" /> Base Identity</h3>
            
            <div className="space-y-4">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Taxonomy (Category)</dt>
                <dd className="font-medium text-white">{category?.name || 'Uncategorized'}</dd>
              </div>
              
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Global Trade Code (HSN/SAC)</dt>
                <dd className="font-mono text-white bg-zinc-900 px-3 py-1.5 rounded-lg inline-block text-sm border border-zinc-800/50">
                   {product.hsn_sac || 'Not Assigned'}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Tax Compliance</dt>
                <dd className="font-medium text-white">
                  {tax ? `${tax.name} (${tax.rate_percent}%)` : 'No Tax Matrix'}
                </dd>
              </div>

              {product.description && (
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Description Brief</dt>
                  <dd className="text-sm text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/30">
                     {product.description}
                  </dd>
                </div>
              )}
            </div>
          </div>

          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[160px]">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
             <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Aggregate System Stock</div>
                <div className="text-5xl font-light tracking-tighter text-white">
                  {totalStock} <span className="text-xl text-zinc-500 font-medium">units</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Col: Variations & Purchases */}
        <div className="space-y-6 lg:col-span-2">
          
          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl">
            <h3 className="font-bold text-lg mb-6 flex gap-2 items-center"><Layers className="w-5 h-5 text-indigo-400" /> Active Configurations {hasVariationsFlag ? '(Multi-Variant)' : '(Single Unit)'}</h3>
            
            {variations.length === 0 ? (
               <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                  No physical variants linked to this base product yet.
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {variations.map(v => (
                    <div key={v.id} className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-2xl hover:border-zinc-700 transition-colors group">
                       <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {v.name === 'Default' ? 'Primary Unmodified' : v.name}
                          </h4>
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${v.current_stock > 10 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : v.current_stock > 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                             {v.current_stock} in stock
                          </span>
                       </div>
                       
                       <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                            <span className="text-zinc-500">SKU / Code</span>
                            <span className="font-mono text-zinc-300">{v.sku || '---'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                            <span className="text-zinc-500 flex gap-1 items-center"><Tag className="w-3 h-3"/> Cost (Buy)</span>
                            <span className="font-mono text-zinc-300">₹{v.purchase_price?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                            <span className="text-zinc-500 flex gap-1 items-center"><IndianRupee className="w-3 h-3"/> Retail (Sell)</span>
                            <span className="font-mono font-bold text-emerald-400">₹{v.selling_price?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-zinc-500">Batch / Expiry</span>
                            <span className="font-mono text-zinc-400">
                               {v.batch_no || 'NA'} • {v.expiry_date || 'NA'}
                            </span>
                          </div>
                       </div>
                    </div>
                 ))}
               </div>
            )}
          </div>

          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex gap-2 items-center"><Package className="w-5 h-5 text-amber-400" /> Inward Ledger History</h3>
                <span className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 font-medium">
                   {purchaseHistory.length} Receipts
                </span>
             </div>
             
             {purchaseHistory.length === 0 ? (
               <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                  No inward purchase records found for this hardware.
               </div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-xs">
                      <thead>
                         <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest">
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Ledger</th>
                            <th className="pb-3 font-medium">Supplier</th>
                            <th className="pb-3 font-medium">Configuration</th>
                            <th className="pb-3 font-medium text-right">Inward Qty</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                         {purchaseHistory.map((h, i) => (
                            <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                               <td className="py-3 flex gap-2 items-center text-zinc-300 whitespace-nowrap">
                                  <Calendar className="w-3 h-3 text-zinc-500" /> 
                                  {new Date(h.purchase_date).toLocaleDateString()}
                               </td>
                               <td className="py-3 font-mono text-indigo-300 font-bold whitespace-nowrap">
                                  {h.purchase_number}
                               </td>
                               <td className="py-3 text-zinc-300 truncate max-w-[150px]">
                                  {h.vendorName}
                               </td>
                               <td className="py-3 text-zinc-400">
                                  {h.matchedItem.varName === 'Default' ? 'Base Unit' : h.matchedItem.varName}
                                  <div className="text-[10px] text-zinc-500">@ ₹{h.matchedItem.price?.toFixed(2)} unit</div>
                               </td>
                               <td className="py-3 text-right font-bold font-mono text-emerald-400">
                                  +{h.matchedItem.qty}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}
