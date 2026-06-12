"use client";

import React from "react"; 
import api from "@/lib/api"; 
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {  
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  Package, 
  AlertCircle,
  ChevronRight,
  Loader2,
  Bell,
  CheckCircle,
  Clock,
  Store,
  Eye,
  Sparkles,
  DollarSign,
  ShoppingBag,
  Award,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search,
  X,
  Star,
  Truck,
  Leaf,
  Shield,
  Zap,
  Target,
  Globe,
  Users,
  Heart,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  TrendingDown,
  LogOut,
  ListOrdered
} from "lucide-react";
import { AxiosError } from "axios";
import MarketTable from "@/components/MarketTable";
import PricePrediction from "@/components/PricePrediction";
import Link from "next/link";

// Session configuration - CHANGED from 1 to 5 minutes
const SESSION_TIMEOUT_MINUTES = 5;
const CHECK_INTERVAL_MS = 1000;

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  is_verified: boolean;
  updatedAt: string;
  createdAt: string;
  category?: { id: number; name: string };
  views?: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalProducts: number;
  pendingApproval: number;
  approvedCount: number;
  inventoryValue: number;
  lowStockCount: number;
  totalViews: number;
  totalOrders: number;
  averageRating: number;
  conversionRate: number;
}

export default function FarmerDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all");
  const [showProductMenu, setShowProductMenu] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const insightsFetched = useRef(false);
  
  // Session management states
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT_MINUTES * 60);
  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottledUpdateRef = useRef<number>(Date.now());
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    pendingApproval: 0,
    approvedCount: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    totalViews: 0,
    totalOrders: 0,
    averageRating: 0,
    conversionRate: 0
  });

  // Helper function to get user's full name
  const getUserFullName = () => {
    if (!user) return "Farmer";
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.name) {
      return user.name;
    }
    if (user.fullName) {
      return user.fullName;
    }
    if (user.user?.first_name) {
      return `${user.user.first_name} ${user.user.last_name || ''}`;
    }
    
    return "Farmer";
  };

  // Helper function to get first name for welcome message
  const getFirstName = () => {
    const fullName = getUserFullName();
    return fullName.split(' ')[0];
  };

  // Update last activity with throttling
  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    
    if (now - lastThrottledUpdateRef.current > 2000) {
      setTimeLeft(SESSION_TIMEOUT_MINUTES * 60);
      lastThrottledUpdateRef.current = now;
    }
  }, []);

  // Logout function - redirects to login
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionStart");
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    router.push("/login");
  }, [router]);

  // Show session expired modal and then redirect
  const showExpiredAndRedirect = useCallback(() => {
    setShowSessionExpired(true);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionStart");
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }, [router]);

  // Check session status
  const checkSession = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const remainingSeconds = Math.max(0, SESSION_TIMEOUT_MINUTES * 60 - Math.floor(timeSinceLastActivity / 1000));
    setTimeLeft(remainingSeconds);
    if (timeSinceLastActivity >= SESSION_TIMEOUT_MINUTES * 60 * 1000) {
      showExpiredAndRedirect();
    }
  }, [showExpiredAndRedirect]);

  // Track user activity
  useEffect(() => {
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove', 'keypress'];
    const handleUserActivity = () => updateLastActivity();
    activities.forEach(activity => window.addEventListener(activity, handleUserActivity));
    return () => activities.forEach(activity => window.removeEventListener(activity, handleUserActivity));
  }, [updateLastActivity]);

  // Session timer
  useEffect(() => {
    updateLastActivity();
    sessionTimerRef.current = setInterval(checkSession, CHECK_INTERVAL_MS);
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [checkSession, updateLastActivity]);

  // Apply filters function
  const applyFilters = useCallback((data: Product[], search: string, filter: string) => {
    let filtered = [...data];
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter === "verified") {
      filtered = filtered.filter(p => p.is_verified === true);
    } else if (filter === "pending") {
      filtered = filtered.filter(p => p.is_verified === false);
    }
    setFilteredProducts(filtered);
  }, []);

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    if (insightsFetched.current) return;
    if (products.length === 0) return;
    try {
      setLoadingInsights(true);
      insightsFetched.current = true;
      const response = await api.get("/assistant/insights");
      setInsights(response.data.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
      setInsights({
        hasData: products.length > 0,
        message: products.length > 0 
          ? `Your ${products[0]?.name || "products"} are getting attention.`
          : "Start adding products to get AI-powered insights.",
        recommendation: "Optimize your listings for better visibility.",
        actionLink: products.length > 0 ? `/farmer/analytics` : "/farmer/products/add",
        actionText: "View Analytics"
      });
    } finally {
      setLoadingInsights(false);
    }
  }, [products.length]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await api.get("/notifications");
      const data = response.data.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/products/farmer/products");
      const data: Product[] = response.data.data || [];
      
      const totalValue = data.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const lowStock = data.filter(p => p.quantity < 10).length;
      const pendingApproval = data.filter(p => !p.is_verified).length;
      const approvedCount = data.filter(p => p.is_verified).length;
      const totalOrdersCalculated = data.reduce((acc, p) => acc + (p.views || 0), 0);
      const conversionRateCalculated = data.length > 0 ? ((approvedCount / data.length) * 100) : 0;

      setProducts(data);
      applyFilters(data, searchQuery, statusFilter);
      
      setStats({
        totalProducts: data.length,
        pendingApproval: pendingApproval,
        approvedCount: approvedCount,
        inventoryValue: totalValue,
        lowStockCount: lowStock,
        totalViews: data.reduce((acc, p) => acc + (p.views || 0), 0),
        totalOrders: totalOrdersCalculated,
        averageRating: 4.8,
        conversionRate: conversionRateCalculated
      });
      
      await fetchNotifications();
      insightsFetched.current = false;
      updateLastActivity();
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Dashboard Stats Error:", error.response?.data?.message || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        showExpiredAndRedirect();
      }
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications, applyFilters, searchQuery, statusFilter, updateLastActivity, showExpiredAndRedirect]);

  const handleRefresh = async () => {
    setRefreshing(true);
    insightsFetched.current = false;
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 1000);
    updateLastActivity();
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeletingProduct(productId);
    try {
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert("Product deleted successfully");
      updateLastActivity();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    } finally {
      setDeletingProduct(null);
      setShowProductMenu(null);
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const duplicatedProduct = {
        name: `${product.name} (Copy)`,
        price: product.price,
        quantity: product.quantity,
        unit: product.unit,
        description: `Copy of ${product.name}`,
        ...(product.category?.id ? { categoryId: product.category.id } : {})
      };
      await api.post("/products", duplicatedProduct);
      await fetchDashboardData();
      alert("Product duplicated successfully");
      updateLastActivity();
    } catch (error) {
      console.error("Error duplicating product:", error);
      alert("Failed to duplicate product");
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      updateLastActivity();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      updateLastActivity();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Effect for applying filters when search/filter changes
  useEffect(() => {
    applyFilters(products, searchQuery, statusFilter);
  }, [searchQuery, statusFilter, products, applyFilters]);

  // Effect for fetching insights after products load
  useEffect(() => {
    if (products.length > 0 && !insightsFetched.current && !loading) {
      fetchInsights();
    }
  }, [products.length, loading, fetchInsights]);

  // Get user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      router.push("/login");
      return;
    }
    
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/login");
      }
    }
    
    fetchDashboardData();
    
    const interval = setInterval(fetchNotifications, 30000);
    const welcomeTimer = setTimeout(() => setShowWelcome(false), 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(welcomeTimer);
    };
  }, [fetchDashboardData, fetchNotifications, router]);

  const formatETB = (val: number) => 
    new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB',
        maximumFractionDigits: 0 
    }).format(val);

  const formatNumber = (val: number) => 
    new Intl.NumberFormat('en-US').format(val);

  const approvedProducts = products.filter(p => p.is_verified);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Session Expired Modal */}
      {showSessionExpired && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Session Expired</h3>
              <p className="text-slate-600 mb-2">
                Your session has expired due to {SESSION_TIMEOUT_MINUTES} minute{SESSION_TIMEOUT_MINUTES !== 1 ? 's' : ''} of inactivity.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Please log in again to continue.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    router.push("/login");
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Redirecting automatically in a few seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      {showWelcome && user && !showSessionExpired && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-4 shadow-2xl max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Leaf size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Welcome back, {getFirstName()}! 👋</p>
                <p className="text-xs text-white/80">Your farm is thriving</p>
              </div>
              <button onClick={() => setShowWelcome(false)} className="text-white/70 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        
        {/* TOP HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Leaf className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Farmer Console</h1>
                <p className="text-slate-500">Welcome back, {getUserFullName()}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Session timer - REMOVED "Session expires in:" text, just showing counting time */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm font-mono font-bold">
              <Clock size={16} className="text-slate-400" />
              <span className={`${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            {/* Manage Orders Button */}
            <Link
              href="/farmer/orders"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <ListOrdered size={18} />
              Manage Orders
            </Link>
            
            <button 
              onClick={() => document.getElementById('price-prediction')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Sparkles size={18} /> AI Prediction
            </button>
            
            <button 
              onClick={() => router.push("/farmer/products/add")}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Plus size={20} /> List Product
            </button>

            {/* LOGOUT BUTTON REMOVED - now only in dropdown menu */}
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard 
            title="Active Listings" 
            value={stats.totalProducts} 
            icon={<Package size={20} />} 
            color="bg-blue-50 text-blue-600"
            subtitle={`${stats.approvedCount} approved`}
          />
          <StatCard 
            title="Pending Approval" 
            value={stats.pendingApproval} 
            icon={<Clock size={20} />} 
            color={stats.pendingApproval > 0 ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"}
            subtitle={stats.pendingApproval > 0 ? "Awaiting review" : "All approved"}
          />
          <StatCard 
            title="Inventory Value" 
            value={formatETB(stats.inventoryValue)} 
            icon={<DollarSign size={20} />} 
            color="bg-emerald-50 text-emerald-600"
            subtitle="Total market value"
          />
          <StatCard 
            title="Total Orders" 
            value={stats.totalOrders} 
            icon={<ShoppingBag size={20} />} 
            color="bg-purple-50 text-purple-600"
            subtitle={`${stats.conversionRate.toFixed(1)}% conversion`}
          />
          <StatCard 
            title="Low Stock Alert" 
            value={stats.lowStockCount} 
            icon={<AlertCircle size={20} />} 
            color={stats.lowStockCount > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}
            subtitle={stats.lowStockCount > 0 ? "Needs attention" : "Stock healthy"}
          />
        </div>

        {/* AI INSIGHTS CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {loadingInsights ? "Loading..." : "AI Insight"}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Recommendation</h3>
              <p className="text-white/80 text-sm mb-4">
                {loadingInsights 
                  ? "Analyzing your farm data..." 
                  : (insights?.message || products.length > 0 
                    ? `Your ${products[0]?.name || "products"} are getting attention. Consider optimizing your listings for better visibility.`
                    : "Start adding products to get AI-powered insights.")}
              </p>
              {insights?.recommendation && (
                <p className="text-white/70 text-xs mb-4 italic">
                  💡 {insights.recommendation}
                </p>
              )}
              <Link
                href="/farmer/analytics"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/30 transition-all"
              >
                <BarChart3 size={16} /> View Analytics →
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Target size={16} className="text-green-600" />
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">Total Views</span>
                <span className="font-bold text-slate-900">{formatNumber(stats.totalViews)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">Avg. Rating</span>
                <span className="font-bold text-slate-900">{stats.averageRating.toFixed(1)} ★</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-500">Approval Rate</span>
                <span className="font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTS LIST */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your Products</h3>
                <p className="text-sm text-slate-500 mt-0.5">Manage and monitor your product listings</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none w-48 md:w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
                >
                  <option value="all">All Products</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  <Download size={16} />
                  Export
                </button>
                <Link 
                  href="/marketplace"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all"
                >
                  <Store size={16} /> Marketplace
                </Link>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={32} />
              <p className="font-medium">Loading your products...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-5 hover:bg-slate-50 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package size={22} className="text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-800">{product.name}</p>
                          {product.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              <CheckCircle size={10} /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                              <Clock size={10} /> Pending Approval
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          Stock: {product.quantity} {product.unit} | {formatETB(product.price)} per {product.unit}
                        </p>
                        {product.category && (
                          <p className="text-xs text-slate-400 mt-1">
                            Category: {product.category.name}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          Listed: {new Date(product.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.is_verified && (
                        <Link
                          href={`/marketplace/${product.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Eye size={15} /> View
                        </Link>
                      )}
                      <div className="relative">
                        <button
                          onClick={() => setShowProductMenu(showProductMenu === product.id ? null : product.id)}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {showProductMenu === product.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-10 overflow-hidden">
                            <button
                              onClick={() => handleDuplicateProduct(product)}
                              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
                            >
                              <Copy size={14} /> Duplicate
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingProduct === product.id}
                              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              {deletingProduct === product.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Delete
                            </button>
                            {/* Logout button in dropdown menu */}
                            <button
                              onClick={logout}
                              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 border-t border-slate-100 hover:bg-red-50 transition-colors"
                            >
                              <LogOut size={14} /> Logout
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Package size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-400 font-medium mb-3">
                {statusFilter === "pending" 
                  ? "No pending products found" 
                  : statusFilter === "verified"
                  ? "No verified products found"
                  : "No products found"}
              </p>
              <button 
                onClick={() => router.push("/farmer/products/add")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all"
              >
                <Plus size={18} /> List Your First Product
              </button>
            </div>
          )}
        </div>

        {/* Approved Products Summary */}
        {approvedProducts.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Products Live on Marketplace</h3>
                  <p className="text-sm text-slate-600">
                    {approvedProducts.length} approved product{approvedProducts.length !== 1 ? 's' : ''} visible to buyers
                  </p>
                </div>
              </div>
              <Link
                href="/marketplace"
                className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-xl font-medium hover:bg-green-50 transition-all text-sm shadow-sm"
              >
                <Store size={16} /> Go to Marketplace <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* PRICE PREDICTION SECTION */}
        <div id="price-prediction" className="scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">AI Price Predictor</h3>
              <p className="text-sm text-slate-500">Get real-time price forecasts for your commodities</p>
            </div>
            <button className="text-sm text-green-600 font-medium hover:underline">
              View History →
            </button>
          </div>
          <PricePrediction />
        </div>

        {/* MARKET INTELLIGENCE */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Market Intelligence</h3>
              <p className="text-sm text-slate-500">Real-time market trends and price data</p>
            </div>
            <div className="flex gap-3">
              <button className="text-sm text-slate-500 hover:text-green-600 font-medium">
                Last 7 Days
              </button>
              <button className="text-sm text-slate-500 hover:text-green-600 font-medium">
                Last 30 Days
              </button>
              <Link href="/marketplace" className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>
          </div>
          <MarketTable />
        </div>

        {/* Notification Bell Dropdown */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end p-4" onClick={() => setShowNotifications(false)}>
            <div className="mt-16 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-green-600 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notification.read ? "bg-green-50/30" : ""
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0">
                          {notification.type === "success" ? (
                            <CheckCircle size={14} className="text-green-500" />
                          ) : notification.type === "warning" ? (
                            <AlertCircle size={14} className="text-yellow-500" />
                          ) : (
                            <Bell size={14} className="text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Stat Card Component
function StatCard({ title, value, icon, color, subtitle }: any) {
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
