import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Send, Wallet, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [type, setType] = useState<'invoice' | 'expense'>('invoice');
    const [submitting, setSubmitting] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        project_id: '',
        client_id: '',
        category: 'Operational',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            fetchReferences();
        }
    }, [isOpen]);

    const fetchReferences = async () => {
        const [projRes, clientRes] = await Promise.all([
            supabase.from('projects').select('id, name'),
            supabase.from('profiles').select('id, full_name').eq('role', 'client')
        ]);
        if (projRes.data) setProjects(projRes.data);
        if (clientRes.data) setClients(clientRes.data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (type === 'invoice') {
                const { error } = await supabase.from('invoices').insert([{
                    amount: parseFloat(formData.amount),
                    project_id: formData.project_id || null,
                    client_id: formData.client_id || null,
                    due_date: formData.due_date,
                    status: 'pending'
                }]);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('expenses').insert([{
                    amount: parseFloat(formData.amount),
                    project_id: formData.project_id || null,
                    category: formData.category,
                    description: formData.description,
                    date: formData.date
                }]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Failed to save transaction.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <form onSubmit={handleSubmit}>
                    <div className="bg-black p-8 text-white relative">
                        <h2 className="text-2xl font-bold">New Transaction</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Log revenue or business expenses.</p>
                        <button type="button" onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setType('invoice')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${type === 'invoice' ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                            >
                                <FileText className="w-3 h-3 inline mr-2" /> Invoice
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('expense')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                            >
                                <Wallet className="w-3 h-3 inline mr-2" /> Expense
                            </button>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Amount ($)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                    {type === 'invoice' ? 'Due Date' : 'Expense Date'}
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                    value={type === 'invoice' ? formData.due_date : formData.date}
                                    onChange={e => setFormData({ ...formData, [type === 'invoice' ? 'due_date' : 'date']: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Related Project (Optional)</label>
                            <select
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                value={formData.project_id}
                                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                            >
                                <option value="">No Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {type === 'invoice' ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Client</label>
                                <select
                                    required
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                    value={formData.client_id}
                                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                >
                                    <option value="">Select Client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Category</label>
                                    <select
                                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Operational">Operational</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Payroll">Payroll</option>
                                        <option value="Software">Software</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Description</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. AWS monthly bill"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-gray-50/50 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl text-[10px] font-bold uppercase tracking-widest">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-gray-200"
                        >
                            {submitting ? 'Saving...' : <><Send className="w-3 h-3 mr-2" /> Save Transaction</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;
