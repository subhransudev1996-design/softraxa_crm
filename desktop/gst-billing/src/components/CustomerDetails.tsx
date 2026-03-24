import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Calendar, FileText, IndianRupee, MapPin, ReceiptText } from "lucide-react";

export default function CustomerDetails({ customerId, onBack }: { customerId: number, onBack: () => void }) {
  const [customer, setCustomer] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [customersData, invoicesData, creditNotesData]: any = await Promise.all([
          invoke("get_customers"),
          invoke("get_invoices"),
          invoke("get_credit_notes")
        ]);

        const c = customersData.find((x: any) => x.id === customerId);
        setCustomer(c);

        const history = invoicesData
            .filter((i: any) => i.customer_id === customerId)
            .map((i: any) => ({ ...i, type: 'invoice', sort_date: i.invoice_date }));
            
        const customerReturns = creditNotesData
            .filter((i: any) => i.customer_id === customerId)
            .map((r: any) => ({ ...r, type: 'return', sort_date: r.cn_date }));

        const combinedTimeline = [...history, ...customerReturns]
            .sort((a, b) => new Date(b.sort_date).getTime() - new Date(a.sort_date).getTime());

        setCustomer({ ...c, returns: customerReturns });
        setTimeline(combinedTimeline);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [customerId]);

  if (loading) return <div className="p-12 text-center text-zinc-500">Loading client ledger...</div>;
  if (!customer) return <div className="p-12 text-center text-red-500">Client not found.</div>;

  const invoices = timeline.filter(t => t.type === 'invoice');
  const initialRevenue = invoices.reduce((acc, curr) => acc + (curr.grand_total || 0), 0);
  const refundRevenue = customer.returns?.reduce((acc: any, curr: any) => acc + (curr.grand_total || 0), 0) || 0;
  const totalRevenue = initialRevenue - refundRevenue;

  const initialTax = invoices.reduce((acc, curr) => acc + (curr.cgst_total + curr.sgst_total + curr.igst_total || 0), 0);
  const refundTax = customer.returns?.reduce((acc: any, curr: any) => acc + (curr.cgst_total + curr.sgst_total + curr.igst_total || 0), 0) || 0;
  const totalTaxCollected = initialTax - refundTax;

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
      <div className="flex items-center gap-4 border-b border-zinc-800/50 pb-6 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white">{customer.name}</h2>
          <p className="text-zinc-500 font-medium text-xs mt-1 uppercase tracking-widest">Client Ledger & Telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Master Identity */}
        <div className="space-y-6 lg:col-span-1">
          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[160px]">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
             <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-2 px-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Net Actual Revenue</div>
                <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-4xl font-light tracking-tighter text-white text-left px-2">
              ₹{totalRevenue.toFixed(2)}
            </div>
             </div>
          </div>

          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl overflow-hidden relative group">
            <h3 className="font-bold text-lg mb-6 flex gap-2 items-center"><FileText className="w-5 h-5 text-indigo-400" /> Identity Matrix</h3>
            <div className="space-y-4">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">GSTIN Registry</dt>
                <dd className="font-mono text-white bg-zinc-900 px-3 py-1.5 rounded-lg inline-block text-sm border border-zinc-800/50">
                   {customer.gstin || 'B2C Unregistered'}
                </dd>
              </div>
              
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">State Configuration</dt>
                <dd className="font-medium text-white flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-zinc-400" /> 
                    {customer.state_code || 'N/A'}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Contact Protocol</dt>
                <dd className="font-medium text-white">{customer.phone || 'No Phone on Record'}</dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Stored Address</dt>
                <dd className="text-sm text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/30 whitespace-pre-wrap">
                   {customer.address || 'No Address Listed'}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Invoice History */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-6">
             <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl flex items-center justify-between">
                <div>
                   <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Ledgers</div>
                   <div className="text-2xl font-bold text-white">{invoices.length}</div>
                </div>
                <ReceiptText className="w-8 h-8 text-zinc-800" />
             </div>
             
             <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl flex items-center justify-between">
                <div>
                   <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Tax Accrued</div>
                   <div className="text-2xl font-bold font-mono text-amber-400">₹{totalTaxCollected.toFixed(2)}</div>
                </div>
                <Percent className="w-8 h-8 text-zinc-800" />
             </div>
          </div>
          <div className="glass p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex gap-2 items-center"><ReceiptText className="w-5 h-5 text-emerald-400" /> Complete Ledger Timeline</h3>
             </div>
             
             {timeline.length === 0 ? (
               <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                  No billing or return records found for this client.
               </div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-xs">
                      <thead>
                         <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest">
                            <th className="pb-3 font-medium">Type</th>
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Document Ref#</th>
                            <th className="pb-3 font-medium text-right">Base Value</th>
                            <th className="pb-3 font-medium text-right">Tax Value</th>
                            <th className="pb-3 font-medium text-right">Grand Total</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                         {timeline.map((item, i) => {
                            const isReturn = item.type === 'return';
                            return (
                              <tr key={i} className={`hover:bg-zinc-900/30 transition-colors ${isReturn ? 'bg-orange-500/5' : ''}`}>
                                 <td className="py-3 pr-4">
                                    {isReturn ? (
                                      <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-orange-500/30">Credit Note</span>
                                    ) : (
                                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">Tax Invoice</span>
                                    )}
                                 </td>
                                 <td className="py-3 flex gap-2 items-center text-zinc-300 whitespace-nowrap mt-1">
                                    <Calendar className="w-3 h-3 text-zinc-500" /> 
                                    {new Date(item.sort_date).toLocaleDateString()}
                                 </td>
                                 <td className={`py-3 font-mono font-bold whitespace-nowrap ${isReturn ? 'text-orange-300' : 'text-indigo-300'}`}>
                                    {isReturn ? item.cn_number : item.invoice_number}
                                 </td>
                                 <td className="py-3 text-right font-mono text-zinc-300">
                                    {isReturn ? '-' : ''}₹{item.subtotal?.toFixed(2)}
                                 </td>
                                 <td className="py-3 text-right font-mono text-zinc-400">
                                    <div className="text-[10px]">CGST: {isReturn ? '-' : ''}₹{item.cgst_total?.toFixed(2)}</div>
                                    <div className="text-[10px]">SGST: {isReturn ? '-' : ''}₹{item.sgst_total?.toFixed(2)}</div>
                                    <div className="text-[10px] text-amber-500/80">IGST: {isReturn ? '-' : ''}₹{item.igst_total?.toFixed(2)}</div>
                                 </td>
                                 <td className={`py-3 text-right font-bold font-mono ${isReturn ? 'text-orange-400' : 'text-emerald-400'}`}>
                                    {isReturn ? '-' : ''}₹{item.grand_total?.toFixed(2)}
                                 </td>
                              </tr>
                            );
                         })}
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

// I need to add Percent icon to lucide-react import
function Percent(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"></line>
      <circle cx="6.5" cy="6.5" r="2.5"></circle>
      <circle cx="17.5" cy="17.5" r="2.5"></circle>
    </svg>
  );
}
