import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Calendar as CalendarIcon, Send, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

const LeaveRequestDialog: React.FC = () => {
    const { profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [request, setRequest] = useState({
        type: 'vacation',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('leave_requests')
                .insert([{
                    user_id: profile.id,
                    ...request,
                    status: 'pending'
                }]);

            if (error) throw error;
            setIsOpen(false);
            setRequest({ type: 'vacation', start_date: '', end_date: '', reason: '' });
        } catch (error) {
            console.error('Error submitting leave:', error);
            alert('Failed to submit leave request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} className="rounded-xl bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200">
                <CalendarIcon className="w-4 h-4 mr-2" /> Request Leave
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <form onSubmit={handleSubmit}>
                    <div className="bg-black p-8 text-white relative">
                        <h2 className="text-2xl font-bold">Request Time Off</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Submit your leave request for approval.</p>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Leave Type</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                    value={request.type}
                                    onChange={e => setRequest({ ...request, type: e.target.value })}
                                >
                                    <option value="vacation">Vacation</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="personal">Personal Leave</option>
                                    <option value="bereavement">Bereavement</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                        value={request.start_date}
                                        onChange={e => setRequest({ ...request, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                        value={request.end_date}
                                        onChange={e => setRequest({ ...request, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Reason / Notes</label>
                                <textarea
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all min-h-[100px] resize-none"
                                    placeholder="Explain why you need leave..."
                                    value={request.reason}
                                    onChange={e => setRequest({ ...request, reason: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50/50 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-gray-200"
                        >
                            {isSubmitting ? 'Sending...' : <><Send className="w-3 h-3 mr-2" /> Submit Request</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveRequestDialog;
