import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Users, Plus, Search, RefreshCw, Edit2, MapPin, Eye } from "lucide-react";
import CustomerDetails from "./CustomerDetails";

interface Customer {
  id: number;
  name: string;
  gstin: string | null;
  phone: string | null;
  address: string | null;
  state_code: string | null;
  billing_address: string | null;
}

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingCustomerId, setViewingCustomerId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "", gstin: "", phone: "", address: "", state_code: "", billing_address: ""
  });

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data: Customer[] = await invoke("get_customers");
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editingId) {
        await invoke("update_customer", { id: editingId, ...payload });
      } else {
        await invoke("add_customer", payload);
      }
      setIsModalOpen(false);
      resetForm();
      loadCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const editCustomer = (c: Customer) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      gstin: c.gstin || "",
      phone: c.phone || "",
      address: c.address || "",
      state_code: c.state_code || "",
      billing_address: c.billing_address || ""
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", gstin: "", phone: "", address: "", state_code: "", billing_address: "" });
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (viewingCustomerId) {
    return <CustomerDetails customerId={viewingCustomerId} onBack={() => setViewingCustomerId(null)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-white" />
            Client <span className="font-bold text-white">Directory</span>
          </h2>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Maintain B2B/B2C profiles and State Codes for precise inter-state tax mapping.
          </p>
        </div>
        
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 glass p-6 rounded-[2rem] border border-zinc-800/50 flex flex-col items-center justify-center text-center h-48 border-dashed">
            <div className="text-4xl font-black">{customers.length}</div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Total Contacts</div>
        </div>
        
        <div className="lg:col-span-3 glass rounded-[2rem] border border-zinc-800/50 overflow-hidden relative">
          <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                placeholder="Search by name or GSTIN..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-zinc-600"
              />
            </div>
            <button onClick={loadCustomers} className="p-2 text-zinc-400 hover:text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
            {loading && customers.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">Loading clients...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400 font-medium">No clients recorded.</p>
              </div>
            ) : (
              filtered.map(c => (
                <div key={c.id} className="p-6 hover:bg-zinc-900/30 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-zinc-700 flex items-center justify-center font-bold text-lg text-white">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight flex items-center gap-2">
                        {c.name}
                        {c.gstin && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">B2B</span>}
                      </h4>
                      <p className="text-zinc-500 text-xs mt-1 flex items-center gap-3">
                        {c.gstin ? <span className="font-mono">GST: {c.gstin}</span> : <span>Unregistered (B2C)</span>}
                        {c.state_code && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> State {c.state_code}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewingCustomerId(c.id)} className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100" title="View Full Ledger">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => editCustomer(c)} className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100" title="Edit Profile">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#09090b] border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">{editingId ? 'Edit Client Profile' : 'New Client Registration'}</h3>
              <p className="text-sm text-zinc-500 mb-6 border-b border-zinc-800/50 pb-4">Entering the correct State Code is essential for valid IGST separation.</p>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Business / Contact Name <span className="text-red-500">*</span></label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">GSTIN Number</label>
                    <input pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} placeholder="Leave blank for B2C" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 font-mono text-zinc-300 uppercase" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">State Code <span className="text-red-500">*</span></label>
                    <input list="gst-states" required placeholder="Type or Select State..." value={form.state_code} onChange={e => setForm({...form, state_code: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white" />
                    <datalist id="gst-states">
                      <option value="01 - Jammu & Kashmir" />
                      <option value="02 - Himachal Pradesh" />
                      <option value="03 - Punjab" />
                      <option value="04 - Chandigarh" />
                      <option value="05 - Uttarakhand" />
                      <option value="06 - Haryana" />
                      <option value="07 - Delhi" />
                      <option value="08 - Rajasthan" />
                      <option value="09 - Uttar Pradesh" />
                      <option value="10 - Bihar" />
                      <option value="11 - Sikkim" />
                      <option value="12 - Arunachal Pradesh" />
                      <option value="13 - Nagaland" />
                      <option value="14 - Manipur" />
                      <option value="15 - Mizoram" />
                      <option value="16 - Tripura" />
                      <option value="17 - Meghalaya" />
                      <option value="18 - Assam" />
                      <option value="19 - West Bengal" />
                      <option value="20 - Jharkhand" />
                      <option value="21 - Odisha" />
                      <option value="22 - Chhattisgarh" />
                      <option value="23 - Madhya Pradesh" />
                      <option value="24 - Gujarat" />
                      <option value="25 - Daman & Diu" />
                      <option value="26 - Dadra & Nagar Haveli" />
                      <option value="27 - Maharashtra" />
                      <option value="28 - Andhra Pradesh (Old)" />
                      <option value="29 - Karnataka" />
                      <option value="30 - Goa" />
                      <option value="31 - Lakshadweep" />
                      <option value="32 - Kerala" />
                      <option value="33 - Tamil Nadu" />
                      <option value="34 - Puducherry" />
                      <option value="35 - Andaman & Nicobar Islands" />
                      <option value="36 - Telangana" />
                      <option value="37 - Andhra Pradesh" />
                      <option value="38 - Ladakh" />
                    </datalist>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Billing Address</label>
                  <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 resize-none"></textarea>
                </div>

                <div className="flex gap-3 pt-4 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-800 transition-colors font-medium">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors font-bold">Save Context</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
