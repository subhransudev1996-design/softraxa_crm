"use client";

import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Copy, RefreshCw, Trash2, 
  CheckCircle2, XCircle, Clock, ExternalLink, 
  Search, Filter, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface License {
  id: string;
  license_key: string;
  user_id: string | null;
  client_name: string | null;
  app_name: string;
  hardware_id: string | null;
  status: 'pending' | 'active' | 'revoked' | 'expired';
  expires_at: string | null;
  activated_at: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export default function LicenseManager() {
  const { profile } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create Form State
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [expirationDays, setExpirationDays] = useState('365');
  const [clients, setClients] = useState<Profile[]>([]);

  useEffect(() => {
    fetchLicenses();
    fetchClients();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('desktop_licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error: any) {
      console.error('Error fetching licenses:', error.message);
      toast.error('Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'client'); // Or include other roles if needed

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error.message);
    }
  };

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SFTR-${segment()}-${segment()}-${segment()}`;
  };

  const handleCreateLicense = async () => {
    try {
      const key = generateKey();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));

      const { data, error } = await supabase
        .from('desktop_licenses')
        .insert([{
          license_key: key,
          user_id: selectedUser || null,
          client_name: clientName,
          app_name: 'gst-billing',
          status: 'pending',
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('License key generated successfully');
      setLicenses([data, ...licenses]);
      setIsCreateModalOpen(false);
      
      // Reset form
      setSelectedUser('');
      setClientName('');
    } catch (error: any) {
      toast.error('Error creating license: ' + error.message);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this license? The user will no longer be able to use the software.')) return;

    try {
      const { error } = await supabase
        .from('desktop_licenses')
        .update({ status: 'revoked' })
        .eq('id', id);

      if (error) throw error;

      toast.success('License revoked');
      fetchLicenses();
    } catch (error: any) {
      toast.error('Error revoking license: ' + error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Key copied to clipboard');
  };

  const filteredLicenses = licenses.filter(l => 
    l.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.hardware_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const base = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold";
    switch (status) {
      case 'active':
        return <span className={`${base} bg-green-500/10 text-green-600 border-green-500/20`}>Active</span>;
      case 'revoked':
        return <span className={`${base} bg-red-500/10 text-red-600 border-red-500/20`}>Revoked</span>;
      case 'expired':
        return <span className={`${base} text-zinc-500 border-zinc-200 bg-transparent`}>Expired</span>;
      default:
        return <span className={`${base} bg-zinc-100 text-zinc-600 border-zinc-200`}>Pending</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-black flex items-center gap-3">
            <Shield className="w-8 h-8 text-black" />
            Desktop <span className="font-light text-zinc-400">Licensing</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Manage and monitor software licenses for offline desktop apps.</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-zinc-800 shadow-elevated transition-all active:scale-95">
              <Plus className="w-4 h-4 mr-2" /> Generate New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-zinc-200 text-black max-w-md shadow-soft">
            <DialogHeader>
              <DialogTitle>Generate License Key</DialogTitle>
              <DialogDescription className="text-zinc-500">
                Create a new license key for the GST Billing software.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Assign to Client</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-zinc-50 border-zinc-200 text-black">
                    <SelectValue placeholder="Select a registered client" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-zinc-200 text-black">
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">External Client Name (Optional)</label>
                <Input 
                  placeholder="e.g. Acme Corp" 
                  className="bg-zinc-50 border-zinc-200 text-black focus:ring-zinc-400"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Validity Period</label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger className="bg-zinc-50 border-zinc-200 text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-zinc-200 text-black">
                    <SelectItem value="30">30 Days (Demo)</SelectItem>
                    <SelectItem value="90">90 Days (Quarterly)</SelectItem>
                    <SelectItem value="365">365 Days (Annual)</SelectItem>
                    <SelectItem value="3650">Lifetime (10 Years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateLicense} className="bg-black text-white hover:bg-zinc-800">
                Generate Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-zinc-100 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 pb-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Search by key, client, or hardware ID..." 
              className="pl-10 bg-zinc-50 border-zinc-200 focus:ring-zinc-400 text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50" onClick={fetchLicenses}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-100 hover:bg-transparent">
                <TableHead className="text-zinc-500 text-xs uppercase font-bold px-6">License Key</TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase font-bold px-6">Client</TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase font-bold px-6">Status</TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase font-bold px-6">Activation</TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase font-bold px-6">Expiry</TableHead>
                <TableHead className="text-right px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-zinc-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
                    Loading licenses...
                  </TableCell>
                </TableRow>
              ) : filteredLicenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-zinc-500 font-medium">
                    No license keys found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLicenses.map((license) => (
                  <TableRow key={license.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-[13px] font-mono font-bold text-black bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
                          {license.license_key}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(license.license_key)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 rounded transition-all"
                        >
                          <Copy className="w-3 h-3 text-zinc-500" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-black font-bold">{license.client_name || 'Individual'}</span>
                        {license.user_id && <span className="text-[10px] text-zinc-500 font-medium">System Link: {license.user_id.slice(0, 8)}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {getStatusBadge(license.status)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {license.hardware_id ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Activated
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px]" title={license.hardware_id}>
                            ID: {license.hardware_id}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Pending
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs text-zinc-500 font-medium">
                      {license.expires_at ? format(new Date(license.expires_at), 'MMM dd, yyyy') : 'No Expiry'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {license.status !== 'revoked' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-zinc-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleRevoke(license.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-black">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
