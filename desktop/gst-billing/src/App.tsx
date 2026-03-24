import { useState, useEffect } from "react";
import Activation from "./components/Activation";
import { 
  FileText, LayoutDashboard, Package, Users, 
  Settings, LogOut, Search,
  Truck, ShoppingCart, FileDown, BarChart3
} from "lucide-react";

import DashboardView from "./components/DashboardView";
import SettingsView from "./components/SettingsView";
import ProductsView from "./components/ProductsView";
import CustomersView from "./components/CustomersView";
import InvoicesView from "./components/InvoicesView";
import InvoiceBuilder from "./components/InvoiceBuilder";
import InvoicePreview from "./components/InvoicePreview";
import VendorsView from "./components/VendorsView";
import PurchasesView from "./components/PurchasesView";
import PurchaseBuilder from "./components/PurchaseBuilder";
import PurchasePreview from "./components/PurchasePreview";
import NotificationBell from "./components/NotificationBell";
import ReturnsView from "./components/ReturnsView";
import ReturnBuilder from "./components/ReturnBuilder";
import ReturnPreview from "./components/ReturnPreview";
import ReportsView from "./components/ReportsView";

type ViewState = 'dashboard' | 'invoices' | 'create_invoice' | 'products' | 'customers' | 'settings' | 'customer_details' | 'purchases' | 'vendors' | 'create_purchase' | 'returns' | 'create_return' | 'reports' | 'invoice-builder' | 'purchase-builder' | 'return-builder' | 'preview' | 'purchase-preview' | 'return-preview';

function App() {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [licenseData, setLicenseData] = useState<any>(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<ViewState>("dashboard");
  const [previewInvoiceId, setPreviewInvoiceId] = useState<number | null>(null);
  const [previewPurchaseId, setPreviewPurchaseId] = useState<number | null>(null);
  const [previewReturnId, setPreviewReturnId] = useState<number | null>(null);

  useEffect(() => {
    // Check local storage for license
    const saved = localStorage.getItem('softraxa_license');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setLicenseData(data);
        setIsActivated(true);
      } catch (e) {
        setIsActivated(false);
      }
    } else {
      setIsActivated(false);
    }
  }, []);

  if (isActivated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (!isActivated) {
    return <Activation onActivated={(license) => {
      setLicenseData(license);
      setIsActivated(true);
    }} />;
  }

  const handleOpenPreview = (id: number) => {
    setPreviewInvoiceId(id);
    setActiveTab("preview");
  };

  const handleOpenPurchasePreview = (id: number) => {
    setPreviewPurchaseId(id);
    setActiveTab("purchase-preview");
  };

  const handleOpenReturnPreview = (id: number) => {
    setPreviewReturnId(id);
    setActiveTab("return-preview");
  };

  const handleDashboardAction = (action: string) => {
    if (action.startsWith('preview-')) {
      const parts = action.split('-');
      handleOpenPreview(Number(parts[1]));
    } else {
      setActiveTab(action as ViewState);
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800/50 flex flex-col bg-black/20 backdrop-blur-xl shrink-0 print:hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
              <div className="w-4 h-4 bg-black rounded-sm transform rotate-45" />
            </div>
            <span className="font-bold tracking-tight text-lg">SOFTRAXA</span>
          </div>

          <nav className="space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <NavItem icon={FileText} label="Invoices" active={activeTab === "invoices" || activeTab === "preview" || activeTab === "invoice-builder"} onClick={() => setActiveTab("invoices")} />
            <NavItem icon={ShoppingCart} label="Purchases" active={activeTab === "purchases" || activeTab === "purchase-builder" || activeTab === "purchase-preview"} onClick={() => setActiveTab("purchases")} />
            <NavItem icon={FileDown} label="Sales Returns" active={activeTab === "returns" || activeTab === "return-builder" || activeTab === "return-preview"} onClick={() => setActiveTab("returns")} />
            <NavItem icon={BarChart3} label="Reports" active={activeTab === "reports"} onClick={() => setActiveTab("reports")} />
            <NavItem icon={Package} label="Products" active={activeTab === "products"} onClick={() => setActiveTab("products")} />
            <NavItem icon={Users} label="Customers" active={activeTab === "customers"} onClick={() => setActiveTab("customers")} />
            <NavItem icon={Truck} label="Vendors" active={activeTab === "vendors"} onClick={() => setActiveTab("vendors")} />
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-1">
          <NavItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          <button 
            onClick={() => {
              localStorage.removeItem('softraxa_license');
              setIsActivated(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-all group"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span>Deactivate</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative print:overflow-visible">
        {/* Header */}
        <header className="h-16 relative z-50 border-b border-zinc-800/50 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md shrink-0 print:hidden">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              placeholder="GLOBAL SEARCH (Invoices, Products, Customers)..." 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-white/10 placeholder:uppercase placeholder:tracking-widest"
            />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell onNavigate={handleDashboardAction} />
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium">Softraxa Offline</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  Pro Edition {licenseData?.expires_at && `• Exp: ${new Date(licenseData.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center font-bold text-xs ring-1 ring-zinc-700">
                S
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Router */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.03),rgba(255,255,255,0))] print:p-0 print:bg-none">
          {activeTab === "dashboard" && <DashboardView onAction={handleDashboardAction} />}
          {activeTab === "invoices" && <InvoicesView onBuildInvoice={() => setActiveTab("invoice-builder")} onViewInvoice={handleOpenPreview} />}
          {activeTab === "purchases" && <PurchasesView onBuildPurchase={() => setActiveTab("purchase-builder")} onViewPurchase={handleOpenPurchasePreview} />}
          {activeTab === "returns" && <ReturnsView onBuildReturn={() => setActiveTab("return-builder")} onViewReturn={handleOpenReturnPreview} />}
          {activeTab === "products" && <ProductsView />}
          {activeTab === "customers" && <CustomersView />}
          {activeTab === "vendors" && <VendorsView />}
          {activeTab === "settings" && <SettingsView />}
          {activeTab === "reports" && <ReportsView />}
          {activeTab === "invoice-builder" && <InvoiceBuilder onCancel={() => setActiveTab("invoices")} />}
          {activeTab === "purchase-builder" && <PurchaseBuilder onCancel={() => setActiveTab("purchases")} />}
          {activeTab === "return-builder" && <ReturnBuilder onCancel={() => setActiveTab("returns")} />}
          {activeTab === "preview" && previewInvoiceId && <InvoicePreview invoiceId={previewInvoiceId} onBack={() => setActiveTab("invoices")} />}
          {activeTab === "purchase-preview" && previewPurchaseId && <PurchasePreview purchaseId={previewPurchaseId} onBack={() => setActiveTab("purchases")} />}
          {activeTab === "return-preview" && previewReturnId && <ReturnPreview returnId={previewReturnId} onBack={() => setActiveTab("returns")} />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium transition-all duration-300 ${
      active 
        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
        : "text-zinc-500 hover:text-white hover:bg-white/5"
    }`}>
      <Icon className="w-[18px] h-[18px] shrink-0" />
      <span>{label}</span>
    </button>
  );
}

export default App;
