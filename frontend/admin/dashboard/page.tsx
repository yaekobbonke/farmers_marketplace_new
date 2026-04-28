"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Users, 
  Package, 
  BadgeCheck, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  Loader2 
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ userCount: 0, productCount: 0, revenue: 0 });
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [statsRes, productsRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/pending-products")
        ]);
        setStats(statsRes.data.data);
        setPendingProducts(productsRes.data.data);
      } catch (err) {
        console.error("Admin Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  const handleVerify = async (id: number) => {
    try {
      await api.patch(`/admin/verify/${id}`);
      // Remove verified product from the local list
      setPendingProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Verification failed. Check console.");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Console</h1>
        <p className="text-slate-500 font-medium">Manage the AgriSmart ecosystem and verify new harvests.</p>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Users" value={stats.userCount} icon={<Users size={24}/>} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Live Listings" value={stats.productCount} icon={<Package size={24}/>} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Total Revenue" value={`${stats.revenue} ETB`} icon={<TrendingUp size={24}/>} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Main Grid: Pending Approvals */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={20}/></div>
            <h2 className="text-xl font-bold text-slate-800">Verification Queue</h2>
          </div>
          <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">
            {pendingProducts.length} Pending
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {pendingProducts.length > 0 ? (
            pendingProducts.map((product: any) => (
              <div key={product.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{product.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Users size={14}/> {product.farmer?.name || "Unknown Farmer"}</span>
                    <span className="flex items-center gap-1"><BadgeCheck size={14}/> {product.category || "General"}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleVerify(product.id)}
                  className="mt-4 md:mt-0 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-100 active:scale-95"
                >
                  <CheckCircle2 size={18} />
                  Verify Harvest
                </button>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-slate-400">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">All clear! No pending products to verify.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
      <div className={`p-4 ${bg} ${color} rounded-2xl`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-2xl font-black text-slate-900`}>{value}</p>
      </div>
    </div>
  );
}