import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    X,
    Mail,
    Phone,
    MessageSquare,
    PhoneCall,
    History,
    FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '../auth/AuthContext';

interface Activity {
    id: string;
    type: string;
    content: string;
    created_at: string;
    profiles?: { full_name: string };
}

interface LeadDetailsDrawerProps {
    leadId: string;
    onClose: () => void;
    onUpdate: () => void;
}

const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = ({ leadId, onClose }) => {
    const { profile: currentUser } = useAuth();
    const [lead, setLead] = useState<any>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (leadId) fetchDetails();
    }, [leadId]);

    const fetchDetails = async () => {
        setLoading(true);
        // Fetch Lead
        const { data: leadData } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        // Fetch Activities
        const { data: activityData } = await supabase
            .from('lead_activities')
            .select(`
                *,
                profiles:user_id (full_name)
            `)
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        setLead(leadData);
        setActivities(activityData || []);
        setLoading(false);
    };

    const handleAddActivity = async (type: string, content?: string) => {
        const textContent = content || newNote;
        if (!textContent.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('lead_activities')
                .insert([{
                    lead_id: leadId,
                    user_id: currentUser?.id,
                    type,
                    content: textContent
                }]);

            if (error) throw error;
            setNewNote('');
            fetchDetails();
        } catch (error) {
            console.error('Error adding activity:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!leadId) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[110] transform transition-transform animate-in slide-in-from-right duration-300">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-black text-white">
                    <div>
                        <h2 className="text-xl font-bold">{lead?.company_name || 'Loading...'}</h2>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Lead Details</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-white rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {/* Quick Info */}
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Person</p>
                                    <p className="text-sm font-bold text-black flex items-center gap-2">
                                        <History className="w-3.5 h-3.5" />
                                        {lead?.contact_name}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Est. Value</p>
                                    <p className="text-sm font-bold text-green-600">
                                        ${Number(lead?.project_estimate || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2">Contact Channels</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    <a href={`mailto:${lead?.email}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">{lead?.email}</span>
                                    </a>
                                    <a href={`tel:${lead?.phone}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100">
                                            <Phone className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">{lead?.phone || 'No phone'}</span>
                                    </a>
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="pt-6 border-t border-gray-50 space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Activity Timeline</h4>
                                    <History className="w-4 h-4 text-gray-300" />
                                </div>

                                {/* Add Note */}
                                <div className="space-y-3">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Add a private note or log an activity..."
                                        className="w-full h-24 p-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-1 focus:ring-black resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleAddActivity('note')}
                                            disabled={isSubmitting || !newNote.trim()}
                                            className="flex-1 rounded-xl bg-black text-white hover:bg-gray-800 text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            <FileText className="w-3.5 h-3.5 mr-2" /> Log Note
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleAddActivity('call', 'Client called to discuss pricing')}
                                            className="rounded-xl border-gray-100 text-gray-400 hover:text-black"
                                        >
                                            <PhoneCall className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-0 before:w-[1px] before:bg-gray-100">
                                    {activities.map((act) => (
                                        <div key={act.id} className="relative pl-10">
                                            <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm flex items-center justify-center
                                                ${act.type === 'note' ? 'bg-black' : act.type === 'call' ? 'bg-green-500' : 'bg-blue-500'}`}
                                            />
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-black uppercase tracking-widest">{act.type}</p>
                                                    <p className="text-[10px] font-medium text-gray-400">{new Date(act.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <p className="text-sm text-gray-600 bg-gray-50/50 p-3 rounded-xl border border-gray-50">{act.content}</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">By {act.profiles?.full_name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadDetailsDrawer;
