import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
import { Search, Bell, User, LogOut, ChevronDown, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle2, Clock, Settings, Shield, UserCog } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import AttendanceClock from './AttendanceClock';

const Topbar: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="relative w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search for projects, tasks or leads..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-100 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-gray-50/50"
                />
            </div>

            <div className="flex items-center gap-6">
                <AttendanceClock />
                <div className="h-8 w-px bg-gray-100" />
                {/* Notifications Dropdown */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-black">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-[10px] font-bold text-gray-400 hover:text-black flex items-center gap-1 uppercase tracking-widest transition-colors"
                                    >
                                        <CheckCheck className="h-3 w-3" /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => markAsRead(notification.id)}
                                            className={`p-4 flex gap-3 cursor-pointer transition-colors ${!notification.is_read ? 'bg-gray-50 border-r-2 border-black' : 'hover:bg-gray-50/50'}`}
                                        >
                                            <div className="mt-0.5">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[11px] leading-tight ${!notification.is_read ? 'font-bold text-black' : 'text-gray-600'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-2 flex items-center gap-1">
                                                    <Clock className="h-2 w-2" />
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <p className="text-xs text-gray-400 italic">No notifications yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-100 mx-1" />

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <div
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center gap-3 group cursor-pointer"
                    >
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold text-black leading-tight">
                                {profile?.full_name || user?.email?.split('@')[0]}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                                {profile?.role || 'User'}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden group-hover:border-black transition-all">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 text-gray-400" />
                            )}
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showProfileDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold">
                                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <p className="text-xs font-bold text-black truncate">{profile?.full_name || user?.email?.split('@')[0]}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="p-1">
                                <Link
                                    to="/profile"
                                    onClick={() => setShowProfileDropdown(false)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                                >
                                    <UserCog className="w-4 h-4" /> My Profile
                                </Link>
                                <Link
                                    to="/settings"
                                    onClick={() => setShowProfileDropdown(false)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                                >
                                    <Settings className="w-4 h-4" /> Settings
                                </Link>
                                <Link
                                    to="/security"
                                    onClick={() => setShowProfileDropdown(false)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest"
                                >
                                    <Shield className="w-4 h-4" /> Security
                                </Link>
                            </div>
                            <div className="border-t border-gray-50 p-1 mt-1">
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
