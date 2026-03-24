import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Printer } from "lucide-react";

export default function PurchasePreview({ purchaseId, onBack }: { purchaseId: number, onBack: () => void }) {
  const [purchase, setPurchase] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [purchases, vendors, s]: any = await Promise.all([
          invoke("get_purchases"),
          invoke("get_vendors"),
          invoke("get_settings")
        ]);

        const pur = purchases.find((p: any) => p.id === purchaseId);
        if (pur) {
          pur.parsedItems = JSON.parse(pur.items);
          setPurchase(pur);
          setVendor(vendors.find((v: any) => v.id === pur.vendor_id));
        }
        setSettings(s || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [purchaseId]);

  if (loading) return <div className="p-12 text-center text-zinc-500">Loading document...</div>;
  if (!purchase) return <div className="p-12 text-center text-red-500">Purchase ledger not found.</div>;

  const handlePrint = () => {
    window.print();
  };

  const isInterState = vendor?.state_code && settings?.state_code && (vendor.state_code.slice(0, 2) !== settings.state_code.slice(0, 2));

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Non-printable controls */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/50 pb-6 mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Purchase Inward Slip</h2>
            <p className="text-zinc-500 font-medium text-xs mt-1">A4 Standard Format</p>
          </div>
        </div>
        <button onClick={handlePrint} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-elevated">
          <Printer className="w-4 h-4" /> Print Ledger
        </button>
      </div>

      {/* Printable A4 Container */}
      <div className="flex justify-center print:block print:w-full print:m-0">
        <div className="bg-white text-black print:shadow-none shadow-2xl w-[210mm] min-h-[297mm] p-10 font-sans border border-zinc-200 printable-a4 mx-auto relative">
          
          <div className="text-center font-bold text-xl uppercase tracking-widest border-b-2 border-black pb-4 mb-6">
            Inward Receipt & ITC Log
          </div>

          <div className="absolute top-10 right-10 text-xs font-mono text-zinc-400 border border-zinc-300 px-3 py-1 rounded bg-zinc-50">
            INTERNAL COPY
          </div>

          {/* Header Section */}
          <div className="flex justify-between items-start mb-8 text-sm">
            <div className="w-1/2 pr-4">
              {settings?.logo_data ? (
                <img src={settings.logo_data} alt={settings?.company_name || 'Logo'} className="h-16 object-contain mb-3" />
              ) : (
                <h1 className="font-bold text-lg mb-1">{settings?.company_name || 'YOUR COMPANY NAME'}</h1>
              )}
              <p className="whitespace-pre-wrap leading-tight text-zinc-700">{settings?.address || 'Company Address\nCity, State, PIN'}</p>
              <div className="mt-3">
                <p><strong>GSTIN:</strong> {settings?.gstin || 'Unregistered'}</p>
                <p><strong>State Code:</strong> {settings?.state_code || 'N/A'}</p>
              </div>
            </div>
            
            <div className="w-1/2 pl-4 border-l border-zinc-300">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-zinc-500 text-xs uppercase">Vendor Invoice No:</span>
                <span className="font-mono font-bold text-base">{purchase.purchase_number}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">Entry Date:</span>
                <span>{new Date(purchase.purchase_date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Place of Origin:</span>
                <span>{vendor?.state_code || 'Unregistered'}</span>
              </div>
            </div>
          </div>

          <div className="border border-black p-4 mb-8 text-sm bg-zinc-50">
            <h3 className="font-bold uppercase mb-2 border-b border-zinc-200 pb-2">Supplier Details</h3>
            <p className="font-bold text-base">{vendor?.name}</p>
            <p className="whitespace-pre-wrap leading-tight text-zinc-700 mt-1">{vendor?.address || 'No Address Provided'}</p>
            <div className="mt-2 text-xs">
              <p><strong>GSTIN/UIN:</strong> {vendor?.gstin || 'Unregistered'}</p>
              <p><strong>State Code:</strong> {vendor?.state_code || 'N/A'}</p>
            </div>
          </div>

          {/* Table Details */}
          <table className="w-full text-xs border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-zinc-100 font-bold text-center border-b border-black">
                <th className="border-r border-black p-2 w-10">#</th>
                <th className="border-r border-black p-2 text-left">Description of Goods</th>
                <th className="border-r border-black p-2">HSN/SAC</th>
                <th className="border-r border-black p-2">Qty</th>
                <th className="border-r border-black p-2">Unit Cost</th>
                <th className="border-r border-black p-2">Taxable Val</th>
                {!isInterState ? (
                  <>
                    <th className="border-r border-black p-1 text-[10px]">CGST%<br/>Amt</th>
                    <th className="border-r border-black p-1 text-[10px]">SGST%<br/>Amt</th>
                  </>
                ) : (
                  <th className="border-r border-black p-1 text-[10px]">IGST%<br/>Amt</th>
                )}
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.parsedItems?.map((item: any, i: number) => {
                const taxable = item.price * item.qty;
                const tax_amt = taxable * (item.gstRate / 100);
                const total = taxable + tax_amt;
                
                return (
                  <tr key={i} className="border-b border-zinc-300">
                    <td className="border-r border-black p-2 text-center">{i + 1}</td>
                    <td className="border-r border-black p-2 font-bold">
                      {item.name} {item.varName !== 'Default' ? `(${item.varName})` : ''}
                      {item.selectedSerials?.length > 0 && (
                        <div className="font-normal text-[10px] text-zinc-500 mt-1 break-all">
                          S/N: {item.selectedSerials.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="border-r border-black p-2 text-center font-mono">{item.hsnSac || '---'}</td>
                    <td className="border-r border-black p-2 text-center font-bold">{item.qty}</td>
                    <td className="border-r border-black p-2 text-right font-mono">₹{item.price.toFixed(2)}</td>
                    <td className="border-r border-black p-2 text-right font-mono">₹{taxable.toFixed(2)}</td>
                    {!isInterState ? (
                      <>
                        <td className="border-r border-black p-2 text-right text-[10px] font-mono whitespace-nowrap">
                          {item.gstRate/2}%<br/>₹{(tax_amt/2).toFixed(2)}
                        </td>
                        <td className="border-r border-black p-2 text-right text-[10px] font-mono whitespace-nowrap">
                          {item.gstRate/2}%<br/>₹{(tax_amt/2).toFixed(2)}
                        </td>
                      </>
                    ) : (
                      <td className="border-r border-black p-2 text-right text-[10px] font-mono whitespace-nowrap">
                        {item.gstRate}%<br/>₹{(tax_amt).toFixed(2)}
                      </td>
                    )}
                    <td className="p-2 text-right font-bold font-mono">₹{total.toFixed(2)}</td>
                  </tr>
                );
              })}
              
              {/* Totals Row */}
              <tr className="border-t-2 border-black font-bold bg-zinc-50">
                <td colSpan={5} className="border-r border-black p-2 text-right uppercase">Total ITC Setup</td>
                <td className="border-r border-black p-2 text-right font-mono">₹{purchase.subtotal.toFixed(2)}</td>
                {!isInterState ? (
                  <>
                    <td className="border-r border-black p-2 text-right font-mono">₹{purchase.cgst_total.toFixed(2)}</td>
                    <td className="border-r border-black p-2 text-right font-mono">₹{purchase.sgst_total.toFixed(2)}</td>
                  </>
                ) : (
                  <td className="border-r border-black p-2 text-right font-mono">₹{purchase.igst_total.toFixed(2)}</td>
                )}
                <td className="p-2 text-right font-mono">₹{purchase.grand_total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-end mt-12 text-sm border-t border-black pt-4">
            <div className="w-1/2 pr-4 space-y-2">
              <h4 className="font-bold uppercase text-xs text-zinc-500">Remarks</h4>
              <p className="whitespace-pre-wrap font-mono text-xs text-zinc-600">This is an internal inventory inwards receipt. It maps vendor bills to system stock values.</p>
            </div>
            <div className="w-1/3 text-center">
              <div className="h-16 border-b border-black mb-2 flex items-end justify-center text-zinc-300 relative">
                {settings?.signature_data ? (
                  <img src={settings.signature_data} alt="Signature" className="absolute bottom-1 max-h-14 max-w-full object-contain" />
                ) : (
                  "Checked By"
                )}
              </div>
              <p className="font-bold text-xs uppercase">Store Manager</p>
            </div>
          </div>
          
          <div className="text-center text-[10px] text-zinc-400 mt-12">
            Stock Engine Tracker • Softraxa Offline ERP
          </div>
        </div>
      </div>
    </div>
  );
}
