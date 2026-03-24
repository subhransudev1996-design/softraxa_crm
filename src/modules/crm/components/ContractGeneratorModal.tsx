"use client";
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, Copy, Check, Info,
  Plus, Trash2, ShieldCheck, Calendar,
  DollarSign, Briefcase, Download
} from 'lucide-react';
import { generateContractMarkdown, ContractData } from '../utils/contractTemplates';
import { DocumentTemplate } from './DocumentTemplate';
import { cn } from '@/lib/utils';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ContractGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: {
    name: string;
    company?: string;
  };
}

export function ContractGeneratorModal({ isOpen, onClose, lead }: ContractGeneratorModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // State
  const [clientName, setClientName] = useState(lead?.name || "");
  const [companyName, setCompanyName] = useState(lead?.company || "");
  const [projectName, setProjectName] = useState("Custom Digital Project");
  const [scopeOfWork, setScopeOfWork] = useState(`The Service Provider will develop a ${projectName} specifically tailored to the Client's business needs. This includes all core modules, database architecture, and frontend design as per the technical specifications.`);
  const [cost, setCost] = useState("₹1,60,000");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");
  const [finalContent, setFinalContent] = useState("");
  const [paymentSchedule, setPaymentSchedule] = useState([
    { milestone: "Booking Amount / Advance", amount: "₹48,000" },
    { milestone: "Development Completion", amount: "₹64,000" },
    { milestone: "Handover & Go-Live", amount: "₹48,000" }
  ]);

  const contractData: ContractData = {
    clientName: companyName || clientName || "Valued Client",
    projectName,
    scopeOfWork,
    totalCost: cost,
    startDate,
    endDate: endDate || "Project Completion Date",
    paymentSchedule,
    authorName: "Authorized Signatory",
    companyName: "Softraxa Solutions"
  };

  const generatedText = generateContractMarkdown(contractData);

  // Sync generated text to final content
  React.useEffect(() => {
    if (activeTab === 'preview' && !finalContent) {
      setFinalContent(generatedText);
    }
  }, [activeTab, generatedText, finalContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalContent || generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    const element = document.getElementById('contract-pdf-container');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `Contract_${contractData.clientName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().from(element).set(opt).save().then(() => setIsGenerating(false));
  };

  const handleResetPreview = () => {
    if (confirm("Reset will discard your manual edits. Continue?")) {
      setFinalContent(generatedText);
    }
  };

  const addMilestone = () => setPaymentSchedule([...paymentSchedule, { milestone: "New Milestone", amount: "₹0" }]);
  const removeMilestone = (idx: number) => setPaymentSchedule(paymentSchedule.filter((_, i) => i !== idx));
  const updateMilestone = (idx: number, field: 'milestone' | 'amount', val: string) => {
    const newSchedule = [...paymentSchedule];
    newSchedule[idx][field] = val;
    setPaymentSchedule(newSchedule);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contract Agreement Builder"
      className="max-w-4xl"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl mb-8 self-start shadow-inner border border-zinc-200">
          <button onClick={() => setActiveTab('edit')} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all", activeTab === 'edit' ? "bg-white text-black shadow-soft" : "text-zinc-400 hover:text-zinc-600")}>Drafting</button>
          <button onClick={() => setActiveTab('preview')} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all", activeTab === 'preview' ? "bg-white text-black shadow-soft" : "text-zinc-400 hover:text-zinc-600")}>Agreement View</button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === 'edit' ? (
            <div className="space-y-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Parties & Project</h3>
                  </div>
                  {!lead && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-12 rounded-2xl" placeholder="e.g. John Doe" />
                      <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12 rounded-2xl" placeholder="e.g. Acme Corp" />
                    </div>
                  )}
                  <Input label="Agreement Subject (Project)" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="h-12 rounded-2xl" />
                  <div className="space-y-1.5 px-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Scope of Work / Deliverables</label>
                    <textarea 
                      value={scopeOfWork} 
                      onChange={(e) => setScopeOfWork(e.target.value)}
                      className="w-full min-h-[120px] p-4 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none leading-relaxed bg-zinc-50/20"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Chronology & Commercials</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Effective Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-12 rounded-2xl" />
                    <Input label="Agreement Expiry" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-12 rounded-2xl" />
                  </div>
                  <Input label="Contract Value" value={cost} onChange={(e) => setCost(e.target.value)} className="h-12 rounded-2xl" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Milestone-Based Disbursements</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={addMilestone} className="h-8 rounded-lg text-[9px] font-black uppercase bg-zinc-50 border border-zinc-100">
                    <Plus className="w-3 h-3 mr-1" /> Add Milestone
                  </Button>
                </div>
                <div className="space-y-3">
                  {paymentSchedule.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="flex-1 h-11 rounded-xl border border-zinc-200 px-4 text-xs font-bold bg-zinc-50/50" value={p.milestone} onChange={(e) => updateMilestone(i, 'milestone', e.target.value)} />
                      <input className="w-32 h-11 rounded-xl border border-zinc-200 px-4 text-xs font-black text-center" value={p.amount} onChange={(e) => updateMilestone(i, 'amount', e.target.value)} />
                      <Button variant="ghost" size="icon" onClick={() => removeMilestone(i)} className="h-11 w-11 rounded-xl text-zinc-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Final Agreement Editor</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={handleResetPreview} className="h-8 rounded-lg text-[9px] font-black uppercase text-zinc-400">
                  Re-initialize
                </Button>
              </div>
              <textarea 
                value={finalContent}
                onChange={(e) => setFinalContent(e.target.value)}
                className="w-full min-h-[500px] p-10 rounded-[2.5rem] bg-white border border-zinc-100 shadow-soft font-serif text-sm text-zinc-700 leading-relaxed resize-none focus:outline-none"
              />
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-wider">
                  This legally framed agreement is ready for signature. Ensure all dates and commercial terms are verified before sharing.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-zinc-100 flex justify-between items-center bg-white mt-auto">
          <Button variant="ghost" onClick={onClose} className="rounded-xl px-8 h-12 text-zinc-400 uppercase tracking-widest text-[10px] font-black">Back to Draft</Button>
          <div className="flex gap-3">
            <Button 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              variant="outline"
              className="h-12 rounded-xl px-8 text-[10px] font-black uppercase tracking-widest border-zinc-200 text-zinc-600 hover:text-black"
            >
              <Download className={cn("w-4 h-4 mr-2", isGenerating && "animate-bounce")} />
              {isGenerating ? "Processing..." : "Export as PDF"}
            </Button>
            <Button onClick={handleCopy} className={cn("h-12 rounded-xl px-8 text-[10px] font-black uppercase tracking-widest transition-all", copied ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-zinc-800 shadow-elevated")}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Contract Copied!" : "Copy Markdown"}
            </Button>
          </div>
        </div>

        {/* Hidden Container for PDF Rendering */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div id="contract-pdf-container">
            <DocumentTemplate 
              type="contract"
              title="Service Agreement"
              clientName={contractData.clientName}
              projectName={contractData.projectName}
              content={finalContent || generatedText}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
