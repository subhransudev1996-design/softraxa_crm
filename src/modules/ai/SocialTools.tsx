"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy, Check, Send, Zap, RotateCcw,
    Sparkles, MessageSquare, Hash, LayoutGrid,
    ChevronRight, ArrowRight, Share2, Star,
    Type, Palette
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GeneratorProps {
    onCopy?: (text: string) => void;
}

// --- Shared Components ---

const OutputContainer = ({ title, content, onCopy }: { title: string, content: string, onCopy: (text: string) => void }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        onCopy(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{title}</h4>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 rounded-xl text-zinc-500 hover:text-black hover:bg-zinc-100"
                >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span className="ml-2 text-[10px] font-bold uppercase">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
            </div>
            <div className="p-8 rounded-[2rem] bg-zinc-900 text-zinc-100 text-sm font-medium leading-relaxed shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 whitespace-pre-wrap">{content}</div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Star className="w-12 h-12" />
                </div>
            </div>
        </motion.div>
    );
};



// --- Caption Generator ---

export function CaptionGenerator() {
    const [context, setContext] = React.useState('');
    const [tone, setTone] = React.useState('Professional');
    const [generating, setGenerating] = React.useState(false);
    const [result, setResult] = React.useState<string | null>(null);

    const handleGenerate = () => {
        if (!context) return;
        setGenerating(true);
        setTimeout(() => {
            const templates = {
                Professional: `Experience the next evolution of ${context}. Precision-engineered for modern enterprises. 🛠️ #softraxa #pro`,
                Witty: `We like our coffee strong and our ${context} stronger. ☕️⚡️ Built different. #builtwithsoftraxa`,
                Persuasive: `Stop settling for average. Elevate your ${context} with our strategic framework. The future doesn't wait. 🚀`
            };
            setResult(templates[tone as keyof typeof templates]);
            setGenerating(false);
        }, 1200);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Caption Crafter</h2>
                    <p className="text-sm text-zinc-500 font-medium">Turn images into stories. Select your strategic tone and provide context.</p>
                </div>

                <div className="space-y-6">
                    <div className="flex gap-2">
                        {['Professional', 'Witty', 'Persuasive'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTone(t)}
                                className={cn(
                                    "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    tone === t ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Visual Context</label>
                        <Input
                            placeholder="e.g. New dashboard launch UI..."
                            className="h-14 rounded-2xl bg-white border border-zinc-200 shadow-soft"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || !context}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {generating ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                        ) : (
                            <>
                                <MessageSquare className="w-5 h-5 fill-current" />
                                <span className="font-bold">Architect Caption</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="relative">
                {result ? (
                    <OutputContainer
                        title="Engineered Caption"
                        content={result}
                        onCopy={(text) => navigator.clipboard.writeText(text)}
                    />
                ) : (
                    <div className="h-full min-h-[400px] border-2 border-dashed border-zinc-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-200">
                            <Type className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Awaiting Narrative Context</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Hashtag Generator ---

export function HashtagGenerator() {
    const [niche, setNiche] = React.useState('');
    const [generating, setGenerating] = React.useState(false);
    const [result, setResult] = React.useState<string | null>(null);

    const handleGenerate = () => {
        if (!niche) return;
        setGenerating(true);
        setTimeout(() => {
            const generated = `#${niche.replace(/\s+/g, '')} #StrategicSuccess #SoftraxaSystem #InnovationStream #TechArchitect #FutureReady #BusinessGrowth #ModernEnterprise #DigitalTransformation #ScalePoint`;
            setResult(generated);
            setGenerating(false);
        }, 1000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Hashtag Architect</h2>
                    <p className="text-sm text-zinc-500 font-medium">Discover intelligent clusters that optimize your visibility across platforms.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Business Niche</label>
                        <Input
                            placeholder="e.g. Luxury Real Estate, SaaS Development..."
                            className="h-14 rounded-2xl bg-white border border-zinc-200 shadow-soft"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || !niche}
                        className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {generating ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                        ) : (
                            <>
                                <Hash className="w-5 h-5" />
                                <span className="font-bold">Discover Cluster</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="relative">
                {result ? (
                    <div className="space-y-6">
                        <OutputContainer
                            title="Cloud of Reach"
                            content={result}
                            onCopy={(text) => navigator.clipboard.writeText(text)}
                        />
                        <div className="p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Reach Prediction</p>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-3 bg-zinc-200 rounded-full overflow-hidden">
                                    <div className="w-[85%] h-full bg-purple-500 rounded-full" />
                                </div>
                                <span className="text-[10px] font-black text-purple-600">85% OPTIMIZED</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] border-2 border-dashed border-zinc-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-200">
                            <Hash className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Awaiting Semantic Niche</p>
                    </div>
                )}
            </div>
        </div>
    );
}
