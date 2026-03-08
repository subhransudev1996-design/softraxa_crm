"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, Mail, ArrowLeft } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

interface InvoiceGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  project: any;
  client: any;
}

export function InvoiceGenerator({ isOpen, onClose, invoice, project, client }: InvoiceGeneratorProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    const content = document.getElementById('printable-invoice');
    if (!content) return;

    const printWindow = window.open('', '', 'width=900,height=800');
    if (!printWindow) {
      alert('Please allow popups to print invoices.');
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${invoice.id?.substring(0, 8)}</title>
          ${styles}
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
              #printable-invoice { padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
            }
            body { background: white; padding: 2rem; margin: 0; }
          </style>
        </head>
        <body>
          <div id="printable-invoice" class="bg-white p-8">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    // For maximum compatibility with modern CSS (Tailwind 4), 
    // we use the native print dialog which allows users to "Save as PDF"
    // This avoids the "lab" color parsing errors caused by html2canvas
    handlePrint();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Document">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-hide invoice-container">
        {/* Actions */}
        <div className="flex gap-3 sticky top-0 bg-white/80 backdrop-blur-md pb-4 z-20">
          <Button onClick={handlePrint} className="flex-1 bg-black text-white rounded-xl h-11">
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1 rounded-xl h-11 border-zinc-200">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        </div>

        {/* Invoice Preview */}
        <div className="bg-white p-8 border border-zinc-100 rounded-2xl shadow-soft print:shadow-none print:border-none print:p-0 print:m-0" id="printable-invoice">
          <div className="flex justify-between items-start mb-12">
            <div>
              <img src="/logo.png" alt="Company Logo" className="h-12 w-auto mb-4" />
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest space-y-1">
                <p>Softraxa Technologies</p>
                <p>Bhubaneswar, Odisha, India</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-black uppercase tracking-tighter mb-1">Invoice</h1>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">#{invoice.id?.substring(0, 8).toUpperCase()}</p>
              
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest space-y-1">
                <p>Date: {new Date(invoice.created_at || new Date()).toLocaleDateString()}</p>
                <p>Due Date: {new Date(invoice.due_date || new Date()).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12 pb-12 border-b border-zinc-100">
            <div>
              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-3">Bill To</p>
              <p className="text-sm font-black text-black">{client?.full_name || 'Valued Client'}</p>
              <p className="text-[11px] font-medium text-zinc-500 mt-1">{client?.email}</p>
              <p className="text-[11px] font-medium text-zinc-500">{client?.phone}</p>
              <p className="text-[11px] font-medium text-zinc-500 max-w-[200px] mt-2">{client?.address}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-3">Project Context</p>
              <p className="text-sm font-black text-black">{project?.name || 'General Services'}</p>
              <p className="text-[11px] font-medium text-zinc-500 mt-1">{project?.status} Development Stream</p>
            </div>
          </div>

          <table className="w-full mb-12">
            <thead>
              <tr className="border-b-2 border-zinc-900">
                <th className="text-left py-4 text-[10px] font-black uppercase tracking-widest">Description</th>
                <th className="text-right py-4 text-[10px] font-black uppercase tracking-widest">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              <tr>
                <td className="py-6">
                  <p className="text-sm font-bold text-black">{invoice.notes || 'Project Initialization & Advanced Resource Allocation'}</p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-1">Strategic stream setup and initial roadmap deployment.</p>
                </td>
                <td className="py-6 text-right font-black text-sm text-black">
                  ₹{invoice.amount?.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end pt-6">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-black">₹{invoice.amount?.toLocaleString()}</span>
              </div>
              <div className="h-px bg-zinc-100 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black text-black uppercase tracking-[0.2em]">Grand Total</span>
                <span className="text-xl font-black text-black">₹{invoice.amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-12 border-t border-zinc-50 text-center">
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-2">Thank you for your partnership</p>
            <p className="text-[9px] font-medium text-zinc-400 italic">This is a system generated document. No signature required.</p>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            /* Hide the entire page content */
            body {
              visibility: hidden;
              background: white !important;
            }
            
            /* Make the invoice container and its children visible */
            #printable-invoice,
            #printable-invoice * {
              visibility: visible;
            }

            /* Position the invoice at the very top of the printed page */
            #printable-invoice {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
            }

            /* Ensure background colors and images are printed */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Hide specific UI elements that shouldn't be on the invoice */
            .print\\:hidden,
            button,
            [role="dialog"] > button,
            .fixed,
            header,
            aside {
              display: none !important;
            }

            /* Remove any scroll-related clipping */
            html, body, .invoice-container, [role="dialog"] {
              height: auto !important;
              overflow: visible !important;
            }
          }
        `}</style>
      </div>
    </Modal>
  );
}
