import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Briefcase,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    Users,
    DollarSign,
    ChevronRight,
    LayoutGrid,
    LayoutList,
    Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from '../../components/DashboardLayout';
import ProjectDetailsDrawer from './ProjectDetailsDrawer';

interface Project {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on_hold';
    budget: number;
    start_date: string;
    end_date: string;
    completion_percentage: number;
    client_id: string;
    project_type: 'client' | 'internal' | 'r&d';
    health_status: 'green' | 'yellow' | 'red';
    actual_cost: number;
    created_at: string;
}

const ProjectsOverview: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        budget: '',
        status: 'planning',
        start_date: '',
        end_date: '',
        project_type: 'client',
    });
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [stats, setStats] = useState({
        active: 0,
        avgCompletion: 0,
        delayed: 0,
        totalBudget: 0
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select(`
                    *,
                    project_members (
                        user_id,
                        profiles (
                            full_name,
                            avatar_url
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                setProjects(data);

                // Calculate Stats
                const now = new Date();
                const active = data.filter(p => p.status === 'active').length;
                const totalCompletion = data.reduce((acc, curr) => acc + (curr.completion_percentage || 0), 0);
                const avgCompletion = data.length > 0 ? totalCompletion / data.length : 0;

                const delayed = data.filter(p => {
                    if (!p.end_date || p.completion_percentage >= 100) return false;
                    return new Date(p.end_date) < now;
                }).length;

                const totalBudget = data.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0);

                setStats({
                    active,
                    avgCompletion,
                    delayed,
                    totalBudget
                });
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('projects')
                .insert([{
                    ...newProject,
                    budget: parseFloat(newProject.budget) || 0,
                    completion_percentage: 0
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewProject({
                name: '',
                description: '',
                budget: '',
                status: 'planning',
                start_date: '',
                end_date: '',
                project_type: 'client',
            });
            fetchProjects();
        } catch (error) {
            console.error('Error adding project:', error);
            alert('Failed to add project. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getHealthColor = (health: string) => {
        switch (health) {
            case 'red': return 'bg-red-500';
            case 'yellow': return 'bg-yellow-500';
            case 'green': return 'bg-green-500';
            default: return 'bg-green-500';
        }
    };

    const openProjectDetails = (id: string) => {
        setSelectedProjectId(id);
        setIsDrawerOpen(true);
    };

    const filteredProjects = projects.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || p.project_type === filterType;
        return matchesSearch && matchesType;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'on_hold': return 'bg-red-100 text-red-700';
            case 'active': return 'bg-blue-100 text-blue-700';
            case 'planning': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-light tracking-tight text-black">
                            Project <span className="font-semibold text-gray-400">Management</span>
                        </h1>
                        <p className="text-gray-400">Track company projects, budgets, and delivery timelines.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:ring-1 focus:ring-black outline-none w-[200px] shadow-sm transition-all"
                            />
                        </div>
                        <div className="flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold uppercase tracking-widest outline-none px-2 py-1 cursor-pointer"
                            >
                                <option value="all">All Types</option>
                                <option value="client">Client</option>
                                <option value="internal">Internal</option>
                                <option value="r&d">R&D</option>
                            </select>
                        </div>
                        <div className="flex bg-gray-50 p-1 rounded-xl">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className={`rounded-lg px-3 ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('kanban')}
                                className={`rounded-lg px-3 ${viewMode === 'kanban' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}
                            >
                                <LayoutList className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-xl bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
                        >
                            <Plus className="w-4 h-4 mr-2" /> New Project
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.active}</p>
                                    <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-widest">Delivery Phase</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Completion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{Math.round(stats.avgCompletion)}%</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Average Progress</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-100 border shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Delayed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-black">{stats.delayed.toString().padStart(2, '0')}</p>
                                    <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-widest">Overdue Items</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black text-white shadow-xl shadow-gray-200 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign className="w-20 h-20 text-white" />
                        </div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Budget</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-3xl font-bold">
                                        ${(stats.totalBudget / 1000).toFixed(1)}k
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Project Value</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Modal Overlay */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-semibold text-black">Create New Project</h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-gray-400 hover:text-black"
                                    >
                                        Cancel
                                    </Button>
                                </div>

                                <form onSubmit={handleAddProject} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={newProject.name}
                                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                            placeholder="e.g. Website Redesign"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                                        <textarea
                                            value={newProject.description}
                                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none min-h-[80px]"
                                            placeholder="Project details..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget ($)</label>
                                            <input
                                                required
                                                type="number"
                                                value={newProject.budget}
                                                onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                                placeholder="10000"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Initial Status</label>
                                            <select
                                                value={newProject.status}
                                                onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none appearance-none"
                                            >
                                                <option value="planning">Planning</option>
                                                <option value="active">Active</option>
                                                <option value="on_hold">On Hold</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Type</label>
                                            <select
                                                value={newProject.project_type}
                                                onChange={(e) => setNewProject({ ...newProject, project_type: e.target.value as any })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none appearance-none"
                                            >
                                                <option value="client">Client Project</option>
                                                <option value="internal">Internal Project</option>
                                                <option value="r&d">R&D / Lab</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                                            <input
                                                type="date"
                                                value={newProject.start_date}
                                                onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</label>
                                            <input
                                                type="date"
                                                value={newProject.end_date}
                                                onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-black outline-none"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-6 rounded-2xl bg-black text-white hover:bg-gray-800 shadow-xl shadow-gray-200 mt-4 transition-all"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Launch Project'}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projects Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center text-gray-400 animate-pulse">Loading projects...</div>
                    ) : filteredProjects.length === 0 ? (
                        <Card className="col-span-full py-20 bg-white border-dashed border-2 border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-4">
                            <Briefcase className="w-12 h-12 opacity-10" />
                            <p>No projects found matching your criteria.</p>
                        </Card>
                    ) : (
                        filteredProjects.map((project) => (
                            <Card
                                key={project.id}
                                onClick={() => openProjectDetails(project.id)}
                                className="bg-white border-gray-100 border shadow-sm rounded-3xl overflow-hidden group hover:border-black transition-all cursor-pointer relative"
                            >
                                {/* Health Status Indicator */}
                                <div className={`absolute top-6 right-6 w-2.5 h-2.5 rounded-full shadow-lg ${getHealthColor(project.health_status)}`} />

                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider bg-gray-50 text-gray-400">
                                                {project.project_type}
                                            </span>
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-black group-hover:text-gray-600 transition-colors line-clamp-1">{project.name}</CardTitle>
                                    <p className="text-sm text-gray-400 line-clamp-2 mt-2 leading-relaxed h-10">{project.description || 'No description provided.'}</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                                                <span className="text-sm font-bold text-black">{project.completion_percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-black h-full transition-all duration-500 ease-out"
                                                    style={{ width: `${project.completion_percentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Deadline: {project.end_date ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-black">
                                                <DollarSign className="w-3 h-3" />
                                                <span>${(Number(project.budget) || 0).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {(project as any).project_members?.slice(0, 3).map((member: any, i: number) => (
                                                    <div key={i} className="w-7 h-7 rounded-full bg-black border-2 border-white flex items-center justify-center text-[8px] font-bold text-white overflow-hidden" title={member.profiles?.full_name}>
                                                        {member.profiles?.avatar_url ? (
                                                            <img src={member.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            member.profiles?.full_name?.charAt(0) || '?'
                                                        )}
                                                    </div>
                                                ))}
                                                {(project as any).project_members?.length > 3 && (
                                                    <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-400">
                                                        +{(project as any).project_members.length - 3}
                                                    </div>
                                                )}
                                                {(!(project as any).project_members || (project as any).project_members.length === 0) && (
                                                    <div className="w-7 h-7 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-300">
                                                        <Users className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black group/btn p-0">
                                                View <ChevronRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {isDrawerOpen && selectedProjectId && (
                    <ProjectDetailsDrawer
                        projectId={selectedProjectId}
                        onClose={() => setIsDrawerOpen(false)}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default ProjectsOverview;
