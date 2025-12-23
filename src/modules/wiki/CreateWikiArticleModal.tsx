import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { X, Send, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CreateWikiArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateWikiArticleModal: React.FC<CreateWikiArticleModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [article, setArticle] = useState({
        title: '',
        category: 'Development',
        content: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('wiki_articles')
                .insert([{
                    ...article,
                    author_id: profile.id
                }]);

            if (error) throw error;
            onSuccess();
            onClose();
            setArticle({ title: '', category: 'Development', content: '' });
        } catch (error) {
            console.error('Error creating article:', error);
            alert('Failed to create article.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <form onSubmit={handleSubmit}>
                    <div className="bg-black p-8 text-white relative">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Knowledge Base</span>
                        </div>
                        <h2 className="text-2xl font-bold">New Wiki Entry</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Share knowledge with the team.</p>
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Article Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Code Standards 2024"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                    value={article.title}
                                    onChange={e => setArticle({ ...article, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Category</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                    value={article.category}
                                    onChange={e => setArticle({ ...article, category: e.target.value })}
                                >
                                    <option value="Development">Development</option>
                                    <option value="Design">Design</option>
                                    <option value="Operations">Operations</option>
                                    <option value="Client">Client</option>
                                    <option value="General">General</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Content (Markdown supported)</label>
                                <textarea
                                    required
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all min-h-[200px] resize-none font-mono"
                                    placeholder="# Introduction..."
                                    value={article.content}
                                    onChange={e => setArticle({ ...article, content: e.target.value })}
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
                            {isSubmitting ? 'Publishing...' : <><Send className="w-3 h-3 mr-2" /> Publish Entry</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWikiArticleModal;
