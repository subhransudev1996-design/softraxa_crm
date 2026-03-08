"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import { Bell, Check, Trash2, X, Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error) setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to real-time notifications
      const channel = supabase
        .channel(`public:notifications:user_id=eq.${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev].slice(0, 10));
          } else {
            fetchNotifications();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-100 transition-all relative"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-zinc-900 rounded-full border-2 border-white"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-elevated border border-zinc-100 overflow-hidden z-[100]"
          >
            <div className="p-5 border-b border-zinc-50 flex items-center justify-between bg-white sticky top-0">
              <div>
                <h3 className="text-sm font-bold text-black">Notifications</h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{unreadCount} Unread</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar bg-white">
              {loading && notifications.length === 0 ? (
                <div className="p-10 flex justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <Bell className="w-8 h-8 text-zinc-100 mx-auto mb-3" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={cn(
                        "p-5 hover:bg-zinc-50 transition-colors relative group",
                        !notification.read && "bg-zinc-50/30"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="mt-0.5 shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-bold mb-0.5",
                            notification.read ? "text-zinc-500" : "text-black"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-[9px] font-black text-zinc-300 mt-2 uppercase tracking-tighter">
                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="absolute right-4 top-5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="w-6 h-6 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-200 shadow-sm"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="w-6 h-6 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-100 shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="w-full p-4 text-[10px] font-bold text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all border-t border-zinc-50 uppercase tracking-[0.2em] sticky bottom-0 bg-white">
              View all activity
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
