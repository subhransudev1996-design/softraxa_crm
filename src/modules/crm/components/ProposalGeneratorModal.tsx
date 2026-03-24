"use client";
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, Copy, Check, Download, 
  Plus, Trash2, Send, Info, LayoutGrid,
  FileSearch, DollarSign, Clock, ListChecks, Printer
} from 'lucide-react';
import { generateProposalMarkdown, ProposalData } from '../utils/proposalTemplates';
import { DocumentTemplate } from './DocumentTemplate';
import { cn } from '@/lib/utils';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ProposalGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: {
    name: string;
    company?: string;
  };
}

const defaultFeatures = [
  "User Authentication: OTP verification, Secure registration & Profile management",
  "Product Management: Categories, Subcategories & Rich Product Listings",
  "Checkout System: Cart functionality, Order summary & Address management",
  "Payment Integration: Secure Gateway (UPI/Net Banking/Cards)",
  "Order Tracking: Real-time status updates & Order history",
  "Admin Control Panel: Comprehensive lead/order/user management dashboard"
];

export function ProposalGeneratorModal({ isOpen, onClose, lead }: ProposalGeneratorModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // State
  const [clientName, setClientName] = useState(lead?.name || "");
  const [companyName, setCompanyName] = useState(lead?.company || "");
  const [projectName, setProjectName] = useState("Custom Digital Solution");
  const [overview, setOverview] = useState(`The proposed development will enable your business to reach more customers and streamline operations through a ${projectName}. This platform will improve customer experience and help expand your reach.`);
  const [features, setFeatures] = useState<string[]>(defaultFeatures);
  const [cost, setCost] = useState("₹1,60,000");
  const [timeline, setTimeline] = useState("5–7 Weeks");
  const [finalContent, setFinalContent] = useState("");
  const [paymentTerms, setPaymentTerms] = useState([
    { percentage: "30", description: "Advance - Project Kickoff" },
    { percentage: "40", description: "Midway - Core Development" },
    { percentage: "30", description: "Final - Deployment" }
  ]);

  const proposalData: ProposalData = {
    clientName: companyName || clientName || "Valued Client",
    projectName,
    overview,
    features,
    cost,
    timeline,
    paymentTerms,
    authorName: "Softraxa Team",
    companyName: "Softraxa Solutions",
    contactInfo: "+91-XXXXXXXXXX | info@softraxa.com"
  };

  const generatedText = generateProposalMarkdown(proposalData);

  // Sync generated text to final content if tab switches and final content is empty
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
    const element = document.getElementById('pdf-document-container');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `Proposal_${proposalData.clientName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().from(element).set(opt).save().then(() => setIsGenerating(false));
  };

  const handleResetPreview = () => {
    if (confirm("Reset will discard your manual edits in the preview. Continue?")) {
      setFinalContent(generatedText);
    }
  };

  const addFeature = () => setFeatures([...features, "New Feature: Description of the feature"]);
  const removeFeature = (idx: number) => setFeatures(features.filter((_, i) => i !== idx));
  const updateFeature = (idx: number, val: string) => {
    const newFeatures = [...features];
    newFeatures[idx] = val;
    setFeatures(newFeatures);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Proposal Generator"
      className="max-w-4xl"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Tabs */}
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl mb-8 self-start shadow-inner border border-zinc-200">
          <button 
            onClick={() => setActiveTab('edit')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              activeTab === 'edit' ? "bg-white text-black shadow-soft" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            Design & Edit
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              activeTab === 'preview' ? "bg-white text-black shadow-soft" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            Proof Preview
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === 'edit' ? (
            <div className="space-y-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSearch className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Base Information</h3>
                  </div>
                  {!lead && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-12 rounded-2xl" placeholder="e.g. John Doe" />
                      <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12 rounded-2xl" placeholder="e.g. Acme Corp" />
                    </div>
                  )}
                  <Input label="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="h-12 rounded-2xl" />
                  <div className="space-y-1.5 px-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Project Overview</label>
                    <textarea 
                      value={overview} 
                      onChange={(e) => setOverview(e.target.value)}
                      className="w-full min-h-[120px] p-4 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Commercials & Timeline</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Total Cost" value={cost} onChange={(e) => setCost(e.target.value)} className="h-12 rounded-2xl" />
                    <Input label="Duration" value={timeline} onChange={(e) => setTimeline(e.target.value)} className="h-12 rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Payment Strategy</label>
                    {paymentTerms.map((term, i) => (
                      <div key={i} className="flex gap-2">
                        <input 
                          className="w-16 h-10 rounded-xl border border-zinc-200 text-center text-xs font-bold"
                          value={term.percentage}
                          onChange={(e) => {
                            const newTerms = [...paymentTerms];
                            newTerms[i].percentage = e.target.value;
                            setPaymentTerms(newTerms);
                          }}
                        />
                        <input 
                          className="flex-1 h-10 rounded-xl border border-zinc-200 px-4 text-xs font-medium"
                          value={term.description}
                          onChange={(e) => {
                            const newTerms = [...paymentTerms];
                            newTerms[i].description = e.target.value;
                            setPaymentTerms(newTerms);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Feature Infrastructure</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={addFeature} className="h-8 rounded-lg text-[9px] font-black uppercase bg-zinc-50 border border-zinc-100">
                    <Plus className="w-3 h-3 mr-1" /> Add Component
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {features.map((feature, i) => (
                    <div key={i} className="flex gap-2 group">
                      <div className="flex-1 relative">
                        <textarea 
                          value={feature}
                          onChange={(e) => updateFeature(i, e.target.value)}
                          className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-black/5 resize-none bg-zinc-50/30 font-medium"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeFeature(i)}
                        className="h-11 w-11 rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Document Editor</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={handleResetPreview} className="h-8 rounded-lg text-[9px] font-black uppercase text-zinc-400">
                  Reset Alignment
                </Button>
              </div>
              <textarea 
                value={finalContent}
                onChange={(e) => setFinalContent(e.target.value)}
                className="w-full min-h-[500px] p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 font-mono text-xs text-zinc-600 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-black/5"
              />
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-black text-white">
                <Info className="w-5 h-5 text-zinc-500 shrink-0" />
                <p className="text-[10px] font-medium leading-relaxed">
                  This proposal is pre-formatted in <span className="text-white font-bold">Markdown</span>. You can copy and paste this directly into WhatsApp, Email, or any document editor for a professional look.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-zinc-100 flex justify-between items-center bg-white mt-auto">
          <Button variant="ghost" onClick={onClose} className="rounded-xl px-8 h-12 text-zinc-400 uppercase tracking-widest text-[10px] font-black">Discard</Button>
          <div className="flex gap-3">
            <Button 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              variant="outline"
              className="h-12 rounded-xl px-8 text-[10px] font-black uppercase tracking-widest border-zinc-200 text-zinc-600 hover:text-black"
            >
              <Download className={cn("w-4 h-4 mr-2", isGenerating && "animate-bounce")} />
              {isGenerating ? "Processing..." : "Download PDF Export"}
            </Button>
            <Button 
              onClick={handleCopy}
              className={cn(
                "h-12 rounded-xl px-8 text-[10px] font-black uppercase tracking-widest transition-all",
                copied ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-zinc-800 shadow-elevated"
              )}
            >
              {copied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Markdown</>}
            </Button>
          </div>
        </div>

        {/* Hidden Container for PDF Rendering */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div id="pdf-document-container">
            <DocumentTemplate 
              type="proposal"
              title="Project Proposal"
              clientName={proposalData.clientName}
              projectName={proposalData.projectName}
              content={finalContent || generatedText}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
