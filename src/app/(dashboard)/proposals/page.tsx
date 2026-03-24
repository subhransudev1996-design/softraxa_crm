"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Plus, Search, Filter, FileSignature, Sparkles, Files, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProposalGeneratorModal } from '@/modules/crm/components/ProposalGeneratorModal';
import { ContractGeneratorModal } from '@/modules/crm/components/ContractGeneratorModal';
import { motion } from 'framer-motion';

export default function ProposalsPage() {
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black flex items-center gap-3">
            Commercial <span className="font-light text-zinc-400">Documents</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Generate project proposals and contract agreements for your stakeholders.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Proposal Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="group cursor-pointer"
          onClick={() => setIsProposalOpen(true)}
        >
          <Card className="h-full border-zinc-100 hover:border-black/10 transition-all hover:shadow-soft relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-bl-full -mr-16 -mt-16 group-hover:bg-zinc-100 transition-colors" />
            <CardContent className="p-8">
              <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-all duration-500">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-3">Project Proposal</h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                Generate high-conversion technical proposals for your leads. Includes project overview, feature breakdown, cost matrix, and timelines.
              </p>
              <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">
                Initialize Proposal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contract Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="group cursor-pointer"
          onClick={() => setIsContractOpen(true)}
        >
          <Card className="h-full border-zinc-100 hover:border-black/10 transition-all hover:shadow-soft relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-bl-full -mr-16 -mt-16 group-hover:bg-zinc-100 transition-colors" />
            <CardContent className="p-8">
              <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-all duration-500">
                <FileSignature className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-3">Service Agreement</h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                Create legally-framed service agreements and contracts for finalized deals. Customizable milestones, IP rights, and payment schedules.
              </p>
              <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">
                Draft Agreement <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-6 border-dashed border-zinc-200 bg-transparent flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
              <Files className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-700">Storage Coming Soon</p>
              <p className="text-[10px] text-zinc-400">Centralized document repository is currently in development.</p>
            </div>
         </Card>
         <Card className="p-6 border-dashed border-zinc-200 bg-transparent flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-700">AI Enhancement</p>
              <p className="text-[10px] text-zinc-400">Smart content generation and proofreading integration.</p>
            </div>
         </Card>
      </div>

      <ProposalGeneratorModal 
        isOpen={isProposalOpen} 
        onClose={() => setIsProposalOpen(false)} 
      />
      
      <ContractGeneratorModal 
        isOpen={isContractOpen} 
        onClose={() => setIsContractOpen(false)} 
      />
    </div>
  );
}
