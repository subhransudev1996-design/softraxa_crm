import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Award, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CreateBadgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateBadgeModal: React.FC<CreateBadgeModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [badge, setBadge] = useState({
        name: '',
        description: '',
        category: 'Achievement',
        rarity: 'common'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('badges')
                .insert([{ ...badge }]);

            if (error) throw error;
            onSuccess();
            onClose();
            setBadge({ name: '', description: '', category: 'Achievement', rarity: 'common' });
        } catch (error) {
            console.error('Error creating badge:', error);
            alert('Failed to create badge.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <form onSubmit={handleSubmit}>
                    <div className="bg-black p-8 text-white relative">
                        <div className="flex items-center gap-3 mb-2">
                            <Award className="w-5 h-5 text-yellow-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Gamification</span>
                        </div>
                        <h2 className="text-2xl font-bold">New Badge</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Reward excellence.</p>
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Badge Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Bug Exterminator"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                    value={badge.name}
                                    onChange={e => setBadge({ ...badge, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Description</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Fixed 50 critical bugs."
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                    value={badge.description}
                                    onChange={e => setBadge({ ...badge, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Rarity</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                    value={badge.rarity}
                                    onChange={e => setBadge({ ...badge, rarity: e.target.value })}
                                >
                                    <option value="common">Common</option>
                                    <option value="rare">Rare</option>
                                    <option value="epic">Epic</option>
                                    <option value="legendary">Legendary</option>
                                </select>
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
                            {isSubmitting ? 'Creating...' : <><Star className="w-3 h-3 mr-2" /> Create Badge</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBadgeModal;
