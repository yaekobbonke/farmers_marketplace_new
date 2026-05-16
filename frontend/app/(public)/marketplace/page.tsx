// app/(public)/marketplace/page.tsx

"use client";

import { useState, useEffect } from "react";
import SmartSearch from "@/components/SmartSearch";
import { Package, Grid3x3, List, MapPin, Loader2, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  location: string;
  farmer: { first_name: string; last_name: string; location: string };
  category?: { name: string };
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
        setProducts(productsData);
      } else {
        setProducts([]);
      }
      
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search results from SmartSearch
  const handleSearchResults = (results: Product[], query: string) => {
    setSearchQuery(query);
    if (query && results.length >= 0) {
      setProducts(results);
      if (results.length === 0 && query) {
        setError(`No products found for "${query}"`);
      } else {
        setError(null);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    fetchProducts();
  };

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-black mb-4">Fresh from Farm to Table</h1>
          <p className="text-green-100 mb-8">Discover verified, high-quality agricultural products from local farmers</p>
          
          {/* Smart Search Component with callbacks */}
          <div className="max-w-3xl">
            <SmartSearch 
              onSearch={handleSearchResults}
              onSearching={setIsSearching}
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {searchQuery ? `Search Results for "${searchQuery}"` : "All Products"}
            </h2>
            {searchQuery && (
              <p className="text-sm text-slate-500 mt-1">
                Found {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            )}
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

        {isSearching ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin text-green-600 mx-auto" size={40} />
            <p className="text-slate-500 mt-4">Searching...</p>
          </div>
        ) : error && products.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle size={64} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No products available at the moment</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/marketplace/${product.id}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 cursor-pointer">
                  <div className="p-5">
                    <div className="w-full h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <Package size={40} className="text-green-400" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-slate-500 mb-2">{product.farmer.first_name} {product.farmer.last_name}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-bold text-green-600">{formatETB(product.price)}</p>
                      <p className="text-xs text-slate-400">per {product.unit}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <MapPin size={12} /> {product.location}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <Link key={product.id} href={`/marketplace/${product.id}`}>
                <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-slate-100 flex flex-wrap md:flex-nowrap gap-4 items-center cursor-pointer">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Package size={32} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">{product.name}</h3>
                    <p className="text-sm text-slate-500">{product.farmer.first_name} {product.farmer.last_name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} /> {product.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{formatETB(product.price)}</p>
                    <p className="text-xs text-slate-400">per {product.unit}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}