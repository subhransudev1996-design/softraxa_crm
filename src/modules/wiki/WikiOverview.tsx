import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    BookOpen,
    Code2,
    Search,
    Plus,
    ChevronRight,
    Clock,
    User,
    Tag,
    FileText,
    Github,
    Lightbulb,
    MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from '../../components/DashboardLayout';
import CreateWikiArticleModal from './CreateWikiArticleModal';

interface WikiArticle {
    id: string;
    title: string;
    category: string;
    author_id: string;
    created_at: string;
}

interface CodeSnippet {
    id: string;
    title: string;
    language: string;
    author_id: string;
}

const WikiOverview: React.FC = () => {
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tagFilter, setTagFilter] = useState<string | null>(null);

    const activeContributors = [...new Set(articles.map(a => a.author_id))].length;

    useEffect(() => {
        fetchWikiData();
    }, []);

    const fetchWikiData = async () => {
        setLoading(true);
        const [articlesRes, snippetsRes] = await Promise.all([
            supabase.from('wiki_articles').select('*').order('created_at', { ascending: false }),
            supabase.from('code_snippets').select('*').order('created_at', { ascending: false })
        ]);

        if (articlesRes.data) setArticles(articlesRes.data);
        if (snippetsRes.data) setSnippets(snippetsRes.data);
        setLoading(false);
    };

    const filteredArticles = articles.filter(art => {
        const matchesSearch =
            art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            art.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = tagFilter ? art.category.toLowerCase() === tagFilter.toLowerCase() || art.title.toLowerCase().includes(tagFilter.toLowerCase()) : true;
        return matchesSearch && matchesTag;
    });

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-light tracking-tight text-black">
                            Company <span className="font-semibold text-gray-400">Wiki</span>
                        </h1>
                        <p className="text-gray-400">Internal documentation, code standards, and project knowledge.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="rounded-xl border-gray-200 text-gray-500 hover:text-black">
                            <Github className="w-4 h-4 mr-2" /> Repo
                        </Button>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-xl bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
                        >
                            <Plus className="w-4 h-4 mr-2" /> New Entry
                        </Button>
                    </div>
                </div>

                {/* Categories / Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Articles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{articles.length}</p>
                                    <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-widest">Documented Insights</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Code Snippets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{snippets.length}</p>
                                    <p className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-widest">Reusable Blocks</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <Code2 className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Active Contributors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{activeContributors || '0'}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest font-mono">Top Authors</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <User className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Lightbulb className="w-20 h-20 text-white" />
                        </div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Quick Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold italic">"Always DRY your CSS"</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Dev Standard #42</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Articles List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm shadow-gray-50">
                            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-black">Knowledge Base</h3>
                                    <p className="text-sm text-gray-400">Browse articles by category or search and discovery.</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search documentation..."
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {loading ? (
                                    <div className="p-20 text-center animate-pulse text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Retrieving knowledge base...
                                    </div>
                                ) : filteredArticles.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <FileText className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                                        <p className="text-gray-400">No articles found matching your criteria.</p>
                                    </div>
                                ) : (
                                    filteredArticles.map(article => (
                                        <div key={article.id} className="p-8 hover:bg-gray-50/50 transition-all cursor-pointer group flex items-start justify-between">
                                            <div className="flex gap-6 items-start">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-lg font-bold text-black">{article.title}</h4>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg uppercase tracking-widest">
                                                            {article.category}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {new Date(article.created_at).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="w-3.5 h-3.5" />
                                                            Admin Team
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-black mt-1 transition-all group-hover:translate-x-1" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Snippets & Trending */}
                    <div className="space-y-6">
                        <Card className="bg-white border-gray-100 border shadow-sm rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-bold text-black uppercase tracking-widest">Code Library</h4>
                                <Code2 className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="space-y-4">
                                {snippets.slice(0, 5).map(snippet => (
                                    <div key={snippet.id} className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{snippet.language}</span>
                                            <MoreHorizontal className="w-3.5 h-3.5 text-gray-300 group-hover:text-black" />
                                        </div>
                                        <h5 className="text-sm font-bold text-black">{snippet.title}</h5>
                                    </div>
                                ))}
                                {snippets.length === 0 && <p className="text-xs text-center p-4 text-gray-400 border border-dashed border-gray-100 rounded-2xl">No snippets saved.</p>}
                                <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black mt-2">
                                    Browse Library
                                </Button>
                            </div>
                        </Card>

                        <Card className="bg-white border-gray-100 border shadow-sm rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-bold text-black uppercase tracking-widest">Trending Tags</h4>
                                <Tag className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['React', 'Supabase', 'TypeScript', 'Auth', 'UI/UX', 'NodeJS', 'Database'].map(tag => (
                                    <span
                                        key={tag}
                                        onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl cursor-pointer transition-all uppercase tracking-widest ${tagFilter === tag ? 'bg-black text-white' : 'bg-gray-50 text-gray-500 hover:bg-black hover:text-white'
                                            }`}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
            <CreateWikiArticleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchWikiData}
            />
        </DashboardLayout>
    );
};

export default WikiOverview;
