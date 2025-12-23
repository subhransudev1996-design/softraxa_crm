import React, { useState } from 'react';
import { Mail, Shield, UserPlus, X, Briefcase } from 'lucide-react';
import { Button } from "@/components/ui/button";

const InviteMemberDialog: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('employee');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Logic would go here to trigger Supabase Edge Function to send email
        // or insert into an 'invitations' table.

        alert(`Invitation sent to ${email} as ${role}.`);
        setIsOpen(false);
        setIsSubmitting(false);
        setEmail('');
        setRole('employee');
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="rounded-xl bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
            >
                <UserPlus className="w-4 h-4 mr-2" /> Invite Member
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <form onSubmit={handleInvite}>
                    <div className="bg-black p-8 text-white relative">
                        <h2 className="text-2xl font-bold">Invite Member</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Add a new user to your organization.</p>
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="colleague@softraxa.com"
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Role & Permissions</label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                        value={role}
                                        onChange={e => setRole(e.target.value)}
                                    >
                                        <option value="employee">Employee (Standard Access)</option>
                                        <option value="pm">Project Manager (Manage Projects)</option>
                                        <option value="admin">Administrator (Full Access)</option>
                                        <option value="client">Client (View Only)</option>
                                    </select>
                                </div>
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
                            className="data-[state=loading]:bg-gray-800 bg-black text-white hover:bg-gray-800 rounded-xl px-8 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-gray-200"
                        >
                            {isSubmitting ? 'Sending Invite...' : <><UserPlus className="w-3 h-3 mr-2" /> Send Invitation</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteMemberDialog;
