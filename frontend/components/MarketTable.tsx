'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Database, Globe } from 'lucide-react';

interface MarketData {
  commodity: string;
  price: number;
  market: string;
  source: string;
  unit: string;
  recordedAt: string;
}

export default function MarketTable() {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      // Points to your Node.js Controller: GET /api/v1/prices/latest
      const res = await fetch('http://127.0.0.1:5000/api/prices/latest');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch market data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Globe className="w-4 h-4 text-green-600" />
          Live Market Intelligence
        </h2>
        <button 
          onClick={fetchPrices}
          className="text-xs flex items-center gap-1 text-slate-500 hover:text-green-600 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Commodity</th>
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium text-right">Price (ETB)</th>
              <th className="px-4 py-3 font-medium text-center">Source</th>
              <th className="px-4 py-3 font-medium">Freshness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{item.commodity}</td>
                <td className="px-4 py-3 text-slate-600">{item.market}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono font-bold text-green-700">
                    {item.price.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">/{item.unit}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    item.source.includes('scraper') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.source.includes('scraper') ? 'Official ECX' : 'Local Feed'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs italic">
                  {item.recordedAt}
                </td>
              </tr>
            ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No active market signals found. Run the scraper or add products.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}