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

interface SmartSearchProps {
  onSearch?: (results: Product[], query: string) => void;
  onSearching?: (isSearching: boolean) => void;
}

export default function SmartSearch({ onSearch, onSearching }: SmartSearchProps) {
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
      setTrending(response.data.data || []);
    } catch (error) {
      console.error("Error fetching trending:", error);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setShowResults(false);
      if (onSearch) onSearch([], "");
      return;
    }
    
    setLoading(true);
    setShowResults(true);
    if (onSearching) onSearching(true);
    
    try {
      // Use the search endpoint with type parameter
      const response = await api.get(`/search/${searchType}?q=${encodeURIComponent(query)}&limit=50`);
      const searchResults = response.data.data || [];
      setResults(searchResults);
      
      // Pass results to parent component
      if (onSearch) {
        onSearch(searchResults, query);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      if (onSearch) onSearch([], query);
    } finally {
      setLoading(false);
      if (onSearching) onSearching(false);
    }
  }, [query, searchType, onSearch, onSearching]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    if (onSearch) onSearch([], "");
  };

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(price);
  };

  // Get search type label and color
  const getSearchTypeLabel = () => {
    switch (searchType) {
      case "semantic":
        return { label: "AI Semantic", color: "bg-purple-600" };
      case "keyword":
        return { label: "Keyword", color: "bg-blue-600" };
      case "hybrid":
        return { label: "Hybrid", color: "bg-green-600" };
      default:
        return { label: "Search", color: "bg-green-600" };
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => query && setShowResults(true)}
            placeholder="Search for teff, coffee, organic vegetables..."
            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/70 border border-white/30 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Search Type Selector - DROPDOWN FOR SEMANTIC/KEYWORD/HYBRID */}
        <div className="relative">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as any)}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer appearance-none pr-8"
          >
            <option value="semantic" className="text-slate-900">🤖 AI Semantic</option>
            <option value="keyword" className="text-slate-900">🔍 Keyword</option>
            <option value="hybrid" className="text-slate-900">🔄 Hybrid</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <Sparkles size={14} className="text-white/70" />
          </div>
        </div>
        
        <button
          onClick={handleSearch}
          disabled={loading}
          className={`px-6 py-2 ${getSearchTypeLabel().color} text-white rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50`}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Results Dropdown */}
      {showResults && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 p-3 border-b bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">
                {searchType === "semantic" ? "AI Semantic Search" : searchType === "hybrid" ? "Hybrid Search" : "Keyword Search"} Results
              </span>
              {searchType === "semantic" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                  AI Powered
                </span>
              )}
            </div>
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
        <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-orange-400" />
            <h3 className="font-bold text-white">Trending Products</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {trending.map((product) => (
              <Link
                key={product.id}
                href={`/marketplace/${product.id}`}
                className="min-w-[160px] p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <p className="font-medium text-white truncate">{product.name}</p>
                <p className="text-sm font-bold text-green-400">{formatETB(product.price)}</p>
                <p className="text-xs text-white/70 truncate">{product.location}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}