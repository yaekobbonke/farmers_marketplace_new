"use client";

import api from "@/lib/api"; // Now using the authenticated instance
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBasket, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  Package, 
  AlertCircle,
  ChevronRight,
  Loader2
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  updatedAt: string;
}

export default function FarmerDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0, 
    revenue: 0,
    lowStockCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const response = await api.get("/product");
        
        // Handle different possible response structures
        const data: Product[] = response.data.data || (Array.isArray(response.data) ? response.data : []);

        const totalValue = data.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        const lowStock = data.filter(p => p.quantity < 10).length;

        setProducts(data);
        setStats({
          totalProducts: data.length,
          activeOrders: 5, 
          revenue: totalValue,
          lowStockCount: lowStock
        });
      } catch (err: any) {
        console.error("Dashboard Stats Error:", err);
        
        // Optional: Redirect to login if token is invalid/expired
        if (err.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const formatETB = (val: number) => 
    new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB',
        maximumFractionDigits: 0 
    }).format(val);

  return (
    <div className="min-h-screen bg-[#fbfcfd] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Farmer Console</h1>
            <p className="text-slate-500 font-medium italic">Connected to Live PostgreSQL Database</p>
          </div>
          
          <button 
            onClick={() => router.push("/products/add")}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
          >
            <Plus size={20} /> LIST NEW PRODUCE
          </button>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Active Listings" 
            value={stats.totalProducts} 
            icon={<Package className="text-blue-600" />} 
            color="bg-blue-50" 
          />
          <StatCard 
            title="Low Stock Items" 
            value={stats.lowStockCount} 
            icon={<AlertCircle className={stats.lowStockCount > 0 ? "text-red-600" : "text-slate-400"} />} 
            color={stats.lowStockCount > 0 ? "bg-red-50" : "bg-slate-50"} 
          />
          <StatCard 
            title="Inventory Value" 
            value={formatETB(stats.revenue)} 
            icon={<TrendingUp className="text-green-600" />} 
            color="bg-green-50" 
            trend="Live" 
          />
          <StatCard 
            title="Market Status" 
            value="Open" 
            icon={<LayoutDashboard className="text-purple-600" />} 
            color="bg-purple-50" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* DYNAMIC INVENTORY LIST */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Your Recent Listings</h3>
              <button 
                onClick={() => router.push("/marketplace")}
                className="text-sm font-bold text-green-600 flex items-center gap-1 hover:underline"
              >
                Go to Marketplace <ChevronRight size={16} />
              </button>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="animate-spin" size={32} />
                <p className="font-black uppercase tracking-tighter">Syncing Harvests...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-4">
                {products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                        <span className="font-black text-xs text-slate-400 uppercase">{product.unit}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{product.name}</p>
                        <p className="text-xs font-medium text-slate-500">
                          Stock: {product.quantity} | {formatETB(product.price)}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="text-slate-300 group-hover:text-green-600 transition-colors" size={20} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-slate-400 font-bold">No products found in database.</p>
              </div>
            )}
          </div>

          {/* AI INSIGHTS */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-green-400" size={18} />
                  <span className="text-xs font-black uppercase tracking-widest text-green-400">Regional Forecast</span>
                </div>
                <h4 className="text-2xl font-black mb-2">Price Optimization</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Based on your {stats.totalProducts} listings, AI suggests increasing Teff prices by 4% to match current market trends.
                </p>
                <button className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm transition-all">
                  Apply Suggestions
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-600/10 rounded-full blur-3xl" />
            </div>

            {stats.lowStockCount > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex gap-4 animate-pulse">
                <AlertCircle className="text-red-600 shrink-0" size={24} />
                <div>
                  <p className="font-black text-red-900 text-sm uppercase">Critical Stock</p>
                  <p className="text-red-700 text-xs font-medium mt-1">
                    {stats.lowStockCount} items are almost sold out. Update soon.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className={`p-3 ${color} rounded-2xl`}>{icon}</div>
        {trend && (
          <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}