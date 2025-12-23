import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    CheckSquare,
    Plus,
    Calendar,
    Clock,
    User,
    AlertCircle,
    ChevronRight,
    Search,
    Layout,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from '../../components/DashboardLayout';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    project_id: string | null;
    assignee_id: string;
    start_date: string | null;
    due_date: string | null;
    checkpoint_date: string | null;
    projects?: { name: string };
    profiles?: { full_name: string };
}

const TasksOverview: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
    const [profiles, setProfiles] = useState<{ id: string, full_name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [isRunningCheckpoints, setIsRunningCheckpoints] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        overdue: 0
    });

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        priority: 'medium' as const,
        status: 'todo' as const,
        start_date: '',
        due_date: '',
        checkpoint_date: '',
        min_progress_required: 0,
        backup_assignee_id: '',
        auto_transfer_enabled: false
    });

    useEffect(() => {
        fetchTasks();
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        const { data: projectsData } = await supabase.from('projects').select('id, name');
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name');
        if (projectsData) setProjects(projectsData);
        if (profilesData) setProfiles(profilesData);
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    projects (name),
                    profiles:assignee_id (full_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                setTasks(data as Task[]);

                // Calculate Stats
                const now = new Date();
                const total = data.length;
                const pending = data.filter(t => t.status === 'todo' || t.status === 'in_progress' || t.status === 'review').length;
                const completed = data.filter(t => t.status === 'done').length;
                const overdue = data.filter(t => {
                    if (t.status === 'done' || !t.due_date) return false;
                    return new Date(t.due_date) < now;
                }).length;

                setStats({
                    total,
                    pending,
                    completed,
                    overdue
                });
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('tasks').insert([{
                ...newTask,
                project_id: newTask.project_id || null,
                backup_assignee_id: newTask.backup_assignee_id || null,
                start_date: newTask.start_date || null,
                due_date: newTask.due_date || null,
                checkpoint_date: newTask.checkpoint_date || null,
            }]);

            if (error) throw error;
            setIsModalOpen(false);
            setNewTask({
                title: '',
                description: '',
                project_id: '',
                assignee_id: '',
                priority: 'medium',
                status: 'todo',
                start_date: '',
                due_date: '',
                checkpoint_date: '',
                min_progress_required: 0,
                backup_assignee_id: '',
                auto_transfer_enabled: false
            });
            fetchTasks();
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const runCheckpoints = async () => {
        setIsRunningCheckpoints(true);
        try {
            const { error } = await supabase.rpc('check_task_checkpoints');
            if (error) throw error;
            alert('Checkpoint scan complete. Notifications sent for any failures.');
            fetchTasks();
        } catch (error) {
            console.error('Error running checkpoints:', error);
            alert('Failed to run checkpoint scan. Ensure the SQL migration 20251223000006 was applied.');
        } finally {
            setIsRunningCheckpoints(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-green-500';
            case 'review': return 'bg-purple-500';
            case 'in_progress': return 'bg-blue-500';
            case 'todo': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.projects?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const updateTaskStatus = async (id: string, newStatus: Task['status']) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', id);
            if (error) throw error;
            fetchTasks();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-semibold text-black">Create New Task</h2>
                                    <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">Cancel</Button>
                                </div>

                                <form onSubmit={handleAddTask} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Title</label>
                                            <input required type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-black" placeholder="Task summary..." />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project (Optional)</label>
                                            <select value={newTask.project_id} onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-black appearance-none">
                                                <option value="">Individual Task</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignee</label>
                                            <select required value={newTask.assignee_id} onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-black appearance-none">
                                                <option value="">Select Employee</option>
                                                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                                                <input type="date" value={newTask.start_date} onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</label>
                                                <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none" />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-50 md:col-span-2 space-y-4">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Checkpoint Settings (Optional)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Checkpoint Date</label>
                                                    <input type="date" value={newTask.checkpoint_date} onChange={(e) => setNewTask({ ...newTask, checkpoint_date: e.target.value })} className="w-full px-4 py-2.5 bg-gray-100/50 border-none rounded-xl text-sm outline-none" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Min Progress (%)</label>
                                                    <input type="number" min="0" max="100" value={newTask.min_progress_required} onChange={(e) => setNewTask({ ...newTask, min_progress_required: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-100/50 border-none rounded-xl text-sm outline-none" />
                                                </div>
                                                <div className="md:col-span-2 space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Backup Assignee</label>
                                                    <select value={newTask.backup_assignee_id} onChange={(e) => setNewTask({ ...newTask, backup_assignee_id: e.target.value })} className="w-full px-4 py-2.5 bg-gray-100/50 border-none rounded-xl text-sm outline-none appearance-none">
                                                        <option value="">No Backup</option>
                                                        {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 flex items-center gap-3">
                                                    <input type="checkbox" id="auto_transfer" checked={newTask.auto_transfer_enabled} onChange={(e) => setNewTask({ ...newTask, auto_transfer_enabled: e.target.checked })} className="w-4 h-4 rounded-md border-gray-300 focus:ring-black" />
                                                    <label htmlFor="auto_transfer" className="text-xs font-bold text-black uppercase tracking-widest cursor-pointer">Enable Auto-Transfer on failure</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={isSubmitting} className="w-full py-6 rounded-2xl bg-black text-white hover:bg-gray-800 shadow-xl shadow-gray-200 mt-4 transition-all">
                                        {isSubmitting ? 'Creating...' : 'Assign Task'}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-light tracking-tight text-black text-center md:text-left">
                            Task <span className="font-semibold text-gray-400 text-center md:text-left">Central</span>
                        </h1>
                        <p className="text-gray-400 font-medium text-center md:text-left">Manage, track and execute deliverables across all projects.</p>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-end gap-3">
                        <div className="flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest outline-none px-3 py-1.5 cursor-pointer appearance-none"
                            >
                                <option value="all">Statuses</option>
                                <option value="todo">No Start</option>
                                <option value="in_progress">Active</option>
                                <option value="review">Review</option>
                                <option value="done">Completed</option>
                            </select>
                        </div>
                        <div className="flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest outline-none px-3 py-1.5 cursor-pointer appearance-none"
                            >
                                <option value="all">Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <Button
                            variant="outline"
                            onClick={runCheckpoints}
                            disabled={isRunningCheckpoints}
                            className="rounded-xl border-gray-100 font-bold uppercase tracking-widest text-[10px] px-4"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRunningCheckpoints ? 'animate-spin' : ''}`} />
                            {isRunningCheckpoints ? 'Scanning...' : 'Scan'}
                        </Button>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-xl bg-black text-white hover:bg-gray-800 shadow-xl shadow-gray-200 font-bold uppercase tracking-widest text-[10px] px-6"
                        >
                            <Plus className="w-3.5 h-3.5 mr-2" /> New Task
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.total}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Global Tasks</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <CheckSquare className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.pending}</p>
                                    <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-widest">Active Pipeline</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.completed}</p>
                                    <p className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-widest">Deliverables Sent</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                    <CheckSquare className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-2xl overflow-hidden relative">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <p className="text-3xl font-bold text-white">{stats.overdue.toString().padStart(2, '0')}</p>
                                    <p className="text-[10px] text-red-400 font-bold mt-1 uppercase tracking-widest">Missed Deadlines</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by title, project, or assignee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-1 focus:ring-black outline-none shadow-sm transition-all"
                    />
                </div>

                {/* Task Grid/List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="py-20 text-center text-gray-400 animate-pulse font-medium">Loading tasks...</div>
                    ) : filteredTasks.length === 0 ? (
                        <Card className="py-20 bg-white border-dashed border-2 border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-4">
                            <CheckSquare className="w-12 h-12 opacity-10" />
                            <p className="font-medium">No tasks found. Start by creating your first task.</p>
                        </Card>
                    ) : (
                        filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className="group bg-white border border-gray-100 rounded-2xl p-4 md:p-6 hover:border-black hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-6"
                            >
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${getStatusColor(task.status)} shadow-lg shadow-gray-100`}>
                                        <CheckSquare className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-black text-base truncate">{task.title}</h3>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                <Layout className="w-3 h-3" />
                                                {task.projects?.name || 'Individual'}
                                            </span>
                                            <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {task.profiles?.full_name || 'Unassigned'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 md:ml-auto w-full md:w-auto justify-between md:justify-end">
                                    <div className="flex items-center gap-8">
                                        <div className="text-center md:text-left">
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Timing</p>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-black">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'TBD'}
                                                <span className="mx-1 text-gray-200">→</span>
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'TBD'}
                                            </div>
                                        </div>

                                        {task.checkpoint_date && (
                                            <div className="text-center md:text-left">
                                                <p className="text-[8px] font-black text-blue-300 uppercase tracking-widest mb-1">Checkpoint</p>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(task.checkpoint_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-[1px] bg-gray-50 mx-2 hidden md:block" />
                                        {task.status !== 'done' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateTaskStatus(task.id, 'done');
                                                }}
                                                className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-green-600 hover:bg-green-50"
                                            >
                                                Mark Done
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="group-hover:bg-black group-hover:text-white rounded-xl transition-all">
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TasksOverview;
