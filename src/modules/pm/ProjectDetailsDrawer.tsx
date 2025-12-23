import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    X,
    Briefcase,
    Users,
    ListTodo,
    TrendingUp,
    Clock,
    Plus,
    CheckCircle2,
    Lock,
    Files
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectDetailsDrawerProps {
    projectId: string;
    onClose: () => void;
}

const ProjectDetailsDrawer: React.FC<ProjectDetailsDrawerProps> = ({ projectId, onClose }) => {
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState<'insights' | 'tasks' | 'team'>('insights');

    useEffect(() => {
        if (projectId) fetchDetails();
    }, [projectId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            // Fetch Project
            const { data: projectData } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            // Fetch Project Tasks
            const { data: taskData } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            // Fetch Members
            const { data: memberData } = await supabase
                .from('project_members')
                .select('*, profiles:user_id (full_name, avatar_url, role)')
                .eq('project_id', projectId);

            setProject(projectData);
            setTasks(taskData || []);
            setMembers(memberData || []);
        } catch (error) {
            console.error('Error fetching project details:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProject = async (updates: any) => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', projectId);
            if (error) throw error;
            fetchDetails();
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project.');
        } finally {
            setUpdating(false);
        }
    };

    if (!projectId) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[110] transform transition-transform animate-in slide-in-from-right duration-300 border-l border-gray-100">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-black text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{project?.name || 'Loading Project...'}</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {project?.project_type || 'Client'} Project
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-white rounded-full">
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                {/* Tabs Navigation */}
                <div className="px-8 flex items-center gap-8 border-b border-gray-50 bg-gray-50/50">
                    {[
                        { id: 'insights', label: 'Insights', icon: TrendingUp },
                        { id: 'tasks', label: 'Deliverables', icon: ListTodo },
                        { id: 'team', label: 'Team Members', icon: Users }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-all text-xs font-bold uppercase tracking-widest ${activeTab === tab.id
                                ? 'border-black text-black'
                                : 'border-transparent text-gray-400 hover:text-black'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        </div>
                    ) : (
                        <div className="p-8 space-y-8">
                            {activeTab === 'insights' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <Card className="bg-gray-50/50 border-none rounded-2xl">
                                            <CardContent className="p-4 space-y-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</p>
                                                <p className="text-xl font-bold text-black">{project?.completion_percentage}%</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gray-50/50 border-none rounded-2xl">
                                            <CardContent className="p-4 space-y-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget</p>
                                                <p className="text-xl font-bold text-black">${(Number(project?.budget) / 1000).toFixed(1)}k</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gray-50/50 border-none rounded-2xl">
                                            <CardContent className="p-4 space-y-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tasks</p>
                                                <p className="text-xl font-bold text-black">{tasks.length}</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gray-50/50 border-none rounded-2xl">
                                            <CardContent className="p-4 space-y-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Health</p>
                                                <select
                                                    value={project?.health_status || 'green'}
                                                    onChange={(e) => updateProject({ health_status: e.target.value })}
                                                    disabled={updating}
                                                    className="bg-transparent text-xs font-bold uppercase tracking-widest outline-none cursor-pointer p-0 border-none"
                                                >
                                                    <option value="green">Healthy</option>
                                                    <option value="yellow">At Risk</option>
                                                    <option value="red">Critical</option>
                                                </select>
                                                <div className={`w-full h-1 rounded-full mt-1 ${project?.health_status === 'green' ? 'bg-green-500' :
                                                    project?.health_status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} />
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-black flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                Timeline & Status
                                            </h4>
                                            <select
                                                value={project?.status || 'planning'}
                                                onChange={(e) => updateProject({ status: e.target.value })}
                                                disabled={updating}
                                                className="bg-white px-3 py-1.5 rounded-lg border border-gray-100 text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer shadow-sm hover:border-black transition-all"
                                            >
                                                <option value="planning">Planning</option>
                                                <option value="active">Active</option>
                                                <option value="completed">Completed</option>
                                                <option value="on_hold">On Hold</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                                            <span>Starts: {new Date(project?.start_date).toLocaleDateString()}</span>
                                            <span>Target: {new Date(project?.end_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                            <div
                                                className="bg-black h-full transition-all duration-1000"
                                                style={{ width: `${project?.completion_percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 border border-gray-100 rounded-3xl space-y-4 hover:border-black transition-all group">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vault Status</h5>
                                                <Lock className="w-4 h-4 text-gray-200 group-hover:text-black transition-colors" />
                                            </div>
                                            <p className="text-xs text-gray-400">Credential vault contains {Math.ceil(tasks.length / 2) + 2} encrypted items including Server Access and API keys.</p>
                                            <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest p-0 text-black hover:bg-transparent">Open Vault</Button>
                                        </div>
                                        <div className="p-6 border border-gray-100 rounded-3xl space-y-4 hover:border-black transition-all group">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assets</h5>
                                                <Files className="w-4 h-4 text-gray-200 group-hover:text-black transition-colors" />
                                            </div>
                                            <p className="text-xs text-gray-400">Asset library contains {tasks.length + members.length} files including Figma mocks and Project SRS.</p>
                                            <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest p-0 text-black hover:bg-transparent">Explore Files</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Project Deliverables</h4>
                                        <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-black">
                                            <Plus className="w-3.5 h-3.5 mr-1" /> New Task
                                        </Button>
                                    </div>
                                    {tasks.length === 0 ? (
                                        <div className="py-12 text-center text-gray-400 border border-dashed border-gray-100 rounded-3xl">
                                            <ListTodo className="w-10 h-10 opacity-10 mx-auto mb-4" />
                                            <p className="text-xs font-medium">No tasks assigned to this project yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {tasks.map(task => (
                                                <div key={task.id} className="p-4 bg-white border border-gray-50 rounded-2xl flex items-center justify-between group hover:border-black transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] ${task.status === 'done' ? 'bg-green-500' : 'bg-gray-400'
                                                            }`}>
                                                            {task.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : 'TD'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-black">{task.title}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{task.priority} Priority</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-all">
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'team' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Assigned Personnel</h4>
                                        <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-black">
                                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Member
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {members.map(member => (
                                            <div key={member.id} className="p-4 bg-gray-50/50 rounded-2xl flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center text-xs font-bold">
                                                        {member.profiles?.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-black">{member.profiles?.full_name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{member.role || 'Contributor'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                                                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="p-4 border border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 gap-2 cursor-pointer hover:bg-gray-50 transition-all">
                                            <Plus className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Add Team Member</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsDrawer;
