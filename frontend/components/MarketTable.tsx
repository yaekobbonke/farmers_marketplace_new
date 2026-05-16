"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api"; 

interface MarketPrice {
  id: number;
  productName: string;
  price: number;
  location: string;
  recordedAt: string;
}

export default function MarketTable() {
  const [data, setData] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Helper function to safely format dates
  const formatDate = (dateString: string): string => {
    if (!dateString) return "Date not available";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return "Date not available";
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Date not available";
    }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get("/prices/latest");
      
      // ✅ Debug: Log the actual response
      console.log("API Response:", response.data);
      
      let prices = [];
      
      // Handle different response structures
      if (response.data?.data && Array.isArray(response.data.data)) {
        prices = response.data.data;
      } else if (Array.isArray(response.data)) {
        prices = response.data;
      } else if (response.data?.prices && Array.isArray(response.data.prices)) {
        prices = response.data.prices;
      }
      
      // ✅ Transform data to match the expected format
      const transformedPrices = prices.map((item: any) => ({
        id: item.id,
        // Handle nested product name (most likely)
        productName: item.product?.name || item.product_name || item.name || "Unknown Product",
        price: item.price || 0,
        location: item.location || item.market || "Unknown",
        // Handle date field
        recordedAt: item.recordedAt || item.recorded_at || item.createdAt || item.date
      }));
      
      console.log("Transformed prices:", transformedPrices);
      setData(transformedPrices);
      
    } catch (err: any) {
      console.error("Error fetching prices:", err);
      setError(err.message || "Failed to fetch market prices");
      
      // Fallback mock data for development
      setData([
        { id: 1, productName: "Teff", price: 45, location: "Addis Ababa", recordedAt: new Date().toISOString() },
        { id: 2, productName: "Wheat", price: 35, location: "Oromia", recordedAt: new Date().toISOString() },
        { id: 3, productName: "Barley", price: 30, location: "Amhara", recordedAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && data.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
        <p className="mt-2 text-slate-500">Loading market prices...</p>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Unable to load market data</p>
        <button 
          onClick={fetchPrices}
          className="mt-2 text-green-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Product</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Price (ETB)</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Location</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-slate-400">
                No market data available
               </td>
             </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{item.productName}</td>
                <td className="px-4 py-3">{item.price.toLocaleString()}</td>
                <td className="px-4 py-3">{item.location}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(item.recordedAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}