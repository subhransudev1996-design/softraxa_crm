import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Printer } from "lucide-react";
import QRCode from "react-qr-code";

export default function InvoicePreview({ invoiceId, onBack }: { invoiceId: number, onBack: () => void }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [invoices, customers, s]: any = await Promise.all([
          invoke("get_invoices"),
          invoke("get_customers"),
          invoke("get_settings")
        ]);

        const inv = invoices.find((i: any) => i.id === invoiceId);
        if (inv) {
          inv.parsedItems = JSON.parse(inv.items);
          setInvoice(inv);
          setCustomer(customers.find((c: any) => c.id === inv.customer_id));
        }
        setSettings(s || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [invoiceId]);

  if (loading) return <div className="p-12 text-center text-zinc-500">Loading document...</div>;
  if (!invoice) return <div className="p-12 text-center text-red-500">Invoice not found.</div>;

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
            <h2 className="text-2xl font-bold tracking-tight text-white">Invoice Preview</h2>
            <p className="text-zinc-500 font-medium text-xs mt-1">A4 Standard Format</p>
          </div>
        </div>
        <button onClick={handlePrint} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-elevated">
          <Printer className="w-4 h-4" /> Print PDF
        </button>
      </div>

      {/* Printable A4 Container */}
      <div className="flex justify-center print:block print:w-full print:m-0">
        <div className="bg-white text-black print:shadow-none shadow-2xl w-[210mm] min-h-[297mm] p-10 font-sans border border-zinc-200 printable-a4 mx-auto">
          
          <div className="text-center font-bold text-xl uppercase tracking-widest border-b-2 border-black pb-4 mb-6">
            Tax Invoice
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
                <span className="font-bold">Invoice No:</span>
                <span className="font-mono">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="font-bold">Date:</span>
                <span>{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Place of Supply:</span>
                <span>State Code - {customer?.state_code || 'Unregistered'}</span>
              </div>
            </div>
          </div>

          <div className="border border-black p-4 mb-8 text-sm bg-zinc-50 round">
            <h3 className="font-bold uppercase mb-2 border-b border-zinc-200 pb-2">Billed To</h3>
            <p className="font-bold text-base">{customer?.name}</p>
            <p className="whitespace-pre-wrap leading-tight text-zinc-700 mt-1">{customer?.address || 'No Address Provided'}</p>
            <div className="mt-2 text-xs">
              <p><strong>GSTIN/UIN:</strong> {customer?.gstin || 'Unregistered'}</p>
              <p><strong>State Code:</strong> {customer?.state_code || 'N/A'}</p>
            </div>
          </div>

          {/* Table Details */}
          <table className="w-full text-xs border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-zinc-100 font-bold text-center border-b border-black">
                <th className="border-r border-black p-2 w-10">#</th>
                <th className="border-r border-black p-2 text-left">Description of Goods/Services</th>
                <th className="border-r border-black p-2">HSN/SAC</th>
                <th className="border-r border-black p-2">Qty</th>
                <th className="border-r border-black p-2">Rate</th>
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
              {invoice.parsedItems?.map((item: any, i: number) => {
                const taxable = item.price * item.qty;
                const tax_amt = taxable * (item.gstRate / 100);
                const total = taxable + tax_amt;
                
                return (
                  <tr key={i} className="border-b border-zinc-300">
                    <td className="border-r border-black p-2 text-center">{i + 1}</td>
                    <td className="border-r border-black p-2 font-bold">{item.name}</td>
                    <td className="border-r border-black p-2 text-center font-mono">{item.hsnSac || '---'}</td>
                    <td className="border-r border-black p-2 text-center">{item.qty}</td>
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
                <td colSpan={5} className="border-r border-black p-2 text-right uppercase">Total</td>
                <td className="border-r border-black p-2 text-right font-mono">₹{invoice.subtotal.toFixed(2)}</td>
                {!isInterState ? (
                  <>
                    <td className="border-r border-black p-2 text-right font-mono">₹{invoice.cgst_total.toFixed(2)}</td>
                    <td className="border-r border-black p-2 text-right font-mono">₹{invoice.sgst_total.toFixed(2)}</td>
                  </>
                ) : (
                  <td className="border-r border-black p-2 text-right font-mono">₹{invoice.igst_total.toFixed(2)}</td>
                )}
                <td className="p-2 text-right font-mono">₹{invoice.grand_total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer Subsections */}
          <div className="flex justify-between items-start pt-6 mb-4">
            <div className="w-1/3 pr-4">
              <h3 className="font-bold text-xs uppercase mb-1">Company Bank Details</h3>
              <p className="whitespace-pre-wrap font-mono text-xs">{settings?.bank_details || 'No bank details provided.'}</p>
            </div>
            
            <div className="w-1/3 px-4 flex flex-col items-center justify-start border-l border-r border-zinc-200">
              {settings?.upi_id ? (
                <>
                  <h3 className="font-bold text-[10px] uppercase mb-1 text-zinc-500 tracking-widest">Scan & Pay via UPI</h3>
                  <div className="bg-white p-1.5 border border-zinc-200 rounded-lg shadow-sm">
                    <QRCode value={`upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.company_name || '')}&cu=INR`} size={64} level="M" />
                  </div>
                  <p className="font-mono text-[10px] mt-1 text-zinc-600 font-bold">{settings.upi_id}</p>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400 text-xs text-center px-4">UPI Payments Disabled</div>
              )}
            </div>

            <div className="w-1/3 pl-4 text-center">
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
            Generated by Softraxa Billing Software
          </div>
        </div>
      </div>
    </div>
  );
}
