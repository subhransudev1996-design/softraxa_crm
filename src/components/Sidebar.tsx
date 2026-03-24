"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Briefcase, CheckSquare,
  Settings, Shield, HelpCircle, Book, Trophy, DollarSign,
  Target, Users2, ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen,
  PhoneForwarded, Sparkles, FileText
} from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const menuGroups = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/', adminOnly: false },
    ]
  },
  {
    title: "Project Management",
    items: [
      { icon: Briefcase, label: 'Projects', path: '/projects', adminOnly: false },
      { icon: CheckSquare, label: 'Tasks', path: '/tasks', adminOnly: false },
    ]
  },
  {
    title: "Commercial",
    items: [
      { icon: Users, label: 'Clients', path: '/clients', adminOnly: true },
      { icon: Target, label: 'Leads', path: '/crm', adminOnly: true },
      { icon: PhoneForwarded, label: 'Follow-ups', path: '/followup', adminOnly: true },
      { icon: FileText, label: 'Proposals & Contracts', path: '/proposals', adminOnly: true },
      { icon: Shield, label: 'Desktop Licensing', path: '/licensing', adminOnly: true },
    ]
  },
  {
    title: "Operations",
    items: [
      { icon: Users2, label: 'HRM', path: '/hrm', adminOnly: true },
      { icon: DollarSign, label: 'Finance', path: '/finance', adminOnly: true },
    ]
  },
  {
    title: "Intelligence",
    items: [
      { icon: Sparkles, label: 'AI Suite', path: '/ai', adminOnly: false },
    ]
  },
  {
    title: "Resources",
    items: [
      { icon: Book, label: 'Wiki', path: '/wiki', adminOnly: false },
      { icon: Trophy, label: 'Gamification', path: '/gamification', adminOnly: false },
      { icon: HelpCircle, label: 'Support', path: '/support', adminOnly: false },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(() => {
    // Initially expand groups that contain the active path
    const initial: Record<string, boolean> = {};
    menuGroups.forEach(group => {
      const hasActiveChild = group.items.some(item =>
        pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
      );
      if (hasActiveChild) initial[group.title] = true;
    });
    return initial;
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }}
      className="bg-[#09090b] text-white flex flex-col h-full border-r border-[#18181b] relative overflow-hidden shrink-0"
    >
      {/* Glossy background effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      <div className="h-24 flex items-center px-6 z-10 justify-between">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] shrink-0">
                <div className="w-5 h-5 bg-black rounded-sm transform rotate-45" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">SOFTRAXA</span>
            </motion.div>
          )}
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] mx-auto"
            >
              <div className="w-5 h-5 bg-black rounded-sm transform rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="px-4 mb-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full p-3 rounded-2xl hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors flex justify-center"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6 px-4 z-10 no-scrollbar">
        {menuGroups.map((group, groupIdx) => {
          const isExpanded = expandedGroups[group.title];
          const hasActiveChild = group.items.some(item =>
            pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
          );

          return (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2 rounded-xl transition-colors group/header",
                    hasActiveChild ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                    {group.title}
                  </span>
                  <ChevronRight className={cn(
                    "w-3.5 h-3.5 transition-transform duration-300",
                    isExpanded ? "rotate-90" : "rotate-0",
                    hasActiveChild ? "text-white/50" : "text-zinc-600 group-hover/header:text-zinc-400"
                  )} />
                </button>
              ) : (
                <div className="h-px bg-zinc-800/50 mx-2 mb-2" />
              )}

              <AnimatePresence initial={false}>
                {(isExpanded || isCollapsed) && (
                  <motion.nav
                    initial={isCollapsed ? { opacity: 1 } : { height: 0, opacity: 0 }}
                    animate={isCollapsed ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                    exit={isCollapsed ? { opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="flex flex-col gap-1 overflow-hidden"
                  >
                    <div className={cn("flex flex-col gap-1", !isCollapsed && "pt-1")}>
                      {group.items.map((item) => {
                        if (item.adminOnly && !isAdmin && profile !== null) return null;
                        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));

                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            title={isCollapsed ? item.label : undefined}
                            className={cn(
                              "group flex items-center px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-300 relative",
                              isCollapsed ? "justify-center" : "justify-between ml-1",
                              isActive
                                ? "bg-zinc-800/80 text-white shadow-sm ring-1 ring-zinc-700/50"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={cn(
                                "w-[18px] h-[18px] transition-colors duration-300 shrink-0",
                                isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                              )} />
                              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                            </div>
                            {isActive && !isCollapsed && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="w-1 h-4 bg-white rounded-full"
                              />
                            )}
                            {isActive && isCollapsed && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                              />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.nav>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <div className="mt-auto pt-4">
          <div className="flex flex-col gap-1.5 mb-6">
            <Link
              href="/settings"
              title={isCollapsed ? "Settings" : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium transition-all",
                isCollapsed ? "justify-center" : "",
                pathname === '/settings'
                  ? "bg-zinc-800/80 text-white ring-1 ring-zinc-700/50"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              )}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </Link>
            <button
              onClick={signOut}
              title={isCollapsed ? "Sign Out" : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-all group",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <LogOut className="w-[18px] h-[18px] shrink-0 group-hover:rotate-12 transition-transform" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>

          <AnimatePresence>
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 mb-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-bold ring-2 ring-zinc-800 ring-offset-2 ring-offset-zinc-900 shrink-0">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{profile?.role || 'Guest'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 overflow-hidden whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-zinc-500" />
                    <span>Level {profile?.level || 1}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-zinc-700" />
                  <span>{profile?.points || 0} XP</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 mb-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-bold ring-2 ring-zinc-800 ring-offset-2 ring-offset-zinc-900">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
