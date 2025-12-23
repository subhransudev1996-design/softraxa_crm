import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Trophy,
    Target,
    Award,
    Plus,
    Search,
    Zap,
    Star,
    Crown,
    User,
    Users,
    History,
    ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from '../../components/DashboardLayout';
import CreateBadgeModal from './CreateBadgeModal';

interface LeaderboardUser {
    id: string;
    full_name: string;
    points: number;
    level: number;
    avatar_url: string | null;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    category: string;
    rarity: string;
}

const GamificationOverview: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dynamic Stats Calculations
    const monthlyTop = leaderboard.length > 0 ? leaderboard[0] : null;
    const avgLevel = leaderboard.length > 0
        ? (leaderboard.reduce((acc, curr) => acc + (curr.level || 1), 0) / leaderboard.length).toFixed(1)
        : '1.0';
    const totalBadges = badges.length;

    // Mock system activity based on engagement
    const systemActivity = Math.min(95 + (leaderboard.length > 5 ? 3 : 0), 100);

    useEffect(() => {
        fetchGamificationData();
    }, []);

    const fetchGamificationData = async () => {
        setLoading(true);
        const [profilesRes, badgesRes] = await Promise.all([
            supabase.from('profiles').select('id, full_name, points, level, avatar_url').order('points', { ascending: false }),
            supabase.from('badges').select('*').order('created_at', { ascending: false })
        ]);

        if (profilesRes.data) setLeaderboard(profilesRes.data);
        if (badgesRes.data) setBadges(badgesRes.data);
        setLoading(false);
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'epic': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'rare': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredLeaderboard = leaderboard.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-light tracking-tight text-black">
                            Engagement <span className="font-semibold text-gray-400">& Rewards</span>
                        </h1>
                        <p className="text-gray-400">Track performance metrics, manage badges, and analyze the leaderboard.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="rounded-xl border-gray-200 text-gray-500 hover:text-black">
                            <History className="w-4 h-4 mr-2" /> Points Ledger
                        </Button>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-xl bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Create Badge
                        </Button>
                    </div>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Monthly Top</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{monthlyTop?.full_name?.split(' ')[0] || 'N/A'}</p>
                                    <p className="text-[10px] text-yellow-600 font-bold mt-1 uppercase tracking-widest">MVP Holder</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100">
                                    <Crown className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Avg Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">
                                        {avgLevel}
                                    </p>
                                    <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-widest">Team Proficiency</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                    <Target className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Badges Issued</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{totalBadges}</p>
                                    <p className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-widest font-mono">Total Rewards</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                                    <Award className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap className="w-20 h-20 text-white" />
                        </div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">System Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">{systemActivity}%</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Engagement Rate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Leaderboard Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Global Leaderboard */}
                    <Card className="lg:col-span-2 bg-white border-gray-100 border shadow-sm rounded-3xl overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-black">Global Leaderboard</h3>
                                <p className="text-sm text-gray-400">Live rankings of the most active team members.</p>
                            </div>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Find high-performer..."
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Rank & Name</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">Level</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Points</th>
                                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Settings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 animate-pulse font-bold tracking-widest uppercase text-[10px]">Syncing Performance Data...</td></tr>
                                    ) : filteredLeaderboard.length === 0 ? (
                                        <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400">No champions matching your search.</td></tr>
                                    ) : (
                                        filteredLeaderboard.map((user, index) => (
                                            <tr key={user.id} className="hover:bg-gray-50/50 transition-all cursor-pointer group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 flex items-center justify-center font-black text-lg text-gray-200 group-hover:text-black transition-colors">
                                                            {index + 1 < 10 ? `0${index + 1}` : index + 1}
                                                        </div>
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
                                                            {user.avatar_url ? (
                                                                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-5 h-5 text-gray-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-black">{user.full_name || 'Anonymous Champion'}</span>
                                                            {index === 0 && <span className="text-[9px] font-bold text-yellow-600 uppercase tracking-widest flex items-center gap-1"><Crown className="w-3 h-3" /> Current MVP</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-xs font-bold text-black px-2 py-1 bg-gray-100 rounded-lg">Lvl {user.level || 1}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right font-black text-black text-sm">
                                                    {(user.points || 0).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-gray-100 outline-none">
                                                        <ShieldCheck className="w-4 h-4 text-gray-400 group-hover:text-black" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Sidebar: Badges & Rewards */}
                    <div className="space-y-6">
                        <Card className="bg-white border-gray-100 border shadow-sm rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-bold text-black uppercase tracking-widest">Available Badges</h4>
                                <Trophy className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="space-y-4">
                                {badges.length === 0 ? (
                                    <p className="text-xs text-center p-8 text-gray-400 border border-dashed border-gray-100 rounded-2xl">No custom badges defined yet.</p>
                                ) : (
                                    badges.slice(0, 4).map(badge => (
                                        <div key={badge.id} className="p-4 rounded-2xl border border-gray-50 hover:border-gray-200 transition-all cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                                                    <Award className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-black">{badge.name}</span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 w-fit px-1.5 py-0.5 rounded border ${getRarityColor(badge.rarity)}`}>
                                                        {badge.rarity}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black mt-2">
                                    Manage Achievement System
                                </Button>
                            </div>
                        </Card>

                        <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute -bottom-10 -right-10 opacity-5">
                                <Users className="w-40 h-40 text-white" />
                            </div>
                            <div className="relative z-10 space-y-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                                </div>
                                <h4 className="text-lg font-bold">Team Milestone</h4>
                                <p className="text-xs text-gray-400 leading-relaxed px-4">
                                    The team is 450 points away from unlocking the "Digital Pioneers" group badge for Q4.
                                </p>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4">
                                    <div className="bg-yellow-400 h-full w-[85%]" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
            <CreateBadgeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchGamificationData}
            />
        </DashboardLayout>
    );
};

export default GamificationOverview;
