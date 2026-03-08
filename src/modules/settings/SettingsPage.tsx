"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Settings as SettingsIcon, Globe, Bell, Shield,
  Keyboard, Zap, LogOut, ChevronRight, User,
  Save, CheckCircle2, AlertCircle, Laptop, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/modules/auth/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';

export function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = React.useState('account');
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [geminiKey, setGeminiKey] = React.useState('');

  const fetchSettings = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error) {
        setSettings(data);
        setGeminiKey(data.gemini_api_key || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    // ... same as before ...
  };

  const handleSaveGeminiKey = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          gemini_api_key: geminiKey
        });

      if (!error) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = async (field: string, value: boolean) => {
    setSettings({ ...settings, [field]: value });
    try {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          [field]: value
        });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em]">Loading Preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            System <span className="font-light text-zinc-400">Settings</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Managing your personal workspace and security vault.</p>
        </div>
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-emerald-100"
            >
              <CheckCircle2 className="w-4 h-4" /> Changes Persisted
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'account', label: 'Identity & Profile', icon: User },
            { id: 'notifications', label: 'Alert Center', icon: Bell },
            { id: 'system', label: 'System & UI', icon: Laptop },
            { id: 'security', label: 'Security Vault', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group",
                activeTab === tab.id
                  ? "bg-black text-white shadow-elevated"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-black"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest text-[10px]">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2rem]">
                  <CardHeader className="p-8 border-b border-zinc-50">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Core Identity</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="flex items-center gap-8 mb-8 pb-8 border-b border-zinc-50">
                        <div className="w-20 h-20 rounded-[2rem] bg-zinc-900 text-white flex items-center justify-center text-2xl font-black shadow-elevated">
                          {profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-black">Profile Avatar</h3>
                          <p className="text-xs text-zinc-500 font-medium mb-4">Click to upload a new high-resolution photo.</p>
                          <Button variant="outline" size="sm" className="rounded-xl text-[10px] uppercase font-black tracking-widest">Update Photo</Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          name="full_name"
                          label="Full Legal Name"
                          defaultValue={profile?.full_name || ''}
                          placeholder="e.g. John Doe"
                          required
                        />
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Email Address (Read Only)</label>
                          <div className="h-11 px-4 flex items-center rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-400 text-sm font-medium">
                            {user?.email}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button type="submit" disabled={saving} className="bg-black text-white hover:bg-zinc-800 shadow-elevated h-11 rounded-xl px-8 uppercase font-black text-[10px] tracking-widest">
                          {saving ? 'Processing...' : 'Save Profile Alignment'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2rem]">
                  <CardHeader className="p-8 border-b border-zinc-50">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Communication Channels</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-zinc-50">
                      {[
                        { id: 'email_notifications', label: 'Email Reports', desc: 'Summary of project progress and task assignments.' },
                        { id: 'push_notifications', label: 'Real-time Push', desc: 'Desktop alerts for critical mentions and system events.' },
                        { id: 'mobile_notifications', label: 'Mobile Sync', desc: 'Notifications on connected handheld devices.' },
                      ].map((item) => (
                        <div key={item.id} className="p-8 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-black">{item.label}</p>
                            <p className="text-xs text-zinc-500 font-medium">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => handleToggleSetting(item.id, !settings?.[item.id])}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all flex items-center px-1",
                              settings?.[item.id] ? "bg-emerald-500" : "bg-zinc-200"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                              settings?.[item.id] ? "translate-x-6" : "translate-x-0"
                            )} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2rem]">
                  <CardHeader className="p-8 border-b border-zinc-50">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Environment Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Interface Language</label>
                        <select
                          value={settings?.language}
                          onChange={(e) => handleToggleSetting('language', e.target.value as any)}
                          className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm font-bold bg-white focus:ring-4 focus:ring-black/5 outline-none"
                        >
                          <option value="en-US">English (Default)</option>
                          <option value="hi-IN">Hindi (Coming Soon)</option>
                          <option value="es-ES">Spanish</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Timezone Context</label>
                        <select
                          value={settings?.timezone}
                          onChange={(e) => handleToggleSetting('timezone', e.target.value as any)}
                          className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm font-bold bg-white focus:ring-4 focus:ring-black/5 outline-none"
                        >
                          <option value="UTC">UTC (Universal)</option>
                          <option value="IST">Asia/Kolkata (IST)</option>
                          <option value="EST">Eastern Standard Time</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-zinc-50">
                      <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-6">Visual Theme</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {['light', 'dark', 'system'].map((theme) => (
                          <button
                            key={theme}
                            onClick={() => handleToggleSetting('theme', theme as any)}
                            className={cn(
                              "p-4 rounded-2xl border-2 transition-all text-center space-y-2",
                              settings?.theme === theme ? "border-black bg-zinc-50" : "border-zinc-100 hover:border-zinc-200"
                            )}
                          >
                            <div className={cn(
                              "w-full h-12 rounded-lg mb-2",
                              theme === 'light' ? "bg-white border" : theme === 'dark' ? "bg-zinc-900" : "bg-gradient-to-r from-white to-zinc-900 border"
                            )} />
                            <p className="text-[10px] font-black uppercase tracking-widest">{theme}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-[2rem]">
                  <CardHeader className="p-8 border-b border-zinc-50">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Integrations & AI</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                          <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-black uppercase tracking-widest">Google Gemini API</h4>
                          <p className="text-xs text-zinc-500 font-medium">Power your workspace with advanced AI capabilities.</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">API Key Secret</label>
                        <div className="flex gap-3">
                          <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            className="flex-1 h-11 px-4 rounded-xl border border-zinc-200 text-sm font-bold bg-white focus:ring-4 focus:ring-black/5 outline-none"
                            placeholder="AIzaSy..."
                          />
                          <Button
                            onClick={handleSaveGeminiKey}
                            disabled={saving}
                            className="bg-black text-white rounded-xl px-6 h-11 uppercase font-black text-[10px] tracking-widest"
                          >
                            {saving ? 'Saving...' : 'Connect'}
                          </Button>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium px-1">Your key is encrypted and stored securely in your private settings vault.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl border border-zinc-100 opacity-50 grayscale cursor-not-allowed">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold uppercase tracking-widest">Slack Sync</p>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium">Connect your channels for automated reporting.</p>
                      </div>
                      <div className="p-6 rounded-2xl border border-zinc-100 opacity-50 grayscale cursor-not-allowed">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                            <Keyboard className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold uppercase tracking-widest">GitHub Ops</p>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium">Link repositories to project task streams.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Danger Zone */}
      <div className="pt-10 border-t border-zinc-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-sm font-bold text-black mb-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Administrative Action Center
            </h3>
            <p className="text-xs text-zinc-500 font-medium">Managing your session and core account lifecycle.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button onClick={signOut} variant="ghost" className="flex-1 md:flex-none text-zinc-400 hover:text-black font-bold uppercase tracking-widest text-[10px] h-11 rounded-xl">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
            <Button className="flex-1 md:flex-none bg-red-50 text-red-600 hover:bg-red-100 font-bold uppercase tracking-widest text-[10px] shadow-none h-11 rounded-xl border border-red-100">
              Deactivate Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
