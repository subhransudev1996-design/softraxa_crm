import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import {
    Settings,
    Bell,
    Moon,
    Sun,
    Monitor,
    Globe,
    Lock,
    Shield,
    Eye,
    Mail,
    Smartphone,
    CheckCircle2,
    Palette,
    Loader2
} from "lucide-react";

interface UserSettings {
    theme: string;
    email_notifications: boolean;
    push_notifications: boolean;
    mobile_notifications: boolean;
    language: string;
    timezone: string;
}

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'appearance' | 'security'>('general');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState<UserSettings>({
        theme: 'dark',
        email_notifications: true,
        push_notifications: true,
        mobile_notifications: false,
        language: 'en-US',
        timezone: 'UTC'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setSettings(data);
            }
            setFetching(false);
        };
        fetchSettings();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        const { error } = await supabase
            .from('user_settings')
            .update({
                ...settings,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (!error) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        setLoading(false);
    };

    const toggleSetting = (key: keyof UserSettings) => {
        if (typeof settings[key] === 'boolean') {
            setSettings({ ...settings, [key]: !settings[key] });
        }
    };

    const tabs = [
        { id: 'general', icon: Settings, label: 'General' },
        { id: 'notifications', icon: Bell, label: 'Notifications' },
        { id: 'appearance', icon: Palette, label: 'Appearance' },
        { id: 'security', icon: Shield, label: 'Security' },
    ];

    if (fetching) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-black">
                            System <span className="font-semibold text-gray-400">Settings</span>
                        </h1>
                        <p className="text-gray-400 font-medium">Manage your preferences and account configuration</p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 h-12 font-bold uppercase tracking-widest text-[10px] shadow-xl transition-all"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Changes Saved</> : 'Save All Changes'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Navigation Sidebar */}
                    <div className="space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-black text-white shadow-lg'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-black'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {activeTab === 'general' && (
                            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden text-black bg-white">
                                <CardHeader className="border-b border-gray-50 p-8">
                                    <CardTitle className="text-xl font-bold text-black">General Preferences</CardTitle>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Basic settings for your account and workspace.</p>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-black transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                                                <Globe className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-black">Language</p>
                                                <p className="text-[10px] text-gray-400 font-medium capitalize">Current: {settings.language === 'en-US' ? 'English (United States)' : settings.language}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-black underline-offset-4 hover:underline">Change</Button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-black transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                                                <Monitor className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-black">Time Zone</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{settings.timezone === 'UTC' ? '(GMT+00:00) UTC' : settings.timezone}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-black underline-offset-4 hover:underline">Auto-detect</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'notifications' && (
                            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden text-black bg-white">
                                <CardHeader className="border-b border-gray-50 p-8">
                                    <CardTitle className="text-xl font-bold text-black">Notification Controls</CardTitle>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Decide how you want to be alerted about updates.</p>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    {[
                                        { key: 'email_notifications', title: 'Email Notifications', desc: 'Receive daily summaries and critical alerts via email', icon: Mail },
                                        { key: 'push_notifications', title: 'Push Alerts', desc: 'Desktop and browser notifications for real-time updates', icon: Bell },
                                        { key: 'mobile_notifications', title: 'Mobile Reminders', desc: 'SMS and app notifications for task deadlines', icon: Smartphone },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                                                    <item.icon className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-black">{item.title}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{item.desc}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleSetting(item.key as any)}
                                                className={`w-12 h-6 rounded-full transition-all relative ${settings[item.key as keyof UserSettings] ? 'bg-black' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings[item.key as keyof UserSettings] ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'appearance' && (
                            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden text-black bg-white">
                                <CardHeader className="border-b border-gray-50 p-8">
                                    <CardTitle className="text-xl font-bold text-black">Visual Themes</CardTitle>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Customize the interface aesthetic to your liking.</p>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { id: 'dark', name: 'Dark Premier', icon: Moon },
                                            { id: 'light', name: 'Light Minimalism', icon: Sun },
                                            { id: 'system', name: 'System Default', icon: Monitor },
                                        ].map((theme, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setSettings({ ...settings, theme: theme.id })}
                                                className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-4 cursor-pointer transition-all ${settings.theme === theme.id
                                                    ? 'border-black bg-black text-white shadow-2xl scale-105'
                                                    : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200'
                                                    }`}
                                            >
                                                <theme.icon className="w-8 h-8" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">{theme.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'security' && (
                            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden text-black bg-white">
                                <CardHeader className="border-b border-gray-50 p-8">
                                    <CardTitle className="text-xl font-bold text-black">Security & Privacy</CardTitle>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Advanced protection for your workspace assets.</p>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Lock className="w-5 h-5 text-red-500" />
                                            <div>
                                                <p className="text-sm font-bold text-red-900">Change Password</p>
                                                <p className="text-[10px] text-red-700/60 font-medium">It's a good idea to update your password regularly.</p>
                                            </div>
                                        </div>
                                        <Button className="bg-red-500 text-white hover:bg-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest">Update Now</Button>
                                    </div>

                                    <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Eye className="w-5 h-5 text-black" />
                                            <div>
                                                <p className="text-sm font-bold text-black">Privacy Mode</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Hide your online status from other team members.</p>
                                            </div>
                                        </div>
                                        <button className="w-12 h-6 bg-gray-200 rounded-full relative">
                                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
