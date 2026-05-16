// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Users, 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  Loader2,
  Clock,
  AlertCircle,
  TrendingDown,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  Calendar,
  Activity,
  BarChart3
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingProducts: number;
  activeProducts: number;
  completedOrders: number;
  pendingOrders: number;
  monthlyRevenue: number;
  revenueChange: number;
  userGrowth: number;
  orderGrowth: number;
  productGrowth: number;
}

interface RecentActivity {
  id: number;
  type: "user" | "product" | "order";
  action: string;
  user: string;
  time: string;
  status?: string;
}

// Define types for components
type CardColor = 'blue' | 'green' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  href?: string;
  trend?: number;
}

interface SimpleStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  alert?: boolean;
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: CardColor;
  badge?: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingProducts: 0,
    activeProducts: 0,
    completedOrders: 0,
    pendingOrders: 0,
    monthlyRevenue: 0,
    revenueChange: 0,
    userGrowth: 0,
    orderGrowth: 0,
    productGrowth: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await api.get("/admin/stats");
      setStats(response.data.data);
      
      // Fetch recent activity (you'll need to add this endpoint)
      try {
        const activityResponse = await api.get("/admin/recent-activity");
        setRecentActivity(activityResponse.data.data);
      } catch (err) {
        // Mock data if endpoint doesn't exist
        setRecentActivity([
          { id: 1, type: "user", action: "New user registered", user: "John Doe", time: "5 minutes ago" },
          { id: 2, type: "product", action: "New product listed", user: "Sarah Smith", time: "1 hour ago", status: "pending" },
          { id: 3, type: "order", action: "Order completed", user: "Mike Johnson", time: "2 hours ago", status: "completed" },
        ]);
      }
    } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      setError(error.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's an overview of your marketplace.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Refresh
          </button>
          <Link 
            href="/admin/reports"
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            Generate Report
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change={stats.userGrowth}
          icon={<Users size={24} />}
          color="bg-blue-500"
          href="/admin/users"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          change={stats.productGrowth}
          icon={<Package size={24} />}
          color="bg-green-500"
          href="/admin/products"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          change={stats.orderGrowth}
          icon={<ShoppingCart size={24} />}
          color="bg-purple-500"
          href="/admin/orders"
        />
        <StatCard
          title="Total Revenue"
          value={`${stats.totalRevenue.toLocaleString()} ETB`}
          icon={<TrendingUp size={24} />}
          color="bg-yellow-500"
          trend={stats.revenueChange}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SimpleStatCard
          title="Active Products"
          value={stats.activeProducts}
          icon={<CheckCircle size={20} />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <SimpleStatCard
          title="Pending Products"
          value={stats.pendingProducts}
          icon={<Clock size={20} />}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
          alert={stats.pendingProducts > 0}
        />
        <SimpleStatCard
          title="Completed Orders"
          value={stats.completedOrders}
          icon={<CheckCircle size={20} />}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <SimpleStatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={<Clock size={20} />}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Revenue Overview</h3>
              <p className="text-sm text-slate-500 mt-1">Monthly revenue trend</p>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-green-600" />
              <span className="text-2xl font-black text-slate-900">
                {stats.monthlyRevenue.toLocaleString()} ETB
              </span>
            </div>
          </div>
          
          {/* Simple bar chart visualization */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 w-16">This Month</span>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  style={{ width: `${Math.min((stats.monthlyRevenue / (stats.totalRevenue || 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {stats.monthlyRevenue.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 w-16">Total</span>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {stats.totalRevenue.toLocaleString()} ETB
              </span>
            </div>
          </div>
          
          {stats.revenueChange !== 0 && (
            <div className={`mt-4 flex items-center gap-2 text-sm ${stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueChange > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{Math.abs(stats.revenueChange)}% from last month</span>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Recent Activity</h3>
              <p className="text-sm text-slate-500 mt-1">Latest platform updates</p>
            </div>
            <Activity size={20} className="text-slate-400" />
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {activity.type === 'user' && <Users size={14} className="text-blue-500" />}
                  {activity.type === 'product' && <Package size={14} className="text-green-500" />}
                  {activity.type === 'order' && <ShoppingCart size={14} className="text-purple-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                  <p className="text-xs text-slate-500">{activity.user}</p>
                  {activity.status && (
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {activity.status}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{activity.time}</span>
              </div>
            ))}
          </div>
          
          <Link 
            href="/admin/activity"
            className="mt-4 block text-center text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View All Activity →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Manage Users"
          description="View and manage all platform users"
          icon={<Users size={24} />}
          href="/admin/users"
          color="blue"
        />
        <QuickActionCard
          title="Review Products"
          description="Approve pending product listings"
          icon={<Package size={24} />}
          href="/admin/products"
          color="green"
          badge={stats.pendingProducts}
        />
        <QuickActionCard
          title="View Reports"
          description="Generate sales and analytics reports"
          icon={<BarChart3 size={24} />}
          href="/admin/reports"
          color="purple"
        />
      </div>

      {/* Pending Products Alert */}
      {stats.pendingProducts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Package className="text-yellow-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-yellow-800">Pending Approvals</h3>
              <p className="text-yellow-700 text-sm">
                {stats.pendingProducts} product{stats.pendingProducts !== 1 ? 's are' : ' is'} waiting for verification.
              </p>
            </div>
            <Link 
              href="/admin/products?filter=pending"
              className="px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Review Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Stat Card with growth indicator
function StatCard({ title, value, change, icon, color, href, trend }: StatCardProps) {
  const CardContent = () => (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} bg-opacity-10 rounded-xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <span className="text-2xl font-black text-slate-900">{value}</span>
      </div>
      <h3 className="font-semibold text-slate-600 text-sm">{title}</h3>
      {(change !== undefined || trend !== undefined) && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${(change || trend || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {(change || trend || 0) > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(change || trend || 0)}% from last month</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <CardContent />
      </Link>
    );
  }
  return <CardContent />;
}

// Simple Stat Card without growth
function SimpleStatCard({ title, value, icon, color, bgColor, alert }: SimpleStatCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 shadow-sm ${alert ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <div className={color}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

// Quick Action Card with proper typing
function QuickActionCard({ title, description, icon, href, color, badge = 0 }: QuickActionCardProps) {
  const colorClasses: Record<CardColor, string> = {
    blue: "hover:border-blue-200 group-hover:bg-blue-50",
    green: "hover:border-green-200 group-hover:bg-green-50",
    purple: "hover:border-purple-200 group-hover:bg-purple-50"
  };
  
  return (
    <Link href={href}>
      <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all group ${colorClasses[color]}`}>
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          {badge > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
              {badge} pending
            </span>
          )}
        </div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
    </Link>
  );
}