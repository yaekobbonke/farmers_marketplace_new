"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api"; // Use your configured api instance

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

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use your api instance instead of direct fetch
      const response = await api.get("/prices/latest");
      
      // Handle different response structures
      const prices = response.data.data || response.data;
      setData(Array.isArray(prices) ? prices : []);
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
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && data.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
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
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{item.productName}</td>
              <td className="px-4 py-3">{item.price.toLocaleString()}</td>
              <td className="px-4 py-3">{item.location}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(item.recordedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}