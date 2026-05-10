"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, Package, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

export default function AdminDashboardContent() {
  const [stats, setStats] = useState({ userCount: 0, productCount: 0, revenue: 0 });
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, productsRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/pending-products")
        ]);
        setStats(statsRes.data.data);
        setPendingProducts(productsRes.data.data);
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Console</h1>
        <p className="text-slate-500 font-medium">Manage the AgriSmart ecosystem</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Users" value={stats.userCount} icon={<Users size={24}/>} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Total Products" value={stats.productCount} icon={<Package size={24}/>} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Revenue" value={`${stats.revenue} ETB`} icon={<TrendingUp size={24}/>} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Pending Verifications</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {pendingProducts.map((product: any) => (
            <div key={product.id} className="p-6">
              <h3 className="font-bold">{product.name}</h3>
              <p className="text-sm text-slate-500">{product.price} ETB</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 ${bg} ${color} rounded-2xl`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase">{title}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}