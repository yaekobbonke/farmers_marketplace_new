"use client";

import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

// Define interface for trend points to satisfy TypeScript build
interface TrendPoint {
  day: string;
  farmer: number;
  market: number;
  predicted: number;
}

const PriceDashboard = ({ productId }: { productId: number }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const response = await fetch(`/api/v1/prices/${productId}/predict`);
        const json = await response.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to fetch trends", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPriceData();
  }, [productId]);

  if (loading) return <div className="p-10 text-center">Loading Market Insights...</div>;

  // Mocking a trend array for the chart based on the AI result
  const trendData: TrendPoint[] = [
    { day: 'Mon', farmer: 22, market: 24, predicted: 23 },
    { day: 'Tue', farmer: 21, market: 25, predicted: 24 },
    { day: 'Wed', farmer: 23, market: 26, predicted: 25 },
    { 
        day: 'Today', 
        farmer: Number(data?.current || 0), 
        market: Number(data?.market_average || 0), 
        predicted: Number(data?.predicted || 0) 
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500 font-medium">Your Listing Price</p>
          <h3 className="text-2xl font-bold text-gray-800">{data?.current} ETB</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 font-medium">Scraped Market Avg</p>
          <h3 className="text-2xl font-bold text-gray-800">{data?.market_average} ETB</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500 font-medium">AI 7-Day Forecast</p>
            <TrendingUp size={16} className="text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{data?.predicted} ETB</h3>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-8 rounded-2xl shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Price Convergence Trend</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} unit=" ETB" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend iconType="circle" verticalAlign="top" height={36}/>
              
              <Line 
                type="monotone" 
                dataKey="farmer" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 6 }} 
                name="My Price" 
              />
              <Line 
                type="monotone" 
                dataKey="market" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 6 }} 
                name="Market Avg" 
              />
              {/* FIXED: Changed type from "dashed" to "monotone" and used strokeDasharray */}
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#a855f7" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                name="AI Forecast" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intelligence Note */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 items-start">
        <AlertCircle className="text-amber-600 shrink-0" />
        <div>
          <h4 className="font-semibold text-amber-900">Market Insight</h4>
          <p className="text-sm text-amber-800">
            Your price is currently {Number(data?.market_average) - Number(data?.current) > 0 ? 'below' : 'above'} the regional market average. 
            The XGBoost model suggests a price correction toward {data?.predicted} ETB within the next week.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceDashboard;