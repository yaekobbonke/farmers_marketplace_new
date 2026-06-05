"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShoppingBag, 
  Heart, 
  TrendingUp, 
  Package, 
  MapPin, 
  Star,
  Clock,
  ShoppingCart,
  User,
  LogOut,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  DollarSign,
  Sparkles
} from "lucide-react";
import api from "@/lib/api";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  location: string;
  is_verified: boolean;
  farmer: {
    id: number;
    first_name: string;
    last_name: string;
    location: string;
  };
  category?: {
    name: string;
  };
  createdAt: string;
}

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  role: string;
}

export default function BuyerDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [stats, setStats] = useState({
    ordersCount: 0,
    wishlistCount: 0,
    savedAmount: 0
  });
  
  // Use ref to prevent multiple API calls
  const hasFetched = useRef(false);

  // Get user from localStorage only once
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.replace("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (userData.role?.toUpperCase() !== "BUYER") {
        if (userData.role?.toUpperCase() === "ADMIN") {
          router.replace("/admin/dashboard");
        } else if (userData.role?.toUpperCase() === "FARMER") {
          router.replace("/farmer/dashboard");
        } else {
          router.replace("/login");
        }
        return;
      }
      setUser(userData);
    } catch (error) {
      router.replace("/login");
    }
  }, [router]);

  // Fetch data only once
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use mock data for now (since backend endpoint is 404)
        const mockProducts = getMockProducts();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProducts(mockProducts);
        setRecommendations(mockProducts.slice(0, 6));
        
        setStats({
          ordersCount: 3,
          wishlistCount: 5,
          savedAmount: 1250
        });
        
        setRecentOrders([
          { id: "ORD-001", date: "2024-05-01", total: 450, status: "Delivered", items: 2 },
          { id: "ORD-002", date: "2024-04-28", total: 320, status: "Shipped", items: 1 },
          { id: "ORD-003", date: "2024-04-25", total: 680, status: "Delivered", items: 3 },
        ]);
        
        // Try real API if needed (commented out until backend is ready)
        // await fetchRealProducts();
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const fetchRealProducts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/product/marketplace`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const allProducts = data.data || [];
        if (allProducts.length > 0) {
          setProducts(allProducts);
          setRecommendations(allProducts.slice(0, 6));
        }
      }
    } catch (error) {
      console.error("Real API failed, using mock data:", error);
    }
  };

  const getMockProducts = (): Product[] => {
    return [
      {
        id: 1,
        name: "Fresh Tomatoes",
        price: 50,
        quantity: 100,
        unit: "kg",
        location: "Addis Ababa",
        is_verified: true,
        farmer: {
          id: 1,
          first_name: "Alemu",
          last_name: "Bekele",
          location: "Addis Ababa"
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Organic Potatoes",
        price: 35,
        quantity: 200,
        unit: "kg",
        location: "Oromia",
        is_verified: true,
        farmer: {
          id: 2,
          first_name: "Tigist",
          last_name: "Desta",
          location: "Oromia"
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: "Fresh Onions",
        price: 40,
        quantity: 150,
        unit: "kg",
        location: "Amhara",
        is_verified: true,
        farmer: {
          id: 3,
          first_name: "Bekele",
          last_name: "Tesfaye",
          location: "Amhara"
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        name: "Green Peppers",
        price: 60,
        quantity: 80,
        unit: "kg",
        location: "Addis Ababa",
        is_verified: true,
        farmer: {
          id: 4,
          first_name: "Meron",
          last_name: "Assefa",
          location: "Addis Ababa"
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        name: "Fresh Cabbage",
        price: 25,
        quantity: 120,
        unit: "piece",
        location: "Oromia",
        is_verified: true,
        farmer: {
          id: 5,
          first_name: "Dawit",
          last_name: "Mekonnen",
          location: "Oromia"
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 6,
        name: "Carrots",
        price: 45,
        quantity: 90,
        unit: "kg",
        location: "Amhara",
        is_verified: true,
        farmer: {
          id: 6,
          first_name: "Selam",
          last_name: "Hailu",
          location: "Amhara"
        },
        createdAt: new Date().toISOString()
      }
    ];
  };

  const formatETB = (val: number) => 
    new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB',
        maximumFractionDigits: 0 
    }).format(val);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.farmer.first_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const categories = ["All", "Vegetables", "Fruits", "Grains", "Livestock", "Dairy", "Poultry"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-medium">Loading your marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Buyer Portal</h1>
                <p className="text-xs text-slate-500">Fresh from farm to table</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/cart"
                className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart size={22} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-slate-500">Buyer</p>
                </div>
                <div className="relative group">
                  <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <button className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        Profile Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black">Welcome back, {user?.first_name}! 🌾</h2>
              <p className="text-blue-100 mt-1">Discover fresh produce directly from local farmers</p>
            </div>
            <Link 
              href="/marketplace"
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
            >
              Start Shopping <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Orders</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stats.ordersCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingBag size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Wishlist Items</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stats.wishlistCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Heart size={24} className="text-red-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Saved Amount</p>
                <p className="text-3xl font-black text-green-600 mt-1">{formatETB(stats.savedAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search products or farmers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat === "All" ? "" : cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-blue-500" />
              <h3 className="text-xl font-black text-slate-900">Available Products</h3>
            </div>
            <p className="text-sm text-slate-500">{filteredProducts.length} products found</p>
          </div>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/marketplace/${product.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100"
                >
                  <div className="p-5">
                    <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Package size={48} className="text-blue-400" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg line-clamp-1">{product.name}</h4>
                    <div className="flex items-center gap-1 mt-2">
                      <MapPin size={14} className="text-slate-400" />
                      <p className="text-xs text-slate-500">{product.farmer.location}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">by {product.farmer.first_name} {product.farmer.last_name}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{formatETB(product.price)}</p>
                        <p className="text-xs text-slate-400">per {product.unit}</p>
                      </div>
                      <button className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                        Buy Now
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <Package size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No products found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-slate-500" />
            <h3 className="text-xl font-black text-slate-900">Recent Orders</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Order ID</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Items</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{order.id}</td>
                      <td className="p-4 text-slate-600">{new Date(order.date).toLocaleDateString()}</td>
                      <td className="p-4 text-slate-600">{order.items} items</td>
                      <td className="p-4 font-semibold text-slate-800">{formatETB(order.total)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          order.status === "Delivered" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-blue-600 text-sm font-medium hover:underline">
                          Track Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Marketplace Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-black">Fresh from Farm</h3>
            <p className="text-green-100 text-sm mt-1">Get the best quality produce directly from farmers</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 mt-4 text-sm font-bold hover:text-green-200 transition-colors">
              Explore Marketplace →
            </Link>
          </div>
          
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-black">Seasonal Offers</h3>
            <p className="text-orange-100 text-sm mt-1">Special discounts on seasonal harvests</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 mt-4 text-sm font-bold hover:text-orange-200 transition-colors">
              View Offers →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}