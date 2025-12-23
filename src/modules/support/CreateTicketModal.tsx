import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { X, Send, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticket, setTicket] = useState({
        subject: '',
        priority: 'medium',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('tickets')
                .insert([{
                    ...ticket,
                    status: 'open',
                    client_id: profile.id, // Assuming the creator is a client/user
                    assigned_to: null, // Initially unassigned
                    project_id: null // Basic implementation, can be extended to select project
                }]);

            if (error) throw error;
            onSuccess();
            onClose();
            setTicket({ subject: '', priority: 'medium', description: '' });
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Failed to create ticket.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <form onSubmit={handleSubmit}>
                    <div className="bg-black p-8 text-white relative">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Support Center</span>
                        </div>
                        <h2 className="text-2xl font-bold">New Support Ticket</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Submit an issue for our support team.</p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Brief summary of the issue..."
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                    value={ticket.subject}
                                    onChange={e => setTicket({ ...ticket, subject: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Priority Level</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                    value={ticket.priority}
                                    onChange={e => setTicket({ ...ticket, priority: e.target.value })}
                                >
                                    <option value="low">Low - General Question</option>
                                    <option value="medium">Medium - Feature Request / Minor Bug</option>
                                    <option value="high">High - System Issue</option>
                                    <option value="critical">Critical - Business Stoppage</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Description</label>
                                <textarea
                                    required
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all min-h-[120px] resize-none"
                                    placeholder="Please describe the issue in detail..."
                                    value={ticket.description}
                                    onChange={e => setTicket({ ...ticket, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50/50 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-gray-200"
                        >
                            {isSubmitting ? 'Submitting...' : <><Send className="w-3 h-3 mr-2" /> Submit Ticket</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTicketModal;
