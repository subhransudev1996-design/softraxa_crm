"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileText, Send, TrendingUp, Briefcase, ShieldCheck, AlertCircle, Sparkles, RotateCcw, Zap } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { callGemini } from '@/lib/aiService';

interface ProposalGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    client: any;
}

export function ProposalGenerator({ isOpen, onClose, client }: ProposalGeneratorProps) {
    const [step, setStep] = React.useState<'form' | 'edit' | 'preview'>('form');
    const [projectDetails, setProjectDetails] = React.useState({
        name: '',
        clientType: 'normal' as 'premium' | 'normal',
        projectType: 'website' as 'website' | 'app',
    });
    const [generating, setGenerating] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [proposalData, setProposalData] = React.useState({
        title: 'Strategic Solution Proposal',
        overview: '',
        scope: '',
        timeline: 'Approx. 12-16 weeks',
        investment: 'Custom Pricing (Request Quote)',
    });

    const getFramework = () => {
        if (projectDetails.projectType === 'app') return 'Flutter';
        if (projectDetails.projectType === 'website') {
            return projectDetails.clientType === 'premium' ? 'Next.js / MERN' : 'WordPress';
        }
        return 'Modern Web Stack';
    };

    const handleGenerateAI = async () => {
        if (!projectDetails.name) return;
        setGenerating(true);
        setError(null);

        const framework = getFramework();
        const isPremium = projectDetails.clientType === 'premium';

        const prompt = `
            You are a senior strategic solution architect at Softraxa Technologies.
            Generate a high-end business proposal for the project: "${projectDetails.name}".
            Client: ${client?.full_name}
            Client Industry: ${client?.industry}
            Project Type: ${projectDetails.projectType}
            Target Framework: ${framework}
            Strategic Tier: ${isPremium ? 'Premium / Enterprise' : 'Standard'}

            Return the response in the following JSON format ONLY:
            {
                "overview": "A compelling 3-4 sentence strategic overview of why this project matters and how we will solve it using ${framework}.",
                "scope": "A bulleted list (using numbers 1. 2. 3.) of 5 key strategic phases reflecting the ${framework} development lifecycle.",
                "timeline": "e.g. 12-16 weeks",
                "investment": "e.g. $15,000 - $30,000"
            }
        `;

        try {
            const rawResponse = await callGemini(prompt);
            // Clean up the response in case any markdown code blocks are returned
            const cleanJson = rawResponse.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            setProposalData({
                title: `${projectDetails.name} - Strategic Proposal`,
                overview: parsed.overview,
                scope: parsed.scope,
                timeline: parsed.timeline,
                investment: parsed.investment,
            });
            setStep('edit');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'AI Generation failed. Check your API key in settings.');
        } finally {
            setGenerating(false);
        }
    };

    const handlePrint = () => {
        const content = document.getElementById('printable-proposal');
        if (!content) return;

        const printWindow = window.open('', '', 'width=900,height=800');
        if (!printWindow) {
            alert('Please allow popups to print documents.');
            return;
        }

        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(el => el.outerHTML)
            .join('\n');

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proposal - ${client?.full_name}</title>
          ${styles}
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
              #printable-proposal { padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
              .no-print { display: none !important; }
            }
            body { background: white; padding: 2rem; margin: 0; font-family: sans-serif; }
            .proposal-section { margin-bottom: 2rem; border-bottom: 1px solid #f4f4f5; padding-bottom: 1.5rem; }
            .proposal-section:last-child { border-bottom: none; }
          </style>
        </head>
        <body>
          <div id="printable-proposal" class="bg-white p-8">
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Strategic Proposal Generator">
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-hide">
                {step === 'form' ? (
                    <div className="space-y-8 py-4">
                        <div className="space-y-2 text-center">
                            <h3 className="text-xl font-black text-black tracking-tight">Project Configuration</h3>
                            <p className="text-xs text-zinc-500 font-medium">Define the strategic parameters for the AI generation.</p>
                        </div>

                        <div className="space-y-6">
                            <Input
                                label="Project Name"
                                placeholder="e.g. Nexus E-commerce Platform"
                                value={projectDetails.name}
                                onChange={(e) => setProjectDetails({ ...projectDetails, name: e.target.value })}
                            />

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Client Classification</label>
                                <div className="flex gap-4">
                                    {['normal', 'premium'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setProjectDetails({ ...projectDetails, clientType: t as any })}
                                            className={cn(
                                                "flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all relative overflow-hidden group",
                                                projectDetails.clientType === t
                                                    ? "bg-black text-white shadow-lg"
                                                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                            )}
                                        >
                                            {t}
                                            {t === 'premium' && <Sparkles className={cn("absolute top-2 right-2 w-3 h-3 transition-colors", projectDetails.clientType === t ? "text-yellow-400" : "text-zinc-300")} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Project Type</label>
                                <div className="flex gap-4">
                                    {['website', 'app'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setProjectDetails({ ...projectDetails, projectType: t as any })}
                                            className={cn(
                                                "flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                                                projectDetails.projectType === t
                                                    ? "bg-zinc-900 text-white shadow-lg"
                                                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-black uppercase tracking-tight">System Recommendation</p>
                                    <p className="text-[10px] text-zinc-500 font-medium">
                                        Based on your selection, the AI will architect the proposal using
                                        <span className="text-black font-bold mx-1">{getFramework()}</span> framework.
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 animate-shake">
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                    <p className="text-[10px] font-bold text-red-600 leading-relaxed uppercase tracking-widest">{error}</p>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleGenerateAI}
                            disabled={generating || !projectDetails.name}
                            className="w-full bg-black text-white rounded-2xl h-14 shadow-elevated transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {generating ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                                    <span className="font-bold">Architecting with Gemini 2.5 Flash...</span>
                                </div>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span className="font-bold">Generate Strategic Proposal</span>
                                </>
                            )}
                        </Button>
                    </div>
                ) : step === 'edit' ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setStep('form')} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-2">
                                <RotateCcw className="w-3 h-3" /> Re-configure
                            </button>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                <Zap className="w-3 h-3 fill-current" /> AI Generated
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Input
                                label="Proposal Title"
                                value={proposalData.title}
                                onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                            />
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Strategic Overview</label>
                                <textarea
                                    className="w-full min-h-[120px] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 leading-relaxed"
                                    value={proposalData.overview}
                                    onChange={(e) => setProposalData({ ...proposalData, overview: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Scope of Work</label>
                                <textarea
                                    className="w-full min-h-[180px] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 leading-relaxed"
                                    value={proposalData.scope}
                                    onChange={(e) => setProposalData({ ...proposalData, scope: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Timeline"
                                    value={proposalData.timeline}
                                    onChange={(e) => setProposalData({ ...proposalData, timeline: e.target.value })}
                                />
                                <Input
                                    label="Investment Range"
                                    value={proposalData.investment}
                                    onChange={(e) => setProposalData({ ...proposalData, investment: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button onClick={() => setStep('preview')} className="w-full bg-black text-white rounded-2xl h-14 shadow-elevated transition-all active:scale-[0.98]">
                            Finalize Document Preview
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex gap-3 sticky top-0 bg-white/80 backdrop-blur-md pb-4 z-20">
                            <Button onClick={() => setStep('edit')} variant="outline" className="flex-1 rounded-2xl h-11 border-zinc-100 font-bold">
                                Back to Edit
                            </Button>
                            <Button onClick={handlePrint} className="flex-1 bg-black text-white rounded-2xl h-11 font-bold">
                                <Printer className="w-4 h-4 mr-2" /> Print Proposal
                            </Button>
                        </div>

                        {/* Proposal Preview */}
                        <div className="bg-white p-12 border border-zinc-100 rounded-3xl shadow-soft" id="printable-proposal">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-16">
                                <div>
                                    <img src="/logo.png" alt="Company Logo" className="h-12 w-auto mb-6" />
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] space-y-1">
                                        <p className="text-black font-black uppercase">Softraxa Technologies</p>
                                        <p>Strategic Development Center</p>
                                        <p>Bhubaneswar, Odisha, India</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 text-white rounded-full text-[8px] font-black uppercase tracking-widest mb-4">
                                        Confidential
                                    </div>
                                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none">Proposal</h1>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Ref: STRX-{new Date().getFullYear()}-{Math.floor(Math.random() * 9000) + 1000}</p>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="mb-16 grid grid-cols-2 gap-12 pb-12 border-b border-zinc-100">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-4">Presented To</p>
                                    <p className="text-xl font-black text-black">{client?.full_name}</p>
                                    <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-widest">{client?.industry} Vertical</p>
                                    <p className="text-[11px] font-medium text-zinc-400 mt-2 max-w-[240px] leading-relaxed">{client?.address}</p>
                                </div>
                                <div className="text-right flex flex-col justify-end">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date of Issuance</p>
                                    <p className="text-sm font-black text-black uppercase">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>

                            {/* Main Content Sections */}
                            <div className="space-y-16">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1.5 h-6 bg-zinc-900 rounded-full" />
                                        <h2 className="text-sm font-black text-black uppercase tracking-[0.2em]">01. Executive Overview</h2>
                                    </div>
                                    <p className="text-sm text-zinc-600 leading-relaxed font-medium pl-4 border-l border-zinc-100">{proposalData.overview}</p>
                                </section>

                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1.5 h-6 bg-zinc-900 rounded-full" />
                                        <h2 className="text-sm font-black text-black uppercase tracking-[0.2em]">02. Strategic Scope</h2>
                                    </div>
                                    <div className="bg-zinc-50/70 rounded-[2rem] p-8 border border-zinc-100/50 italic whitespace-pre-wrap text-sm text-zinc-700 font-medium leading-loose shadow-inner">
                                        {proposalData.scope}
                                    </div>
                                </section>

                                <div className="grid grid-cols-2 gap-12 h-40">
                                    <section className="flex flex-col justify-between p-8 rounded-3xl bg-zinc-50/50 border border-zinc-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Expected Timeline</h2>
                                        </div>
                                        <p className="text-xl font-black text-black">{proposalData.timeline}</p>
                                    </section>
                                    <section className="flex flex-col justify-between p-8 rounded-3xl bg-emerald-50/30 border border-emerald-100/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Estimated Investment</h2>
                                        </div>
                                        <p className="text-xl font-black text-zinc-900">{proposalData.investment}</p>
                                    </section>
                                </div>
                            </div>

                            {/* Signature Section */}
                            <div className="mt-32 pt-16 border-t border-zinc-100 grid grid-cols-2 gap-20">
                                <div className="space-y-8">
                                    <div className="h-12 border-b border-zinc-200 w-full" />
                                    <div>
                                        <p className="text-sm font-black text-black uppercase">Softraxa Technologies</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Authorized Signatory</p>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="h-12 border-b border-zinc-200 w-full" />
                                    <div>
                                        <p className="text-sm font-black text-black uppercase">{client?.full_name}</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Acceptance Signature</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-20 text-center">
                                <p className="text-[10px] font-black text-zinc-200 uppercase tracking-[0.5em] mb-4">Innovation • Excellence • Impact</p>
                                <div className="flex justify-center gap-1.5">
                                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-zinc-100" />)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
