"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, PenTool, Hash, MessageSquare,
    Copy, Check, Brain, Zap, Send,
    LayoutGrid, Share2, Type, Palette,
    ZapIcon, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CaptionGenerator, HashtagGenerator } from './SocialTools';

const tools = [
    {
        id: 'captions',
        title: 'Caption Crafter',
        description: 'Generate engaging captions with personality and strategic call-to-actions.',
        icon: MessageSquare,
        color: 'bg-emerald-500',
        lightColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        component: CaptionGenerator
    },
    {
        id: 'hashtags',
        title: 'Hashtag Architect',
        description: 'Intelligent hashtag clusters designed for maximum reach and discoverability.',
        icon: Hash,
        color: 'bg-purple-500',
        lightColor: 'bg-purple-50',
        textColor: 'text-purple-600',
        component: HashtagGenerator
    }
];

export function AIOverview() {
    const [activeTool, setActiveTool] = React.useState<string | null>(null);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    const ActiveComponent = activeTool ? tools.find(t => t.id === activeTool)?.component : null;

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-black flex items-center gap-3">
                        AI <span className="font-light text-zinc-400">Suite</span>
                        <div className="flex items-center gap-1 bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest mt-1 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                            <Zap className="w-3 h-3 fill-current" />
                            Pro
                        </div>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm">Strategic content intelligence powered by advanced language models.</p>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {!activeTool ? (
                    <motion.div
                        key="dashboard"
                        variants={container}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {tools.map((tool) => (
                            <motion.div key={tool.id} variants={item}>
                                <Card
                                    onClick={() => setActiveTool(tool.id)}
                                    className="group cursor-pointer border-zinc-100 shadow-soft hover:shadow-elevated transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white/50 backdrop-blur-sm relative"
                                >
                                    <CardContent className="p-10">
                                        <div className={cn(
                                            "w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg",
                                            tool.color, "text-white"
                                        )}>
                                            <tool.icon className="w-8 h-8" />
                                        </div>

                                        <h3 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight group-hover:translate-x-1 transition-transform">{tool.title}</h3>
                                        <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-8">
                                            {tool.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", tool.textColor)}>
                                                Strategic Tool
                                            </span>
                                            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                                <ZapIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Subtle hover decorations */}
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-zinc-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Card>
                            </motion.div>
                        ))}

                        {/* AI Insights Banner */}
                        <motion.div variants={item} className="md:col-span-3">
                            <div className="relative overflow-hidden rounded-[3rem] bg-zinc-900 p-12 text-white shadow-2xl">
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                    <div className="space-y-6 max-w-xl text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                            <Brain className="w-3 h-3" /> System Intelligence
                                        </div>
                                        <h2 className="text-4xl font-black leading-tight tracking-tighter">Your AI creative partner is ready.</h2>
                                        <p className="text-zinc-400 text-sm font-medium leading-loose">
                                            Softraxa AI combines multi-modal context from your CRM data with state-of-the-art generation to help you scale your business presence effortlessly.
                                        </p>
                                    </div>
                                    <div className="shrink-0">
                                        <div className="w-48 h-48 bg-gradient-to-br from-white/20 to-transparent rounded-full border border-white/10 flex items-center justify-center relative animate-pulse">
                                            <Sparkles className="w-20 h-20 text-white" />
                                            <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl" />
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-zinc-800 rounded-full blur-[80px] -ml-32 -mb-32 opacity-50" />
                            </div>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="tool-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <Button
                                onClick={() => setActiveTool(null)}
                                variant="ghost"
                                className="hover:bg-zinc-100 rounded-2xl px-4 py-2 text-zinc-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                            >
                                <div className="w-6 h-6 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
                                    <LayoutGrid className="w-3 h-3" />
                                </div>
                                Back to Tools
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", tools.find(t => t.id === activeTool)?.color)} />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Session</span>
                            </div>
                        </div>

                        {ActiveComponent && <ActiveComponent />}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
