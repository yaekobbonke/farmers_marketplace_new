"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  TrendingUp, 
  Eye, 
  Package, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  Calendar,
  Download,
  Loader2,
  BarChart3,
  LineChart,
  PieChart,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  totalProducts: number;
  totalViews: number;
  avgPrice: number;
  trend: string;
  products: any[];
  salesData?: any[];
  dailyViews?: any[];
}

export default function FarmerAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [productAnalytics, setProductAnalytics] = useState<any[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<any>(null);
  const [viewsAnalytics, setViewsAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [overviewRes, productRes, salesRes, viewsRes] = await Promise.all([
        api.get("/analytics/farmer/overview"),
        api.get(`/analytics/farmer/products?period=${period}`),
        api.get(`/analytics/farmer/sales?period=${period}`),
        api.get("/analytics/farmer/views")
      ]);
      
      setAnalytics(overviewRes.data.data);
      setProductAnalytics(productRes.data.data);
      setSalesAnalytics(salesRes.data.data);
      setViewsAnalytics(viewsRes.data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatETB = (val: number) => 
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(val);

  const formatNumber = (val: number) => 
    new Intl.NumberFormat('en-US').format(val);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/farmer/dashboard"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-500 mt-1">Track your farm's performance and insights</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                period === p
                  ? "bg-green-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p === "week" ? "Last 7 Days" : p === "month" ? "Last 30 Days" : "Last Year"}
            </button>
          ))}
          <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
            <Download size={16} /> Export Report
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Products"
            value={analytics?.totalProducts || 0}
            icon={<Package size={24} />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Total Views"
            value={formatNumber(analytics?.totalViews || 0)}
            icon={<Eye size={24} />}
            color="bg-green-500"
          />
          <MetricCard
            title="Average Price"
            value={formatETB(analytics?.avgPrice || 0)}
            icon={<DollarSign size={24} />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Growth Trend"
            value={analytics?.trend || "0%"}
            icon={analytics?.trend?.includes("+") ? <ArrowUp size={24} /> : <ArrowDown size={24} />}
            color="bg-orange-500"
            trend={analytics?.trend}
          />
        </div>

        {/* Views Chart */}
        {viewsAnalytics && (
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Daily Views</h2>
            <div className="h-64 flex items-end gap-2">
              {viewsAnalytics.dailyViews?.slice(-14).map((day: any, index: number) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-green-500 rounded-t-lg transition-all hover:bg-green-600"
                    style={{ height: `${(day.views / Math.max(...viewsAnalytics.dailyViews.map((d: any) => d.views))) * 200}px` }}
                  />
                  <span className="text-xs text-slate-500 rotate-45">
                    {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs font-bold text-slate-700">{day.views}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Product */}
        {viewsAnalytics?.topProduct && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-2">🏆 Top Performing Product</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{viewsAnalytics.topProduct.name}</p>
                <p className="text-slate-600">{formatNumber(viewsAnalytics.topProduct.views)} total views</p>
              </div>
              <Link 
                href={`/marketplace/${viewsAnalytics.topProduct.id}`}
                className="px-4 py-2 bg-white text-green-600 rounded-xl font-medium hover:bg-green-50 transition-colors"
              >
                View Product →
              </Link>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Product Performance</h2>
            <p className="text-slate-500 mt-1">Detailed analytics for each product</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Product</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Price</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Views</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Trend</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {productAnalytics.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{product.name}</td>
                    <td className="p-4 text-slate-600">{formatETB(product.currentPrice)}</td>
                    <td className="p-4">
                      <span className="font-medium text-slate-900">{formatNumber(product.views)}</span>
                    </td>
                    <td className="p-4">
                      {product.trend === "up" ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <ArrowUp size={14} /> Trending Up
                        </span>
                      ) : product.trend === "down" ? (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <ArrowDown size={14} /> Trending Down
                        </span>
                      ) : (
                        <span className="text-slate-500">Stable</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Link 
                        href={`/farmer/products/${product.id}/edit`}
                        className="text-sm text-green-600 hover:underline"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Analytics */}
        {salesAnalytics && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Sales Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatETB(salesAnalytics.totalRevenue)}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">{salesAnalytics.totalOrders}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">Average Order Value</p>
                <p className="text-2xl font-bold text-slate-900">{formatETB(salesAnalytics.averageOrderValue)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, trend }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} bg-opacity-10 rounded-xl`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.includes("+") ? "text-green-600" : "text-red-600"}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}