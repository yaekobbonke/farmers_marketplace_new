"use client";
import React from "react"; 
import api from "@/lib/api"; 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {  
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  Package, 
  AlertCircle,
  ChevronRight,
  Loader2
} from "lucide-react";
import { AxiosError } from "axios";
import MarketTable from "@/components/MarketTable";
import PricePrediction from "@/components/PricePrediction";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  is_verified: boolean;
  updatedAt: string;
}

export default function FarmerDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingApproval: 0,
    revenue: 0,
    lowStockCount: 0
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(`${user.first_name} ${user.last_name}`);
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/product/farmer");
        
        const data: Product[] = response.data.data || [];
        
        const totalValue = data.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        const lowStock = data.filter(p => p.quantity < 10).length;
        const pendingApproval = data.filter(p => !p.is_verified).length;

        setProducts(data);
        setStats({
          totalProducts: data.length,
          pendingApproval: pendingApproval,
          revenue: totalValue,
          lowStockCount: lowStock
        });
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        console.error("Dashboard Stats Error:", error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
          router.replace("/login");
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
            <p className="text-slate-500">Welcome back, {userName || "Farmer"}</p>
          </div>
          
          <div className="flex gap-3">
            {/* Price Prediction Button */}
            <button 
              onClick={() => {
                // This will open a modal or scroll to prediction section
                document.getElementById('price-prediction')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
            >
              <TrendingUp size={20} /> GET PRICE PREDICTION
            </button>
            
            {/* Add Product Button */}
            <button 
              onClick={() => router.push("/farmer/products/add")}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
            >
              <Plus size={20} /> LIST NEW PRODUCE
            </button>
          </div>
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
            title="Pending Approval" 
            value={stats.pendingApproval} 
            icon={<AlertCircle className={stats.pendingApproval > 0 ? "text-yellow-600" : "text-green-600"} />} 
            color={stats.pendingApproval > 0 ? "bg-yellow-50" : "bg-green-50"} 
          />
          <StatCard 
            title="Inventory Value" 
            value={formatETB(stats.revenue)} 
            icon={<TrendingUp className="text-green-600" />} 
            color="bg-green-50" 
            trend="Live" 
          />
          <StatCard 
            title="Low Stock" 
            value={stats.lowStockCount} 
            icon={<AlertCircle className={stats.lowStockCount > 0 ? "text-red-600" : "text-slate-400"} />} 
            color={stats.lowStockCount > 0 ? "bg-red-50" : "bg-slate-50"} 
          />
        </div>

        {/* PRODUCTS LIST */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-900">Your Products</h3>
            <button 
              onClick={() => router.push("/marketplace")}
              className="text-sm font-bold text-green-600 flex items-center gap-1 hover:underline"
            >
              View Marketplace <ChevronRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={32} />
              <p className="font-black uppercase tracking-tighter">Loading your products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                      <span className="font-black text-xs text-slate-400 uppercase">{product.unit}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{product.name}</p>
                      <p className="text-xs font-medium text-slate-500">
                        Stock: {product.quantity} {product.unit} | {formatETB(product.price)}
                      </p>
                      {!product.is_verified && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="text-slate-300 group-hover:text-green-600 transition-colors" size={20} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <Package size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-400 font-bold mb-2">No products yet</p>
              <button 
                onClick={() => router.push("/farmer/products/add")}
                className="text-green-600 text-sm font-medium hover:underline"
              >
                List your first product →
              </button>
            </div>
          )}
        </div>

        {/* PRICE PREDICTION SECTION */}
        <div id="price-prediction" className="scroll-mt-20">
          <div className="mb-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Price Predictor</h3>
            <p className="text-slate-500 text-sm">Get real-time price forecasts for commodities</p>
          </div>
          <PricePrediction />
        </div>

        {/* MARKET INTELLIGENCE */}
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Market Intelligence</h3>
          <MarketTable />
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