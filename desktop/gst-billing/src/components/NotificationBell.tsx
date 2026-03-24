import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Bell, Package, AlertTriangle, AlertCircle } from "lucide-react";

export default function NotificationBell({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  // Initial fetch on mount to show the red dot if needed
  useEffect(() => {
    fetchAlerts();
    // Re-fetch every 60 seconds passively when app is running
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const [variationsData, productsData]: any = await Promise.all([
        invoke("get_all_variations"),
        invoke("get_products")
      ]);

      const variations: any[] = variationsData;
      const products: any[] = productsData;

      const lowStock: any[] = [];
      const expiryList: any[] = [];
      
      const today = new Date();
      // Look 30 days ahead for early warnings
      const warningThresholdDate = new Date();
      warningThresholdDate.setDate(today.getDate() + 30);

      variations.forEach(v => {
        // Build product mapping
        const prod = products.find(p => p.id === v.product_id);
        const nameDisplay = `${prod?.name || 'Unknown Product'} - ${v.name !== 'Default' ? v.name : 'Base Unit'}`;

        // 1. Check Low Stock
        if (v.current_stock <= (v.low_stock_alert || 5)) {
          lowStock.push({ ...v, display_name: nameDisplay });
        }

        // 2. Check Expiry Dates (assuming format is YYYY-MM-DD or parseable by JS Date)
        if (v.expiry_date) {
            const expDate = new Date(v.expiry_date);
            if (!isNaN(expDate.getTime())) {
                if (expDate <= today) {
                    // Already Expired
                    expiryList.push({ ...v, display_name: nameDisplay, status: 'EXPIRED', days: 0 });
                } else if (expDate <= warningThresholdDate) {
                    // Expiring soon
                    const diffTime = Math.abs(expDate.getTime() - today.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    expiryList.push({ ...v, display_name: nameDisplay, status: 'SOON', days: diffDays });
                }
            }
        }
      });

      setLowStockAlerts(lowStock);
      setExpiryAlerts(expiryList);

    } catch (e) {
      console.error(e);
    }
  };

  const totalAlerts = lowStockAlerts.length + expiryAlerts.length;

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-zinc-400 hover:text-white transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {totalAlerts > 0 && (
          <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#09090b] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-[#09090b] border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/30">
            <h3 className="font-bold text-white flex items-center gap-2">
                 Notification Center 
                 {totalAlerts > 0 && <span className="text-[10px] bg-red-500/20 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full">{totalAlerts}</span>}
            </h3>
            <button onClick={() => { setIsOpen(false); fetchAlerts(); }} className="text-[10px] uppercase font-bold text-zinc-500 hover:text-white transition-colors tracking-widest">
                Refresh
            </button>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto w-full no-scrollbar">
            {totalAlerts === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500">
                    <Bell className="w-8 h-8 opacity-20 mb-3" />
                    <p className="text-sm font-medium">All systems optimal.</p>
                    <p className="text-xs">No active alerts at this moment.</p>
                </div>
            ) : (
                <div className="divide-y divide-zinc-800/50">
                    {/* Expiry Priority Alerts */}
                    {expiryAlerts.map((alert, i) => (
                        <div key={`exp-${i}`} className={`p-4 hover:bg-zinc-900/40 transition-colors cursor-pointer ${alert.status === 'EXPIRED' ? 'bg-red-500/5' : 'bg-orange-500/5'}`} onClick={() => { setIsOpen(false); onNavigate('products'); }}>
                            <div className="flex gap-3">
                                <div className="mt-0.5">
                                    {alert.status === 'EXPIRED' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <AlertTriangle className="w-5 h-5 text-orange-400" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white mb-0.5 leading-tight">{alert.display_name}</h4>
                                    <p className="text-xs text-zinc-400">Batch <span className="font-mono text-zinc-300">{alert.batch_no || 'Unknown'}</span></p>
                                    <div className="mt-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${alert.status === 'EXPIRED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                            {alert.status === 'EXPIRED' ? 'Expired' : `Expiring in ${alert.days} days`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Low Stock Alerts */}
                    {lowStockAlerts.map((alert, i) => (
                        <div key={`stock-${i}`} className="p-4 hover:bg-zinc-900/40 transition-colors cursor-pointer" onClick={() => { setIsOpen(false); onNavigate('products'); }}>
                            <div className="flex gap-3">
                                <div className="mt-0.5">
                                    <Package className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white mb-0.5 leading-tight">{alert.display_name}</h4>
                                    <p className="text-xs text-zinc-400">Inventory depleted below threshold.</p>
                                    <div className="mt-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest font-mono px-2 py-1 rounded ${alert.current_stock <= 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                            {alert.current_stock} / {alert.low_stock_alert || 5} Units Left
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
