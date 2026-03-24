import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings2, Building, MapPin, Hash, Landmark, Save, RefreshCw, Layers, Percent, Trash2, Plus } from "lucide-react";

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState("company");

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h2 className="text-3xl font-light tracking-tight flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-white" />
          Master <span className="font-bold text-white">Settings</span>
        </h2>
        <p className="text-zinc-500 font-medium text-sm mt-2 max-w-2xl">
          Configure core parameters of your ERP system. This includes Company Profile, Categories, and Master Tax Slabs.
        </p>
      </div>

      <div className="flex bg-black/50 p-1.5 rounded-2xl border border-zinc-800/50 w-fit backdrop-blur-xl">
        <button 
          onClick={() => setActiveTab("company")} 
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'company' ? 'bg-white text-black shadow-elevated' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
        >
          <Building className="w-4 h-4" /> Company Profile
        </button>
        <button 
          onClick={() => setActiveTab("categories")} 
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-white text-black shadow-elevated' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
        >
          <Layers className="w-4 h-4" /> Product Categories
        </button>
        <button 
          onClick={() => setActiveTab("taxes")} 
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'taxes' ? 'bg-white text-black shadow-elevated' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
        >
          <Percent className="w-4 h-4" /> Tax Slabs
        </button>
      </div>

      <div className="glass p-8 rounded-[2rem] border border-zinc-800/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        {activeTab === "company" && <CompanyProfileTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "taxes" && <TaxesTab />}
      </div>
    </div>
  );
}

function CompanyProfileTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "", address: "", gstin: "", state_code: "", bank_details: "", logo_data: "", signature_data: "", upi_id: ""
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const data: any = await invoke("get_settings");
      if (data) setForm({
        company_name: data.company_name || "", address: data.address || "",
        gstin: data.gstin || "", state_code: data.state_code || "", bank_details: data.bank_details || "",
        logo_data: data.logo_data || "", signature_data: data.signature_data || "", upi_id: data.upi_id || ""
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await invoke("save_settings", {
        companyName: form.company_name,
        address: form.address,
        gstin: form.gstin,
        stateCode: form.state_code,
        bankDetails: form.bank_details,
        logoData: form.logo_data,
        signatureData: form.signature_data,
        upiId: form.upi_id
      });
      alert("Company Profile saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings: " + String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({...form, logo_data: reader.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Signature must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({...form, signature_data: reader.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="flex py-12 justify-center"><RefreshCw className="w-6 h-6 animate-spin text-zinc-500" /></div>;

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Upload Section */}
        <div className="flex items-center gap-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 overflow-hidden flex items-center justify-center bg-zinc-900 shrink-0">
            {form.logo_data ? (
              <img src={form.logo_data} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <Building className="w-6 h-6 text-zinc-600" />
            )}
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-sm font-bold text-white block">Company Logo / Branding</label>
            <div className="flex items-center gap-3">
              <input type="file" id="logoUpload" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleLogoUpload} />
              <label htmlFor="logoUpload" className="cursor-pointer text-xs font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors">Choose File</label>
              {form.logo_data && <button type="button" onClick={() => setForm({...form, logo_data: ""})} className="text-xs font-bold text-red-500 hover:text-red-400">Remove</button>}
            </div>
          </div>
        </div>

        {/* Signature Upload Section */}
        <div className="flex items-center gap-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 overflow-hidden flex items-center justify-center bg-zinc-900 shrink-0">
            {form.signature_data ? (
              <img src={form.signature_data} alt="Signature" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-xs text-zinc-600 font-bold uppercase">Sign</span>
            )}
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-sm font-bold text-white block">Authorized Signatory</label>
            <div className="flex items-center gap-3">
              <input type="file" id="sigUpload" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleSignatureUpload} />
              <label htmlFor="sigUpload" className="cursor-pointer text-xs font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors">Choose File</label>
              {form.signature_data && <button type="button" onClick={() => setForm({...form, signature_data: ""})} className="text-xs font-bold text-red-500 hover:text-red-400">Remove</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Building className="w-3.5 h-3.5" /> Company Name</label>
          <input required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="Softraxa Corp" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> GSTIN Number</label>
          <input pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} placeholder="15-digit GSTIN (Optional)" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white font-mono uppercase" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> State Code (GST)</label>
          <input list="gst-states" required placeholder="Type or Select State..." value={form.state_code} onChange={e => setForm({...form, state_code: e.target.value})} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white" />
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
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Registered Address</label>
          <textarea required value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={3} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white resize-none" />
        </div>
        
        <div className="space-y-2 md:col-span-2 border-t border-zinc-800/50 pt-6 mt-2">
          <h3 className="text-lg font-bold text-white mb-4">Payment & Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Landmark className="w-3.5 h-3.5" /> Bank Details (RTGS/NEFT)</label>
              <textarea value={form.bank_details} onChange={e => setForm({...form, bank_details: e.target.value})} rows={4} placeholder="Bank Name:&#10;A/C No:&#10;IFSC:&#10;Branch:" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white resize-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Settings2 className="w-3.5 h-3.5" /> UPI ID / VPA</label>
              <input value={form.upi_id} onChange={e => setForm({...form, upi_id: e.target.value})} placeholder="e.g. merchant@upi" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 text-white font-mono" />
              <p className="text-xs text-zinc-500 mt-2">Entering a valid UPI ID will automatically generate a dynamic, scannable QR Code on all generated bills.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="pt-6 border-t border-zinc-800/50 flex justify-end">
        <button type="submit" disabled={saving} className="px-6 py-3 bg-white text-black rounded-xl font-bold flex items-center gap-2 shadow-elevated hover:bg-zinc-200">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>
    </form>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => { load() }, []);

  const load = async () => {
    setLoading(true);
    setCategories(await invoke("get_categories"));
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await invoke("add_category", { name, description: desc });
    setName(""); setDesc("");
    load();
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Are you sure?")) return;
    await invoke("delete_category", { id });
    load();
  };

  if (loading) return <div className="flex py-12 justify-center"><RefreshCw className="w-6 h-6 animate-spin text-zinc-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <form onSubmit={handleAdd} className="flex gap-4">
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Category Name (e.g. Mobiles)" className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/20 text-white outline-none" />
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (Optional)" className="flex-2 w-1/2 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/20 text-white outline-none" />
        <button type="submit" className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center shadow-elevated hover:bg-zinc-200 shrink-0">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      <div className="border border-zinc-800/50 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/30 text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800/50">
            <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Description</th><th className="px-6 py-4 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-zinc-900/30">
                <td className="px-6 py-4 font-bold">{c.name}</td>
                <td className="px-6 py-4 text-zinc-400">{c.description || "-"}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-red-400/50"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No categories found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaxesTab() {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");

  useEffect(() => { load() }, []);

  const load = async () => {
    setLoading(true);
    setTaxes(await invoke("get_taxes"));
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || isNaN(Number(rate))) return;
    await invoke("add_tax", { name, ratePercent: Number(rate) });
    setName(""); setRate("");
    load();
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Are you sure?")) return;
    await invoke("delete_tax", { id });
    load();
  };

  if (loading) return <div className="flex py-12 justify-center"><RefreshCw className="w-6 h-6 animate-spin text-zinc-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <form onSubmit={handleAdd} className="flex gap-4">
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Tax Profile (e.g. GST 18%)" className="w-1/2 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/20 text-white outline-none" />
        <div className="relative flex-1">
          <input required type="number" step="0.5" value={rate} onChange={e => setRate(e.target.value)} placeholder="Rate" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-white/20 text-white outline-none font-mono" />
          <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        </div>
        <button type="submit" className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center shadow-elevated hover:bg-zinc-200 shrink-0">
          <Plus className="w-4 h-4" /> Add Tax
        </button>
      </form>

      <div className="border border-zinc-800/50 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/30 text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800/50">
            <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Total Rate</th><th className="px-6 py-4 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {taxes.map(t => (
              <tr key={t.id} className="hover:bg-zinc-900/30">
                <td className="px-6 py-4 font-bold">{t.name}</td>
                <td className="px-6 py-4 text-zinc-400 font-mono">{t.rate_percent.toFixed(2)}%</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-red-400/50"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {taxes.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No custom taxes found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
