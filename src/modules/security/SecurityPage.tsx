import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '../../lib/supabase';
import {
    Shield,
    Lock,
    Smartphone,
    Key,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Loader2,
    History,
    LogOut,
    Fingerprint
} from "lucide-react";

const SecurityPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswords({ new: '', confirm: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-black">
                        Account <span className="font-semibold text-gray-400">Security</span>
                    </h1>
                    <p className="text-gray-400 font-medium">Protect your workspace with advanced security controls</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Password Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden bg-white">
                            <CardHeader className="border-b border-gray-50 p-8">
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <Lock className="w-5 h-5" /> Change Password
                                </CardTitle>
                                <p className="text-xs text-gray-400 font-medium mt-1">Ensure your account is using a long, random password to stay secure.</p>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form onSubmit={handleUpdatePassword} className="space-y-6">
                                    {message && (
                                        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                            <p className="text-[10px] font-bold uppercase tracking-widest">{message.text}</p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={passwords.new}
                                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                    className="pl-10 pr-10 h-12 rounded-xl border-gray-100 focus:ring-black"
                                                    placeholder="Minimum 6 characters"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={passwords.confirm}
                                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                    className="pl-10 h-12 rounded-xl border-gray-100 focus:ring-black"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-black text-white hover:bg-gray-800 h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl transition-all"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Two-Factor Authentication Placeholder */}
                        <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden bg-white">
                            <CardHeader className="border-b border-gray-50 p-8">
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <Smartphone className="w-5 h-5" /> Two-Factor Authentication
                                </CardTitle>
                                <p className="text-xs text-gray-400 font-medium mt-1">Add an extra layer of security to your account by requiring more than just a password to log in.</p>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center">
                                            <Fingerprint className="w-6 h-6 text-black opacity-20" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Currently Disabled</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Use an authenticator app for the highest level of security.</p>
                                        </div>
                                    </div>
                                    <Button disabled className="bg-gray-200 text-gray-400 rounded-xl px-6 h-10 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed">Enable</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Sessions & Shield */}
                    <div className="space-y-6">
                        <Card className="rounded-3xl border-gray-100 shadow-sm bg-black text-white text-center p-8">
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Security Status</h3>
                            <p className="text-xs text-gray-400 font-medium mb-6">Your account security is 85% complete. Enable 2FA to reach 100%.</p>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full w-[85%]" />
                            </div>
                        </Card>

                        <Card className="rounded-3xl border-gray-100 shadow-sm bg-white overflow-hidden">
                            <CardHeader className="border-b border-gray-50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <History className="w-4 h-4 text-gray-400" /> Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {[
                                    { event: 'Password changed', time: '2 hours ago', icon: Key },
                                    { event: 'New login from Chrome', time: 'Yesterday', icon: Smartphone },
                                    { event: 'Account profile updated', time: '3 days ago', icon: Shield },
                                ].map((item, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <item.icon className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-black">{item.event}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 bg-gray-50 text-center">
                                    <button className="text-[10px] font-bold text-black uppercase tracking-widest hover:underline">View All Sessions</button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-between group hover:bg-red-100 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <LogOut className="w-5 h-5 text-red-500" />
                                <div>
                                    <p className="text-xs font-bold text-red-900 uppercase tracking-widest">Sign Out Everywhere</p>
                                    <p className="text-[9px] text-red-700/60 font-medium">Log out from all other active sessions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SecurityPage;
