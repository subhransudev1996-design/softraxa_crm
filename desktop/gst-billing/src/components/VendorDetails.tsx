import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Truck, FileText, Calendar, IndianRupee, MapPin, ReceiptText } from "lucide-react";

export default function VendorDetails({ vendorId, onBack }: { vendorId: number, onBack: () => void }) {
  const [vendor, setVendor] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vendorsData, purchasesData]: any = await Promise.all([
          invoke("get_vendors"),
          invoke("get_purchases")
        ]);

        const v = vendorsData.find((x: any) => x.id === vendorId);
        setVendor(v);

        const history = purchasesData
            .filter((p: any) => p.vendor_id === vendorId)
            .sort((a: any, b: any) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
            
        setPurchases(history);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [vendorId]);

  if (loading) return <div className="p-12 text-center text-zinc-500">Loading supplier ledger...</div>;
  if (!vendor) return <div className="p-12 text-center text-red-500">Supplier not found.</div>;

  const totalSpent = purchases.reduce((acc, curr) => acc + (curr.grand_total || 0), 0);
  const totalITCPaid = purchases.reduce((acc, curr) => acc + (curr.cgst_total + curr.sgst_total + curr.igst_total || 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
      <div className="flex items-center gap-4 border-b border-zinc-800/50 pb-6 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white">{vendor.name}</h2>
          <p className="text-zinc-500 font-medium text-xs mt-1 uppercase tracking-widest">Supplier Ledger & Telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Master Identity */}
        <div className="space-y-6 lg:col-span-1">
          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[160px]">
             <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-orange-500/5" />
             <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-2 px-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Gross Expenditure</div>
                    <IndianRupee className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-4xl font-light tracking-tighter text-white text-left px-2">
                  ₹{totalSpent.toFixed(2)}
                </div>
             </div>
          </div>

          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl overflow-hidden relative group">
            <h3 className="font-bold text-lg mb-6 flex gap-2 items-center"><FileText className="w-5 h-5 text-indigo-400" /> Vendor Traceability</h3>
            <div className="space-y-4">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">GSTIN Registry</dt>
                <dd className="font-mono text-white bg-zinc-900 px-3 py-1.5 rounded-lg inline-block text-sm border border-zinc-800/50">
                   {vendor.gstin || 'Unregistered'}
                </dd>
              </div>
              
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">State Configuration</dt>
                <dd className="font-medium text-white flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-zinc-400" /> 
                    {vendor.state_code || 'N/A'}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Stored Address</dt>
                <dd className="text-sm text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/30 whitespace-pre-wrap">
                   {vendor.address || 'No Address Listed'}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Ledger History */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-6">
             <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl flex items-center justify-between">
                <div>
                   <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Inwards</div>
                   <div className="text-2xl font-bold text-white">{purchases.length}</div>
                </div>
                <ReceiptText className="w-8 h-8 text-zinc-800" />
             </div>
             
             <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl flex items-center justify-between">
                <div>
                   <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">ITC Claimable</div>
                   <div className="text-2xl font-bold font-mono text-amber-400">₹{totalITCPaid.toFixed(2)}</div>
                </div>
                <Percent className="w-8 h-8 text-zinc-800" />
             </div>
          </div>

          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex gap-2 items-center"><Truck className="w-5 h-5 text-rose-400" /> Procurement Ledger</h3>
             </div>
             
             {purchases.length === 0 ? (
               <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                  No inward supply records found for this vendor.
               </div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-xs">
                      <thead>
                         <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest">
                            <th className="pb-3 font-medium">Entry Date</th>
                            <th className="pb-3 font-medium">Vendor Invoice No</th>
                            <th className="pb-3 font-medium text-right">Base Value</th>
                            <th className="pb-3 font-medium text-right">Tax Paid (ITC)</th>
                            <th className="pb-3 font-medium text-right">Grand Total</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                         {purchases.map((pur, i) => (
                            <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                               <td className="py-3 flex gap-2 items-center text-zinc-300 whitespace-nowrap">
                                  <Calendar className="w-3 h-3 text-zinc-500" /> 
                                  {new Date(pur.purchase_date).toLocaleDateString()}
                               </td>
                               <td className="py-3 font-mono text-rose-300 font-bold whitespace-nowrap">
                                  {pur.purchase_number}
                               </td>
                               <td className="py-3 text-right font-mono text-zinc-300">
                                  ₹{pur.subtotal?.toFixed(2)}
                               </td>
                               <td className="py-3 text-right font-mono text-zinc-400">
                                  <div className="text-[10px]">CGST: ₹{pur.cgst_total?.toFixed(2)}</div>
                                  <div className="text-[10px]">SGST: ₹{pur.sgst_total?.toFixed(2)}</div>
                                  <div className="text-[10px] text-amber-500/80">IGST: ₹{pur.igst_total?.toFixed(2)}</div>
                               </td>
                               <td className="py-3 text-right font-bold font-mono text-rose-400">
                                  ₹{pur.grand_total?.toFixed(2)}
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

// Ensure Percent icon is perfectly locally defined
function Percent(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"></line>
      <circle cx="6.5" cy="6.5" r="2.5"></circle>
      <circle cx="17.5" cy="17.5" r="2.5"></circle>
    </svg>
  );
}
