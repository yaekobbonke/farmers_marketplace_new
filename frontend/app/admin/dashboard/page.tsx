// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, Package, TrendingUp, ShoppingCart, Loader2 } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingProducts: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/admin/stats");
        setStats(response.data.data);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's an overview of your marketplace.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users size={24} />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Package size={24} />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingCart size={24} />}
          color="bg-purple-500"
        />
        <StatCard
          title="Revenue"
          value={`${stats.totalRevenue.toLocaleString()} ETB`}
          icon={<TrendingUp size={24} />}
          color="bg-yellow-500"
        />
      </div>

      {/* Pending Products Alert */}
      {stats.pendingProducts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Package className="text-yellow-600" size={24} />
            <div>
              <h3 className="font-bold text-yellow-800">Pending Approvals</h3>
              <p className="text-yellow-700 text-sm">
                {stats.pendingProducts} product{stats.pendingProducts !== 1 ? 's are' : ' is'} waiting for verification.
                <a href="/admin/products" className="ml-2 underline font-medium">Review now →</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} bg-opacity-10 rounded-xl`}>
          {icon}
        </div>
        <span className="text-2xl font-black text-slate-900">{value}</span>
      </div>
      <h3 className="font-semibold text-slate-600 text-sm">{title}</h3>
    </div>
  );
}