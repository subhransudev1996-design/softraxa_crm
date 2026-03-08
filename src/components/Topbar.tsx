"use client";
import React from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { Bell, Search, User as UserIcon, Settings, Command } from 'lucide-react';
import Link from 'next/link';
import { NotificationDropdown } from './NotificationDropdown';

export function Topbar() {
  const { profile } = useAuth();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-zinc-100 flex items-center justify-between px-10 shrink-0 z-40 sticky top-0">
      <div className="flex items-center gap-8 flex-1">
        <div className="flex items-center w-full max-w-md relative group">
          <div className="absolute left-4 text-zinc-400 group-focus-within:text-black transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search for projects, tasks or users..."
            className="w-full h-11 pl-11 pr-12 rounded-2xl bg-zinc-100/50 border-none focus:bg-white focus:ring-2 focus:ring-black/5 outline-none text-[13px] text-black transition-all"
          />
          <div className="absolute right-4 flex items-center gap-1 px-1.5 py-1 rounded-md bg-white border border-zinc-200 text-[10px] font-bold text-zinc-400 shadow-sm">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <Link
            href="/settings"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-100 transition-all"
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        </div>

        <div className="h-8 w-px bg-zinc-100" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-bold text-black leading-none mb-1">
              {profile?.full_name || 'Loading...'}
            </p>
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {profile?.role || 'User'}
              </p>
            </div>
          </div>
          <Link href="/profile" className="flex items-center justify-center w-11 h-11 rounded-2xl bg-zinc-900 text-white hover:scale-105 transition-transform cursor-pointer border-2 border-white shadow-soft overflow-hidden group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
