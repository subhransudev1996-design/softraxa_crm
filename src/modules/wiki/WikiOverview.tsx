"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Book, Search, Plus, FileText, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function WikiOverview() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [articles, setArticles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [selectedArticle, setSelectedArticle] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wiki_articles')
        .select('*, profiles:author_id(full_name)')
        .order('created_at', { ascending: false });
      
      if (!error) setArticles(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchArticles();
  }, []);

  const handleCreateArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase.from('wiki_articles').insert({
        title: formData.get('title'),
        category: formData.get('category'),
        content: formData.get('content'),
        author_id: user?.id,
      });

      if (!error) {
        setIsModalOpen(false);
        fetchArticles();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { name: 'Engineering', count: articles.filter(a => a.category === 'Engineering').length },
    { name: 'Company Policy', count: articles.filter(a => a.category === 'Company Policy').length },
    { name: 'Project Guidelines', count: articles.filter(a => a.category === 'Project Guidelines').length },
    { name: 'Tech Stack', count: articles.filter(a => a.category === 'Tech Stack').length },
    { name: 'Onboarding', count: articles.filter(a => a.category === 'Onboarding').length },
    { name: 'Design', count: articles.filter(a => a.category === 'Design').length },
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? article.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <div className="max-w-[1000px] mx-auto space-y-10 animate-fade-in pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => setSelectedArticle(null)} className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all shadow-soft">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-black">{selectedArticle.title}</h1>
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                <span className="text-black">{selectedArticle.category}</span>
                <div className="w-1 h-1 rounded-full bg-zinc-200" />
                <span>By {selectedArticle.profiles?.full_name || 'System'}</span>
                <div className="w-1 h-1 rounded-full bg-zinc-200" />
                <span>{new Date(selectedArticle.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </header>
        <Card className="border-zinc-100 shadow-soft overflow-hidden rounded-3xl">
          <CardContent className="p-8 lg:p-12 prose prose-zinc max-w-none">
            {/* Extremely simple markdown rendering - could be improved with a library */}
            {selectedArticle.content.split('\n').map((paragraph: string, i: number) => {
              if (paragraph.startsWith('# ')) return <h1 key={i} className="text-3xl font-black mb-4 mt-8">{paragraph.replace('# ', '')}</h1>;
              if (paragraph.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mb-4 mt-6">{paragraph.replace('## ', '')}</h2>;
              if (paragraph.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mb-3 mt-5">{paragraph.replace('### ', '')}</h3>;
              if (paragraph.startsWith('- ')) return <li key={i} className="ml-4 mb-2">{paragraph.replace('- ', '')}</li>;
              if (paragraph.trim() === '') return <br key={i} />;
              return <p key={i} className="mb-4 text-zinc-600 leading-relaxed">{paragraph}</p>;
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black">
            Internal <span className="font-light text-zinc-400">Wiki</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Knowledge base and company documentation.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="Search wiki..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 w-64"
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95">
            <Plus className="w-4 h-4 mr-2" /> New Article
          </Button>
        </div>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create Wiki Article"
      >
        <form className="space-y-6" onSubmit={handleCreateArticle}>
          <div className="space-y-4">
            <Input name="title" label="Article Title" placeholder="e.g. Code Review Process" required />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Category</label>
              <select name="category" className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400">
                <option>Engineering</option>
                <option>Company Policy</option>
                <option>Onboarding</option>
                <option>Design</option>
                <option>Tech Stack</option>
                <option>Project Guidelines</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Content (Markdown supported)</label>
              <textarea 
                name="content"
                className="w-full min-h-[200px] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                placeholder="Write your article here..."
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated">
              {submitting ? 'Publishing...' : 'Publish Article'}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Categories</div>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)} className="text-[10px] font-bold text-black uppercase tracking-widest hover:underline">Clear Filter</button>
              )}
            </div>
            {categories.map((cat, i) => (
              <motion.div key={i} variants={item}>
                <button 
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group",
                    selectedCategory === cat.name 
                      ? "bg-zinc-900 border-zinc-900 shadow-elevated" 
                      : "bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-soft"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      selectedCategory === cat.name ? "bg-white/10 text-white" : "bg-zinc-50 text-zinc-400 group-hover:text-black"
                    )}>
                      <Book className="w-4 h-4" />
                    </div>
                    <span className={cn("text-sm font-bold transition-colors", selectedCategory === cat.name ? "text-white" : "text-zinc-600 group-hover:text-black")}>{cat.name}</span>
                  </div>
                  <span className={cn("text-xs font-bold", selectedCategory === cat.name ? "text-white/60" : "text-zinc-400")}>{cat.count}</span>
                </button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-3 space-y-6">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">
              {searchQuery ? `Search Results for "${searchQuery}"` : (selectedCategory ? `${selectedCategory} Articles` : 'Recent Articles')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 text-zinc-400 text-sm">No articles found matching your criteria.</div>
              ) : filteredArticles.map((article) => (
                <motion.div key={article.id} variants={item}>
                  <Card 
                    onClick={() => setSelectedArticle(article)}
                    className="hover:shadow-soft border-zinc-100 group cursor-pointer transition-all hover:border-zinc-300 h-full"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="text-sm font-bold text-black mb-1 group-hover:text-zinc-500 transition-colors line-clamp-1">{article.title}</h3>
                      <p className="text-xs text-zinc-500 font-medium mb-4">Last updated {new Date(article.created_at).toLocaleDateString()} by {article.profiles?.full_name || 'System'}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 uppercase tracking-widest">{article.category}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
