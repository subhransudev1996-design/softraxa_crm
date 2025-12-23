import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    User,
    Mail,
    Briefcase,
    Shield,
    Trophy,
    AlertCircle,
    Camera,
    Save,
    Loader2,
    CheckCircle2,
    Star,
    Award
} from "lucide-react";

const ProfileDetails: React.FC = () => {
    const { profile, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        avatar_url: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                avatar_url: profile.avatar_url || '',
            });
        }
    }, [profile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    avatar_url: formData.avatar_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Profile Header Card */}
                <div className="relative h-48 rounded-3xl bg-black overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black opacity-50" />
                    <div className="absolute -bottom-12 left-8 md:left-12 flex items-end gap-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-3xl bg-gray-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                {formData.avatar_url ? (
                                    <img src={formData.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : <span className="text-xl font-bold">{(profile?.full_name?.charAt(0) || 'U')}</span>}
                            </div>
                            <button className="absolute bottom-2 right-2 p-2 bg-black text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="mb-14">
                            <h1 className="text-3xl font-bold text-white tracking-tight">{profile?.full_name}</h1>
                            <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px] mt-1 flex items-center gap-2">
                                <Shield className="w-3 h-3" /> {profile?.role} Member
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12">
                    {/* Stats & Info SideBar */}
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-50">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Achievements</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-black uppercase tracking-widest">Level {profile?.level || 1}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{profile?.points || 0} Total XP</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-black h-full w-[65%]" />
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="aspect-square rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                            <Award className="w-4 h-4 text-gray-300" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-gray-100 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tasks Done</p>
                                    <p className="text-sm font-bold text-black">24</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Projects</p>
                                    <p className="text-sm font-bold text-black">3</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consistency</p>
                                    <p className="text-sm font-bold text-green-500">98%</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Settings Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl border-gray-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-4">
                                <div>
                                    <CardTitle className="text-lg font-bold text-black">Personal Information</CardTitle>
                                    <p className="text-xs text-gray-400 font-medium mt-1">Update your profile details and preferences.</p>
                                </div>
                                <User className="w-5 h-5 text-gray-300" />
                            </CardHeader>
                            <CardContent className="pt-8">
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    {message && (
                                        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                            <p className="text-xs font-bold uppercase tracking-widest">{message.text}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <Input
                                                    value={formData.full_name}
                                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                    className="pl-10 h-12 rounded-xl border-gray-100 focus:ring-black"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <Input
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="pl-10 h-12 rounded-xl border-gray-100 bg-gray-50/50 italic"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Avatar URL</label>
                                            <div className="relative">
                                                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <Input
                                                    value={formData.avatar_url}
                                                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                                    className="pl-10 h-12 rounded-xl border-gray-100"
                                                    placeholder="https://images.unsplash.com/..."
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Role</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <Input
                                                    value={profile?.role || ''}
                                                    disabled
                                                    className="pl-10 h-12 rounded-xl border-gray-100 bg-gray-50/50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-black text-white hover:bg-gray-900 h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Recent Activity Mini Feed */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Star className="w-3 h-3 text-black" /> Recent Milestones
                            </h3>
                            <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-black transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    <p className="text-xs font-bold text-black uppercase tracking-widest">Completed: Project Alpha Design phase</p>
                                </div>
                                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">2 Days Ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProfileDetails;
