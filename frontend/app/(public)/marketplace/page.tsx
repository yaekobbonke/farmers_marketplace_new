"use client";

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SmartSearch from "@/components/SmartSearch";
import { 
  Package, Grid3x3, List, MapPin, Loader2, AlertCircle, X,
  Store, TrendingUp, DollarSign, Shield, Truck, RefreshCw, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { AxiosError } from "axios";

// Local structural helper interface for the page components
interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  location: string;
  quantity?: number;
  is_verified?: boolean;
  views?: number;
  farmer: { 
    first_name: string; 
    last_name: string; 
    location: string;
    email?: string;
  };
  category?: { id: number; name: string };
}

interface MarketplaceStats {
  totalProducts: number;
  averagePrice: number;
  totalFarmers: number;
  verifiedProducts: number;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<MarketplaceStats>({
    totalProducts: 0,
    averagePrice: 0,
    totalFarmers: 0,
    verifiedProducts: 0
  });

  // Fetch marketplace data 
  const fetchMarketplaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login");
        router.push("/auth/login?redirect=/marketplace");
        return;
      }
      
      const response = await api.get("/products");
      
      let productsData = null;
      if (response.data?.success && response.data?.data) {
        productsData = response.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }
      
      if (productsData && Array.isArray(productsData)) {
        const verifiedProducts = productsData.filter((p: any) => p.is_verified === true);
        
        // Map data defensively to enforce structural typing integrity
        const normalizedProducts: Product[] = verifiedProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          unit: p.unit,
          location: p.location || "",
          quantity: p.quantity,
          is_verified: p.is_verified,
          views: p.views,
          farmer: {
            first_name: p.farmer?.first_name || "",
            last_name: p.farmer?.last_name || "",
            location: p.farmer?.location || "",
            email: p.farmer?.email
          },
          category: p.category ? {
            id: Number(p.category.id) || 0,
            name: p.category.name || ""
          } : undefined
        }));

        setProducts(normalizedProducts);
        
        const uniqueFarmers = new Set(normalizedProducts.map((p: Product) => p.farmer?.email || p.farmer?.first_name));
        const avgPrice = normalizedProducts.length > 0 
          ? normalizedProducts.reduce((acc: number, curr: Product) => acc + curr.price, 0) / normalizedProducts.length 
          : 0;
        
        setStats({
          totalProducts: normalizedProducts.length,
          averagePrice: avgPrice,
          totalFarmers: uniqueFarmers.size,
          verifiedProducts: normalizedProducts.length
        });
      } else {
        setProducts([]);
      }
      
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Error fetching products:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("Authentication error, redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login?redirect=/marketplace");
        return;
      }
      
      setError(error.response?.data?.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMarketplaceData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // FIX: Parameterized as "any[]" to dodge the isolated modules type collisions
  const handleSearchResults = (results: any[], query: string) => {
    setSearchQuery(query);
    if (query && results.length >= 0) {
      const verifiedResults = results
        .filter(p => p.is_verified !== false)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          unit: p.unit,
          location: p.location || "",
          quantity: p.quantity,
          is_verified: p.is_verified,
          views: p.views,
          farmer: {
            first_name: p.farmer?.first_name || "",
            last_name: p.farmer?.last_name || "",
            location: p.farmer?.location || "",
            email: p.farmer?.email
          },
          category: p.category ? {
            id: Number(p.category.id) || 0,
            name: p.category.name || ""
          } : undefined
        }));

      setProducts(verifiedResults);
      if (verifiedResults.length === 0 && query) {
        setError(`No products found for "${query}"`);
      } else {
        setError(null);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    fetchMarketplaceData();
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    
    fetchMarketplaceData();
  }, [fetchMarketplaceData]);

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <Loader2 className="animate-spin text-green-600" size={48} />
        <p className="text-slate-500 mt-4 font-medium">Loading marketplace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Store className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Marketplace</h1>
                <p className="text-slate-500">Fresh from farm to table</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <Loader2 size={18} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            
            {user?.role === "farmer" && (
              <button 
                onClick={() => router.push("/farmer/dashboard")}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                <TrendingUp size={18} /> Farmer Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MarketStatCard 
            title="Available Products" 
            value={stats.totalProducts} 
            icon={<Package size={20} />} 
            color="bg-blue-50 text-blue-600"
            subtitle="Verified listings"
          />
          <MarketStatCard 
            title="Active Farmers" 
            value={stats.totalFarmers} 
            icon={<Truck size={20} />} 
            color="bg-emerald-50 text-emerald-600"
            subtitle="Local suppliers"
          />
          <MarketStatCard 
            title="Average Price" 
            value={formatETB(stats.averagePrice)} 
            icon={<DollarSign size={20} />} 
            color="bg-green-50 text-green-600"
            subtitle="Market average"
          />
          <MarketStatCard 
            title="Verified Products" 
            value={stats.verifiedProducts} 
            icon={<Shield size={20} />} 
            color="bg-purple-50 text-purple-600"
            subtitle="Quality assured"
          />
        </div>

        {/* Hero Section with Search */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 md:p-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Fresh from Farm to Table</h2>
          <p className="text-green-100 mb-6">Discover verified, high-quality agricultural products from local farmers</p>
          
          <div className="max-w-2xl text-slate-800">
            <SmartSearch 
              onSearch={handleSearchResults}
              onSearching={setIsSearching}
            />
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {searchQuery ? `Search Results for "${searchQuery}"` : "All Products"}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {products.length} product{products.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <div className="flex gap-2">
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
                  >
                    <X size={16} />
                    Clear Search
                  </button>
                )}
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-green-100 text-green-600" : "text-slate-400 hover:bg-slate-100"}`}
                >
                  <Grid3x3 size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-green-100 text-green-600" : "text-slate-400 hover:bg-slate-100"}`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>

          {isSearching ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={32} />
              <p className="font-medium">Searching...</p>
            </div>
          ) : error && products.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium mb-3">{error}</p>
              <button 
                onClick={fetchMarketplaceData}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all"
              >
                <RefreshCw size={18} /> Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium">No products available at the moment</p>
              <p className="text-sm text-slate-400 mt-1">Check back later for fresh listings</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-5">
              {products.map((product) => (
                <Link key={product.id} href={`/marketplace/${product.id}`}>
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg transition-all cursor-pointer group">
                    <div className="h-40 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center relative">
                      <Package size={48} className="text-green-500 group-hover:scale-110 transition-transform" />
                      {product.is_verified && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-sm">
                          <CheckCircle2 size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-slate-500 mb-2">{product.farmer.first_name} {product.farmer.last_name}</p>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xl font-bold text-green-600">{formatETB(product.price)}</p>
                        <p className="text-xs text-slate-400">per {product.unit}</p>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={12} /> {product.location || product.farmer.location}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {products.map((product) => (
                <Link key={product.id} href={`/marketplace/${product.id}`}>
                  <div className="p-5 hover:bg-slate-50 transition-colors group cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package size={22} className="text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-800">{product.name}</p>
                            {product.is_verified && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                <CheckCircle2 size={12} /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {product.farmer.first_name} {product.farmer.last_name}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <MapPin size={12} /> {product.location || product.farmer.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{formatETB(product.price)}</p>
                        <p className="text-xs text-slate-400">per {product.unit}</p>
                        {product.quantity && product.quantity < 10 && (
                          <p className="text-xs text-orange-500 mt-1">Low stock</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketStatCard({ title, value, icon, color, subtitle }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs font-medium text-slate-500 mt-0.5">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}