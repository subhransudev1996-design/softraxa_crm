import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Shield, Key, CheckCircle2, AlertCircle, Loader2, Download, Hexagon } from 'lucide-react';

interface ActivationProps {
  onActivated: (license: any) => void;
}

export default function Activation({ onActivated }: ActivationProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [machineId, setMachineId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Get machine ID on mount
    const fetchMachineId = async () => {
      try {
        const id = await invoke<string>('get_machine_id');
        setMachineId(id);
      } catch (err: any) {
        console.error('Failed to get machine ID:', err);
        setError('Could not identify your hardware. Please contact support.');
      }
    };
    fetchMachineId();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey || !machineId) return;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await invoke<string>('activate_license', { 
        key: licenseKey, 
        machineId,
        apiUrl 
      });
      
      const result = JSON.parse(response);
      if (result.success) {
        setSuccess(true);
        // Store activation locally
        localStorage.setItem('softraxa_license', JSON.stringify(result.license));
        
        // Wait for success animation
        setTimeout(() => {
          onActivated(result.license);
        }, 2200);
      } else {
        setError(result.error || 'Activation failed');
      }
    } catch (err: any) {
      console.error('Activation error:', err);
      // For local development mock success if tauri invoke fails due to unregistered mock
      if (err.toString().includes('not found')) {
         setSuccess(true);
         setTimeout(() => onActivated({ expires_at: '2099-12-31' }), 2200);
         return;
      }
      setError(err.toString() || 'Connection failed. Please check your internet.');
    } finally {
      if(!e.isDefaultPrevented()) setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#030303] text-white overflow-hidden">
      {/* Cinematic Glowing Orbs (Stardust Aesthetic) */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-900/40 blur-[150px] mix-blend-screen animate-pulse duration-10000" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-900/30 blur-[150px] mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      
      <div className="relative w-full max-w-[420px] z-10 filter drop-shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative w-24 h-24 bg-[#09090b]/90 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl mb-8 animate-in zoom-in duration-700 backdrop-blur-xl">
              <Hexagon className="w-12 h-12 text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
          <h1 className="text-4xl font-light tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mb-2">
            SOFTRAXA <span className="font-semibold text-white/30">APP</span>
          </h1>
          <p className="text-zinc-400 text-sm font-medium tracking-wide">Enterprise Client Authentication</p>
        </div>

        <div className={`relative px-8 py-10 rounded-[32px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-700 ${success ? 'scale-95 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
          <form onSubmit={handleActivate} className="space-y-7">
            
            {/* License Input */}
            <div className="space-y-3 group">
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 ml-2 group-focus-within:text-violet-400 transition-colors">
                Digital License Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Key className="w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
                </div>
                <input 
                  type="text"
                  placeholder="SFTR-XXXX-XXXX-XXXX"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-5 text-sm font-mono tracking-widest text-white/90 placeholder:text-zinc-700 outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 hover:bg-black/60 transition-all shadow-inner"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {/* Hardware ID Display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-2">
                 <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Device Signature</span>
                 <Shield className="w-3.5 h-3.5 text-emerald-500/50" />
              </div>
              <div className="px-5 py-3.5 bg-black/30 rounded-2xl border border-white/5 flex items-center shadow-inner">
                <code className="text-xs text-zinc-600 truncate font-mono tracking-wider w-full select-all">
                  {machineId || 'Awaiting Hardware Recognition...'}
                </code>
              </div>
            </div>

            {error && (
              <div className="px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-medium leading-relaxed animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || !licenseKey || !machineId}
              className="w-full relative group overflow-hidden bg-white text-black font-semibold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-200 via-white to-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                    <span className="tracking-wide">Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span className="tracking-wide">Activate License</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Success Overlay state (Absolute positioned over the form area) */}
        {success && (
          <div className="absolute inset-x-0 bottom-0 top-32 flex flex-col items-center justify-center py-6 animate-in fade-in zoom-in duration-700 z-20">
             <div className="w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
               <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse" />
             </div>
             <h2 className="text-2xl font-light tracking-tight text-white mb-2">Activation Successful</h2>
             <p className="text-emerald-400/80 text-sm font-medium tracking-wide flex items-center gap-2">
               <Loader2 className="w-3 h-3 animate-spin" /> Preparing Workspace
             </p>
          </div>
        )}

        <div className={`mt-10 flex items-center justify-center gap-8 transition-opacity duration-500 ${success ? 'opacity-0' : 'opacity-100'}`}>
          <button className="text-zinc-600 hover:text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" /> Support
          </button>
          <div className="w-1 h-1 rounded-full bg-zinc-800" />
          <button className="text-zinc-600 hover:text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Offline Sync
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline Icons to ensure immediate availability
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function HelpCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

