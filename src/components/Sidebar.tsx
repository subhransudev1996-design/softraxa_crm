import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    UserSquare2,
    Wallet,
    LifeBuoy,
    BookOpen,
    Trophy,
    Rocket,
    CheckSquare
} from 'lucide-react';

import { useAuth } from '../modules/auth/AuthContext';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'CRM & Sales', path: '/crm', adminOnly: true },
    { icon: Briefcase, label: 'Projects', path: '/projects' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: UserSquare2, label: 'HRM', path: '/hrm', adminOnly: true },
    { icon: Wallet, label: 'Finance', path: '/finance', adminOnly: true },
    { icon: LifeBuoy, label: 'Support', path: '/support' },
    { icon: BookOpen, label: 'Wiki', path: '/wiki' },
    { icon: Trophy, label: 'Gamification', path: '/gamification' },
];

const Sidebar: React.FC = () => {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';

    const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-black p-1.5 rounded-lg">
                    <Rocket className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight text-black">Softraxa</span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {filteredMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-black text-white shadow-md shadow-gray-200'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-gray-50">
                <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200">
                            <Trophy className="w-4 h-4 text-black" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-black">Current Points</p>
                            <p className="text-sm font-bold text-gray-400">{profile?.points || 0} pts</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-black h-full" style={{ width: `${Math.min((profile?.points || 0) / 10, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-wider font-bold">Level {profile?.level || 1} Apprentice</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
