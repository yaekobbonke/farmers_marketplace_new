"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, TrendingUp, Sparkles, X } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  location: string;
  description?: string;
  farmer: {
    first_name: string;
    last_name: string;
    location: string;
  };
  category?: {
    name: string;
  };
}

export default function SmartSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState<"semantic" | "keyword" | "hybrid">("semantic");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTrending = async () => {
    try {
      const response = await api.get("/search/trending?limit=5");
      setTrending(response.data.data);
    } catch (error) {
      console.error("Error fetching trending:", error);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setShowResults(false);
      return;
    }
    
    setLoading(true);
    setShowResults(true);
    
    try {
      const response = await api.get(`/search/${searchType}?q=${encodeURIComponent(query)}&limit=12`);
      setResults(response.data.data || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, searchType]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(price);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => query && setShowResults(true)}
            placeholder="Search for teff, coffee, organic vegetables..."
            className="w-full pl-12 pr-4 py-4 bg-slate-700 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
          />
        </div>
        
        {/* Search Type Selector */}
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as any)}
          className="px-4 py-2 bg-slate-600 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="semantic">AI Semantic</option>
          <option value="keyword">Keyword</option>
          <option value="hybrid">Hybrid</option>
        </select>
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Results Dropdown */}
      {showResults && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 p-3 border-b bg-slate-50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">
              {searchType === "semantic" ? "AI Semantic Search" : searchType === "hybrid" ? "Hybrid Search" : "Keyword Search"} Results
            </span>
            <button onClick={() => setShowResults(false)} className="p-1 hover:bg-slate-200 rounded-lg">
              <X size={14} />
            </button>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="animate-spin text-green-600 mx-auto" size={32} />
              <p className="text-slate-400 mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/marketplace/${product.id}`}
                  onClick={() => setShowResults(false)}
                  className="block p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800">{product.name}</h4>
                      <p className="text-sm text-slate-500">
                        {product.farmer.first_name} {product.farmer.last_name} • {product.location}
                      </p>
                      {product.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{product.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-green-600">{formatETB(product.price)}</p>
                      <p className="text-xs text-slate-400">per {product.unit}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords or browse categories</p>
            </div>
          )}
        </div>
      )}

      {/* Trending Section */}
      {!showResults && trending.length > 0 && (
        <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-orange-500" />
            <h3 className="font-bold text-slate-800">Trending Now</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {trending.map((product) => (
              <Link
                key={product.id}
                href={`/marketplace/${product.id}`}
                className="min-w-[160px] p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <p className="font-medium text-slate-800 truncate">{product.name}</p>
              <p className="text-sm font-bold text-green-600">{formatETB(product.price)}</p>
                <p className="text-xs text-slate-500 truncate">{product.location}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}