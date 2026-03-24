import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Printer } from "lucide-react";

export default function ReturnPreview({ returnId, onBack }: { returnId: number, onBack: () => void }) {
  const [creditNote, setCreditNote] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cns, customers, s]: any = await Promise.all([
          invoke("get_credit_notes"),
          invoke("get_customers"),
          invoke("get_settings")
        ]);

        const cn = cns.find((i: any) => i.id === returnId);
        if (cn) {
          cn.parsedItems = JSON.parse(cn.items);
          setCreditNote(cn);
          setCustomer(customers.find((c: any) => c.id === cn.customer_id));
        }
        setSettings(s || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [returnId]);

  if (loading) return <div className="p-12 text-center text-zinc-500">Loading document...</div>;
  if (!creditNote) return <div className="p-12 text-center text-red-500">Credit Note not found.</div>;

  const handlePrint = () => {
    window.print();
  };

  const isInterState = customer?.state_code && settings?.state_code && (customer.state_code !== settings.state_code);

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Non-printable controls */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/50 pb-6 mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Credit Note Preview</h2>
            <p className="text-zinc-500 font-medium text-xs mt-1">A4 Standard Format</p>
          </div>
        </div>
        <button onClick={handlePrint} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-elevated">
          <Printer className="w-4 h-4" /> Print PDF
        </button>
      </div>

      {/* Printable A4 Container */}
      <div className="flex justify-center print:block print:w-full print:m-0">
        <div className="bg-white text-black print:shadow-none shadow-2xl w-[210mm] min-h-[297mm] p-10 font-sans border border-zinc-200 printable-a4 mx-auto relative overflow-hidden">
          
          <div className="absolute top-10 right-10 opacity-10 pointer-events-none transform rotate-12">
            <h1 className="text-6xl font-black uppercase tracking-widest text-orange-500 border-[10px] border-orange-500 p-4 rounded-xl">RETURN</h1>
          </div>

          <div className="text-center font-bold text-xl uppercase tracking-widest border-b-2 border-black pb-4 mb-6 relative z-10">
            CREDIT NOTE (Sales Return)
          </div>

          {/* Header Section */}
          <div className="flex justify-between items-start mb-8 text-sm relative z-10">
            <div className="w-1/2 pr-4">
              {settings?.logo_data ? (
                <img src={settings.logo_data} alt={settings?.company_name || 'Logo'} className="h-16 object-contain mb-3" />
              ) : (
                <h1 className="font-bold text-lg mb-1">{settings?.company_name || 'YOUR COMPANY NAME'}</h1>
              )}
              <p className="whitespace-pre-wrap leading-tight text-zinc-700">{settings?.address || 'Company Address\nCity, State, PIN'}</p>
              <div className="mt-3 text-xs">
                <p><strong>GSTIN:</strong> {settings?.gstin || 'Unregistered'}</p>
                <p><strong>State Code:</strong> {settings?.state_code || 'N/A'}</p>
              </div>
            </div>
            
            <div className="w-1/2 pl-4 border-l border-zinc-300">
              <div className="flex justify-between mb-1">
                <span className="font-bold">Credit Note No:</span>
                <span className="font-mono text-orange-600 font-bold">{creditNote.cn_number}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold pl-2 text-zinc-500 text-xs">Orig Invoice No:</span>
                <span className="font-mono text-zinc-500 text-xs">{creditNote.invoice_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between mb-1 mt-2">
                <span className="font-bold">Date of Issue:</span>
                <span>{new Date(creditNote.cn_date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="font-bold mt-1">Place of Supp:</span>
                <span className="text-right ml-2 leading-tight mt-1">State Code - {customer?.state_code || 'Unregistered'}</span>
              </div>
            </div>
          </div>

          <div className="border border-black p-4 mb-8 text-sm bg-orange-50 rounded-xl relative z-10">
            <h3 className="font-bold uppercase mb-2 border-b border-orange-200 pb-2 text-orange-900">Original Billed To / Returning Entity</h3>
            <p className="font-bold text-base text-black">{customer?.name}</p>
            <p className="whitespace-pre-wrap leading-tight text-zinc-700 mt-1">{customer?.address || 'No Address Provided'}</p>
            <div className="mt-2 text-xs text-black">
              <p><strong>GSTIN/UIN:</strong> {customer?.gstin || 'Unregistered'}</p>
              <p><strong>State Code:</strong> {customer?.state_code || 'N/A'}</p>
            </div>
          </div>

          {/* Table Details */}
          <table className="w-full text-xs border-collapse border border-black mb-6 relative z-10">
            <thead>
              <tr className="bg-zinc-100 font-bold text-center border-b border-black">
                <th className="border-r border-black p-2 w-10">#</th>
                <th className="border-r border-black p-2 text-left">Description of Returned Goods</th>
                <th className="border-r border-black p-2">HSN/SAC</th>
                <th className="border-r border-black p-2">Qty</th>
                <th className="border-r border-black p-2">Assessed Value</th>
                <th className="border-r border-black p-2">Taxable Val</th>
                {!isInterState ? (
                  <>
                    <th className="border-r border-black p-1 text-[10px]">CGST%<br/>Amt (Rev)</th>
                    <th className="border-r border-black p-1 text-[10px]">SGST%<br/>Amt (Rev)</th>
                  </>
                ) : (
                  <th className="border-r border-black p-1 text-[10px]">IGST%<br/>Amt (Rev)</th>
                )}
                <th className="p-2 text-right">Credit Value</th>
              </tr>
            </thead>
            <tbody>
              {creditNote.parsedItems?.map((item: any, i: number) => {
                const taxable = item.price * item.qty;
                const tax_amt = taxable * (item.gstRate / 100);
                const total = taxable + tax_amt;
                
                return (
                  <tr key={i} className="border-b border-zinc-300">
                    <td className="border-r border-black p-2 text-center">{i + 1}</td>
                    <td className="border-r border-black p-2 font-bold">{item.name} <span className="text-[10px] font-normal text-zinc-500 block">{item.varName}</span></td>
                    <td className="border-r border-black p-2 text-center font-mono">{item.hsnSac || '---'}</td>
                    <td className="border-r border-black p-2 text-center font-bold text-orange-600">-{item.qty}</td>
                    <td className="border-r border-black p-2 text-right font-mono">₹{item.price.toFixed(2)}</td>
                    <td className="border-r border-black p-2 text-right font-mono line-through opacity-70">₹{taxable.toFixed(2)}</td>
                    {!isInterState ? (
                      <>
                        <td className="border-r border-black p-2 text-right text-[10px] font-mono whitespace-nowrap text-orange-700">
                          {item.gstRate/2}%<br/>-₹{(tax_amt/2).toFixed(2)}
                        </td>
                        <td className="border-r border-black p-2 text-right text-[10px] font-mono whitespace-nowrap text-orange-700">
                          {item.gstRate/2}%<br/>-₹{(tax_amt/2).toFixed(2)}
                        </td>
                      </>
                    ) : (
                      <td className="border-r border-black p-2 text-right text-[10px] font-mono whitespace-nowrap text-orange-700">
                        {item.gstRate}%<br/>-₹{(tax_amt).toFixed(2)}
                      </td>
                    )}
                    <td className="p-2 text-right font-bold font-mono">₹{total.toFixed(2)}</td>
                  </tr>
                );
              })}
              
              {/* Totals Row */}
              <tr className="border-t-2 border-black font-bold bg-orange-100">
                <td colSpan={5} className="border-r border-black p-2 text-right uppercase text-orange-900">Total Approved Credit</td>
                <td className="border-r border-black p-2 text-right font-mono">₹{creditNote.subtotal.toFixed(2)}</td>
                {!isInterState ? (
                  <>
                    <td className="border-r border-black p-2 text-right font-mono text-orange-700">-₹{creditNote.cgst_total.toFixed(2)}</td>
                    <td className="border-r border-black p-2 text-right font-mono text-orange-700">-₹{creditNote.sgst_total.toFixed(2)}</td>
                  </>
                ) : (
                  <td className="border-r border-black p-2 text-right font-mono text-orange-700">-₹{creditNote.igst_total.toFixed(2)}</td>
                )}
                <td className="p-2 text-right font-bold text-sm font-mono">₹{creditNote.grand_total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="text-xs text-zinc-500 mb-8 max-w-lg relative z-10 italic">
            This document proves the execution of a sales return, resulting in a credit payload payable to the client. The mentioned quantities have been natively re-instantiated back into the active database stock pool. Tax liabilities have been virtually reversed according to GST compliance guidelines.
          </div>

          {/* Footer Subsections */}
          <div className="flex justify-between items-start pt-6 border-t-2 border-dashed border-zinc-300 relative z-10">
            
            <div className="w-1/2 pl-4 text-center ml-auto">
              <div className="h-16 border-b border-black mb-2 flex items-end justify-center text-zinc-300 relative">
                {settings?.signature_data ? (
                  <img src={settings.signature_data} alt="Signature" className="absolute bottom-1 max-h-14 max-w-full object-contain" />
                ) : (
                  "Stamp / Signature"
                )}
              </div>
              <p className="font-bold text-xs uppercase">Authorized Signatory</p>
              <p className="text-[10px] text-zinc-500 mt-1">For {settings?.company_name}</p>
            </div>
          </div>
          
          <div className="text-center text-[10px] text-zinc-400 mt-12">
            Return Module Generated by Softraxa ERP Component
          </div>
        </div>
      </div>
    </div>
  );
}
