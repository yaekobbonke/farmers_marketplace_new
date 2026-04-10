"use client";

import  { useState, useEffect, useCallback, useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { 
  Search, 
  RefreshCw, 
  TrendingUp,
  Target,
  BarChart2
} from "lucide-react";

export default function MarketplacePage() {
  const [products, setProducts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      //const response = await fetch("http://localhost:5000/api/product");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_BASE}/api/product`)
      
      const result = await response.json();
      const rawData = result.data || result.products || (Array.isArray(result) ? result : []);
      
      setProducts(rawData.map((item: any) => ({
        ...item,
        _id: String(item.id),
      })));
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setTimeout(() => setLoading(false)  , 800);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /**
   * CROP INTELLIGENCE LOGIC
   * 1. Normalizes "maize" vs "Maize" using .toLowerCase()
   * 2. Calculates averages in ETB
   */
  const cropIntelligence = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};

    products.forEach((p) => {
      // Normalize: remove extra spaces and ignore casing (Maize/maize)
      const rawName = p.category || p.name.split(' ').pop() || "Unknown";
      const category = rawName.trim().toLowerCase(); 
      
      const price = parseFloat(p.price);

      if (!isNaN(price)) {
        if (!stats[category]) {
          stats[category] = { total: 0, count: 0 };
        }
        stats[category].total += price;
        stats[category].count += 1;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize for UI
      average: (data.total / data.count).toFixed(2),
      count: data.count
    })).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [products]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest mb-1">
              <BarChart2 size={14} /> National Market Index
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Market Intelligence</h1>
            <p className="text-slate-500 font-medium text-sm">Real-time local produce benchmarks in ETB.</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search market..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-green-100 transition-all text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchProducts} 
              className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : "text-slate-600"} />
            </button>
          </div>
        </div>

        {/* INTELLIGENCE BENCHMARKS (ETB) */}
        {!loading && cropIntelligence.length > 0 && (
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden border border-slate-800">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-green-500 p-1.5 rounded-lg">
                   <Target className="text-slate-900" size={18} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-green-500">Regional Average Prices</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {cropIntelligence.map((crop) => (
                  <div key={crop.name} className="group cursor-default">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-green-400 transition-colors">
                      {crop.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-4xl font-black">{crop.average}</p>
                      <span className="text-sm font-bold text-slate-500">ETB</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-2/3" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                        {crop.count} Listings
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[120px] rounded-full" />
            <TrendingUp size={140} className="absolute -right-6 -bottom-6 text-white/5 -rotate-12" />
          </div>
        )}

        {/* LOADING & GRID */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Analyzing Data in ETB...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}