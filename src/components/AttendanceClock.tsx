import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../modules/auth/AuthContext';
import { Play, Square } from 'lucide-react';

const AttendanceClock: React.FC = () => {
    const { profile } = useAuth();
    const [currentLog, setCurrentLog] = useState<any>(null);
    const [isClocking, setIsClocking] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    useEffect(() => {
        if (profile?.id) {
            fetchTodayStatus();
        }
    }, [profile?.id]);

    useEffect(() => {
        let interval: any;
        if (currentLog && !currentLog.clock_out) {
            interval = setInterval(() => {
                const start = new Date(currentLog.clock_in).getTime();
                const now = new Date().getTime();
                const diff = now - start;

                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);

                setElapsedTime(
                    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                );
            }, 1000);
        } else {
            setElapsedTime('00:00:00');
        }
        return () => clearInterval(interval);
    }, [currentLog]);

    const fetchTodayStatus = async () => {
        if (!profile?.id) return;
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', profile.id)
            .gte('clock_in', today)
            .is('clock_out', null)
            .maybeSingle();

        if (data) setCurrentLog(data);
    };

    const handleClockToggle = async () => {
        if (!profile?.id) return;
        setIsClocking(true);

        if (currentLog) {
            // Clock out
            const { error } = await supabase
                .from('attendance')
                .update({ clock_out: new Date().toISOString() })
                .eq('id', currentLog.id);

            if (!error) setCurrentLog(null);
        } else {
            // Clock in
            const now = new Date();
            const hour = now.getHours();
            const status = hour >= 9 && now.getMinutes() > 30 ? 'late' : 'on_time';

            const { data, error } = await supabase
                .from('attendance')
                .insert([{
                    user_id: profile.id,
                    clock_in: now.toISOString(),
                    status: status
                }])
                .select()
                .single();

            if (!error && data) setCurrentLog(data);
        }
        setIsClocking(false);
    };

    return (
        <div className="flex items-center gap-4 bg-gray-50/80 px-4 py-1.5 rounded-2xl border border-gray-100">
            <div className="flex flex-col items-start pr-4 border-r border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shift Time</span>
                <span className={`text-xs font-bold font-mono ${currentLog ? 'text-black' : 'text-gray-300'}`}>
                    {elapsedTime}
                </span>
            </div>
            <button
                onClick={handleClockToggle}
                disabled={isClocking}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${currentLog
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200'
                    }`}
            >
                {currentLog ? (
                    <><Square className="w-3 h-3 fill-current" /> Finish Session</>
                ) : (
                    <><Play className="w-3 h-3 fill-current" /> Start Session</>
                )}
            </button>
        </div>
    );
};

export default AttendanceClock;
