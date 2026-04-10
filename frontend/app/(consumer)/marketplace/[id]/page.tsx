"use client";

import { useState, useEffect } from "react";
import { 
  User, Phone, MapPin, ArrowLeft, Sprout, 
  Scale, ShieldCheck, TrendingUp, 
  BarChart3, Loader2 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";


// Define the Interface for better Type Safety
interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  location?: string;
  category?: { name: string };
  farmer?: {
    first_name: string;
    phone: string;
    address?: string;
  };
  pricePredictions?: Array<{
    predictedPrice: number;
    createdAt: string;
  }>;
}

export default function ProductDetailsPage() {
  const { id } = useParams(); 
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        //const response = await fetch(`http://localhost:5000/api/product/${id}`);
        const API_BASE = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_BASE}/api/product/${id}`);
        
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const result = await response.json();
        // Extract data based on your specific backend response wrapper
        setProduct(result.data || result);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD] gap-4">
        <Loader2 className="animate-spin text-green-600" size={40} />
        <div className="text-center font-black text-slate-300 uppercase tracking-widest">
          Analyzing Market Data...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-20 text-center">
        <div className="font-black text-red-400 uppercase tracking-widest mb-4">Product Not Found</div>
        <Link href="/marketplace" className="text-sm font-bold underline">Return to Market</Link>
      </div>
    );
  }

  // --- REAL DATA MAPPING ---
  const farmerName = product.farmer?.first_name || "Verified Farmer";
  const farmerPhone = product.farmer?.phone || "Contact via App";
  const farmerLocation = product.location || product.farmer?.address || "Regional Ethiopia";
  const unit = product.unit || "qtl";
  const categoryName = product.category?.name || "Produce";
  const aiForecast = product.pricePredictions?.[0]?.predictedPrice || 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <div className="max-w-6xl mx-auto p-6">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm uppercase tracking-tight">
          <ArrowLeft size={16} strokeWidth={3} /> Back to Marketplace
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-[0.2em]">
              <Sprout size={14} strokeWidth={3} /> Verified Database Record
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter capitalize">
              {product.name}
            </h1>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-tight">
                Type: {categoryName}
              </span>
              <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-tight border border-blue-100 flex items-center gap-2">
                <MapPin size={14} /> {farmerLocation}
              </span>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Listing Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">ETB</span>
                <span className="text-6xl font-black text-slate-900">{product.price?.toLocaleString()}</span>
                <span className="text-lg font-bold text-slate-400">/ {unit}</span>
              </div>
            </div>
            <div className="h-16 w-[2px] bg-slate-50 hidden md:block" />
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Availability</p>
              <div className="flex items-center gap-3 text-slate-900 font-black text-2xl">
                <Scale className="text-slate-300" />
                In Stock ({unit})
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          {aiForecast > 0 && (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2 text-green-400 font-black text-[10px] uppercase tracking-widest">
                  <BarChart3 size={16} /> XGBoost Intelligence
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-slate-400 text-xs font-bold mb-2">Next Week Price Forecast:</p>
                    <div className="flex items-center gap-3 text-4xl font-black">
                      <TrendingUp className="text-green-400" size={32} strokeWidth={3} />
                      ETB {aiForecast.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Analysis</p>
                    <p className="text-sm font-medium leading-relaxed">
                      The current listing is <span className="text-green-400 font-bold">competitive</span> compared to the forecasted regional trend.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Farmer Information Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl sticky top-8">
            <div className="text-center space-y-4 mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto text-green-600 shadow-inner">
                <User size={40} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{farmerName}</h2>
              <div className="flex items-center justify-center gap-1 text-blue-600 font-black text-[10px] uppercase tracking-tighter">
                <ShieldCheck size={14} /> Registered Vendor
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={10} /> Verified Number
                </p>
                <p className="text-lg font-black text-slate-900">{farmerPhone}</p>
              </div>
            </div>

            <div className="mt-8">
              <a 
                href={`tel:${farmerPhone}`} 
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-center block uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-green-100"
              >
                Call Farmer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}