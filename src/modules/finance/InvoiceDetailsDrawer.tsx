import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Download, Send, CheckCircle, Clock, AlertCircle, Building, Calendar, Receipt } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface InvoiceDetailsDrawerProps {
    invoice: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const InvoiceDetailsDrawer: React.FC<InvoiceDetailsDrawerProps> = ({ invoice, isOpen, onClose, onUpdate }) => {
    const [updating, setUpdating] = useState(false);

    const updateStatus = async (newStatus: 'paid' | 'pending' | 'cancelled') => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ status: newStatus })
                .eq('id', invoice.id);
            if (error) throw error;
            onUpdate();
        } catch (error) {
            console.error('Error updating invoice status:', error);
            alert('Failed to update status.');
        } finally {
            setUpdating(false);
        }
    };

    if (!invoice || !isOpen) return null;

    return (
        <div className={`fixed inset-y-0 right-0 z-[160] w-full max-w-xl bg-white shadow-2xl transform transition-transform duration-500 ease-out border-l border-gray-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="bg-black p-8 text-white relative flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Receipt className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Invoice Details</span>
                        </div>
                        <h2 className="text-3xl font-bold">INV-{invoice.id.slice(0, 8).toUpperCase()}</h2>
                        <div className="mt-4 flex items-center gap-3">
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                invoice.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {invoice.status}
                            </span>
                            <span className="text-gray-500 text-xs">Issued on {new Date(invoice.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Amount Card */}
                    <div className="bg-gray-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Amount Due</span>
                        <h3 className="text-5xl font-black text-black">${(Number(invoice.amount) || 0).toLocaleString()}</h3>
                        <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-xs">
                            Include applicable taxes and service fees. Due by <b>{new Date(invoice.due_date).toLocaleDateString()}</b>.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Building className="w-3 h-3" /> Client
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-black">{invoice.profiles?.full_name || 'N/A'}</span>
                                <span className="text-xs text-gray-500">Business Partner</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Calendar className="w-3 h-3" /> Related Project
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-black">{invoice.projects?.name || 'No Associated Project'}</span>
                                <span className="text-xs text-gray-500">Service Line</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Actions</h4>
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                onClick={() => updateStatus('paid')}
                                disabled={updating || invoice.status === 'paid'}
                                className="w-full justify-start h-14 rounded-2xl bg-white hover:bg-green-50 text-black border border-gray-100 group px-6 transition-all"
                            >
                                <CheckCircle className={`w-5 h-5 mr-4 transition-colors ${invoice.status === 'paid' ? 'text-green-500' : 'text-gray-300 group-hover:text-green-500'}`} />
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold uppercase tracking-widest">Mark as Paid</span>
                                    <span className="text-[10px] text-gray-400">Confirm payment reception</span>
                                </div>
                            </Button>

                            <Button
                                onClick={() => updateStatus('pending')}
                                disabled={updating || invoice.status === 'pending'}
                                className="w-full justify-start h-14 rounded-2xl bg-white hover:bg-yellow-50 text-black border border-gray-100 group px-6 transition-all"
                            >
                                <Clock className={`w-5 h-5 mr-4 transition-colors ${invoice.status === 'pending' ? 'text-yellow-500' : 'text-gray-300 group-hover:text-yellow-500'}`} />
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold uppercase tracking-widest">Mark as Pending</span>
                                    <span className="text-[10px] text-gray-400">Awaiting bank transfer</span>
                                </div>
                            </Button>

                            <Button
                                onClick={() => updateStatus('cancelled')}
                                disabled={updating || invoice.status === 'cancelled'}
                                className="w-full justify-start h-14 rounded-2xl bg-white hover:bg-red-50 text-black border border-gray-100 group px-6 transition-all"
                            >
                                <AlertCircle className={`w-5 h-5 mr-4 transition-colors ${invoice.status === 'cancelled' ? 'text-red-500' : 'text-gray-300 group-hover:text-red-500'}`} />
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-bold uppercase tracking-widest">Mark as Cancelled</span>
                                    <span className="text-[10px] text-gray-400">Void this transaction</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest group">
                        <Download className="w-4 h-4 mr-2 text-gray-400 group-hover:text-black" /> Download PDF
                    </Button>
                    <Button className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 text-[10px] font-bold uppercase tracking-widest">
                        <Send className="w-4 h-4 mr-2" /> Resend to Client
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailsDrawer;
