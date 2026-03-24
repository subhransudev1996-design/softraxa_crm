"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckSquare, Plus, Search, Filter, MoreHorizontal, Clock, ArrowUpRight, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import Link from 'next/link';

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

export function TasksOverview() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [profiles, setProfiles] = React.useState<any[]>([]);
  const [assignToClient, setAssignToClient] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const columns = ['todo', 'in_progress', 'review', 'done'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes, prRes] = await Promise.allSettled([
        supabase.from('tasks').select('*, projects(name), profiles:assignee_id(full_name, role), leads(name, company)').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name'),
        supabase.from('profiles').select('id, full_name, role'),
      ]);

      if (tRes.status === 'fulfilled') setTasks(tRes.value.data || []);
      if (pRes.status === 'fulfilled') setProjects(pRes.value.data || []);
      if (prRes.status === 'fulfilled') setProfiles(prRes.value.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const employees = profiles.filter(p => p.role !== 'client');
  const clients = profiles.filter(p => p.role === 'client');

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase.from('tasks').insert({
        title: formData.get('title'),
        project_id: formData.get('project_id'),
        assignee_id: formData.get('assignee_id') || null,
        due_date: formData.get('due_date') || null,
        priority: formData.get('priority'),
        status: 'todo',
      });

      if (!error) {
        setIsModalOpen(false);
        setAssignToClient(false);
        fetchData();
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const [draggedOverCol, setDraggedOverCol] = React.useState<string | null>(null);

  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setActiveTaskId(null); // Close any open menu on drag start
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDraggedOverCol(col);
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    setDraggedOverCol(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1 || prevTasks[taskIndex].status === newStatus) return prevTasks;

      const updatedTasks = [...prevTasks];
      const oldStatus = updatedTasks[taskIndex].status;
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: newStatus };

      // Update Supabase in background
      supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .then(({ error }) => {
          if (error) {
            alert('Failed to update task status: ' + error.message);
            // Revert state if error
            setTasks(current => {
              const revertTasks = [...current];
              const idx = revertTasks.findIndex(t => t.id === taskId);
              if (idx !== -1) revertTasks[idx] = { ...revertTasks[idx], status: oldStatus };
              return revertTasks;
            });
          }
        });

      return updatedTasks;
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (!error) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setActiveTaskId(null);
      } else {
        alert(error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-20" onClick={() => setActiveTaskId(null)}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-black flex items-center gap-3">
            Task <span className="font-light text-zinc-400">Board</span>
          </h1>
          <p className="text-zinc-500 font-medium text-sm">Managing {tasks.length} active development cycles.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 border-zinc-200">
            <Filter className="w-4 h-4 mr-2" /> Filter Stream
          </Button>
          <Button onClick={() => { setAssignToClient(false); setIsModalOpen(true); }} className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95 h-11 px-6 rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Initialize Task
          </Button>
        </div>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setAssignToClient(false); }} 
        title="Initialize New Task"
      >
        <form className="space-y-6" onSubmit={handleCreateTask}>
          <div className="space-y-4">
            <Input name="title" label="Task Objective" placeholder="e.g. Implement OAuth Flow" required />
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Context / Project</label>
              <select name="project_id" required className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-all">
                <option value="">Select project context...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="pt-2 pb-1">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    assignToClient ? "bg-emerald-100 text-emerald-600" : "bg-zinc-200 text-zinc-500"
                  )}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">Assign to Client</p>
                    <p className="text-[9px] text-zinc-400 uppercase font-black tracking-tighter">External Stakeholder Assignment</p>
                  </div>
                </div>
                <div 
                  onClick={() => setAssignToClient(!assignToClient)}
                  className={cn(
                    "w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300",
                    assignToClient ? "bg-black" : "bg-zinc-200"
                  )}
                >
                  <motion.div 
                    animate={{ x: assignToClient ? 22 : 2 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                {assignToClient ? 'Stakeholder Assignment' : 'Internal Assignee'}
              </label>
              <select name="assignee_id" className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-all">
                <option value="">{assignToClient ? 'Select client...' : 'Select team member...'}</option>
                {(assignToClient ? clients : employees).map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input name="due_date" label="Commitment Date" type="date" />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] ml-1">Priority Matrix</label>
                <select name="priority" className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400 transition-all">
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Mission</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); setAssignToClient(false); }} className="flex-1 rounded-xl text-zinc-400">Discard</Button>
            <Button type="submit" disabled={submitting} className="flex-1 shadow-elevated rounded-xl bg-black text-white hover:bg-zinc-800 h-11">
              {submitting ? 'Processing...' : 'Confirm Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((col) => {
            const colTasks = tasks.filter(t => t.status === col);
            return (
              <div 
                key={col} 
                className={cn(
                  "space-y-6 transition-all duration-200 rounded-3xl p-2",
                  draggedOverCol === col ? "bg-zinc-100/50 ring-2 ring-black/5" : "bg-transparent"
                )}
                onDragOver={(e) => handleDragOver(e, col)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col)}
              >
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-4 bg-black rounded-full" />
                    <h2 className="text-sm font-bold text-black uppercase tracking-widest">{col.replace('_', ' ')}</h2>
                  </div>
                  <span className="text-[10px] font-black bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>

                <div className="space-y-4 min-h-[150px]">
                  <AnimatePresence mode="popLayout">
                    {colTasks.length === 0 ? (
                      <motion.div 
                        key={`${col}-empty`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest text-center py-8 border border-dashed border-zinc-100 rounded-2xl"
                      >
                        Empty
                      </motion.div>
                    ) : (
                      colTasks.map((task) => (
                        <motion.div 
                          key={task.id} 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card 
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className="hover:shadow-soft border-zinc-100 group transition-all hover:border-zinc-300 cursor-grab active:cursor-grabbing"
                          >
                            <CardContent className="p-5">
                              <div className="flex justify-between items-start mb-4 relative">
                                <span className={cn(
                                  "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                                  task.priority === 'critical' ? "bg-black text-white" : 
                                  task.priority === 'high' ? "bg-zinc-200 text-zinc-900" : "bg-zinc-100 text-zinc-500"
                                )}>
                                  {task.priority}
                                </span>
                                <div className="relative">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveTaskId(activeTaskId === task.id ? null : task.id);
                                    }}
                                    className="w-6 h-6 text-zinc-300 group-hover:text-black"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                  
                                  {activeTaskId === task.id && (
                                    <div 
                                      className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-elevated border border-zinc-100 py-1 z-50 animate-in fade-in zoom-in duration-200"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button 
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                                      >
                                        Delete Task
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <h3 className="text-sm font-bold text-black mb-1 group-hover:text-zinc-500 transition-colors">{task.title}</h3>
                              <div className="flex flex-col gap-1 mb-6">
                                <p className="text-[11px] text-zinc-400 font-medium">{task.projects?.name || 'General'}</p>
                                {task.leads && (
                                  <Link 
                                    href={`/crm/${task.lead_id}`}
                                    className="inline-flex items-center gap-1.5 text-[9px] font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-colors"
                                  >
                                    <ArrowUpRight className="w-3 h-3" />
                                    Lead: {task.leads.company || task.leads.name}
                                  </Link>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[8px] font-bold">
                                    {task.profiles?.full_name?.charAt(0) || 'U'}
                                  </div>
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{task.profiles?.full_name || 'Nobody'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
                                  <Clock className="w-3 h-3" />
                                  <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'No date'}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
