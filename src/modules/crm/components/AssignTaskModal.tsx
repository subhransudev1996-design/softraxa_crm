"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Calendar, User, Flag, CheckCircle2, 
  MessageCircle, AlertCircle, Clock, LayoutGrid
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
  };
}

export function AssignTaskModal({ isOpen, onClose, lead }: AssignTaskModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState(`Demo for ${lead.company || lead.name}`);
  const [description, setDescription] = useState(`Contact details:\nEmail: ${lead.email || "N/A"}\nPhone: ${lead.phone || "N/A"}`);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone')
        .eq('role', 'member');
      
      if (data) setMembers(data);
      setLoading(false);
    };

    if (isOpen) fetchMembers();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('tasks').insert({
        title,
        description,
        assigned_to: selectedAssignee,
        created_by: user?.id,
        due_date: dueDate,
        priority,
        status: 'pending',
        lead_id: lead.id
      });

      if (insertError) throw insertError;

      setSuccess(true);
      
      // WhatsApp Notification Logic
      const assignee = members.find(m => m.id === selectedAssignee);
      if (assignee?.phone && confirm(`Task assigned! Would you like to notify ${assignee.full_name} on WhatsApp?`)) {
        const message = `Hi ${assignee.full_name}, a new task has been assigned to you regarding Lead: ${lead.name}. Please check the CRM for details.`;
        window.open(`https://wa.me/${assignee.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign New Task"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-red-100">
            <AlertCircle className="w- 3 h-3" /> {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Schedule Product Demo"
            required
            className="h-11 rounded-xl"
          />

          <div className="space-y-1.5 px-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] p-4 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
              placeholder="Provide deep context for the team member..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 px-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Assign To</label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
                required
              >
                <option value="">Select Member</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 px-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 px-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-xl h-12">Cancel</Button>
          <Button 
            type="submit" 
            disabled={submitting || !selectedAssignee}
            className="flex-1 bg-black text-white hover:bg-zinc-800 rounded-xl shadow-elevated h-12 font-black uppercase tracking-widest text-[10px]"
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
