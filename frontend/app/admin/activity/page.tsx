"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Loader2,
  UserPlus,
  PackagePlus,
  ShoppingBag,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface Activity {
  id: number;
  type: "user" | "product" | "order";
  action: string;
  user: string;
  time: string;
  status?: string;
  timestamp?: string;
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "user" | "product" | "order">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (filter === "all") {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(a => a.type === filter));
    }
  }, [filter, activities]);

  const fetchActivities = async () => {
    try {
      setError(null);
      const response = await api.get("/admin/recent-activity");
      setActivities(response.data.data);
      setFilteredActivities(response.data.data);
    } catch (error: any) {
      console.error("Error fetching activities:", error);
      setError(error.response?.data?.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case "user":
        return <UserPlus size={16} className="text-blue-500" />;
      case "product":
        return status === "pending" ? <Clock size={16} className="text-yellow-500" /> : <PackagePlus size={16} className="text-green-500" />;
      case "order":
        return status === "completed" ? <CheckCircle size={16} className="text-green-500" /> : <ShoppingBag size={16} className="text-purple-500" />;
      default:
        return <Eye size={16} className="text-slate-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
      verified: { color: "bg-green-100 text-green-700", label: "Verified" },
      completed: { color: "bg-green-100 text-green-700", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Activity Log</h1>
          <p className="text-slate-500 mt-1">Track all platform activities and user actions</p>
        </div>
        <button
          onClick={fetchActivities}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-100">
        {[
          { value: "all", label: "All Activities", icon: Eye },
          { value: "user", label: "Users", icon: Users },
          { value: "product", label: "Products", icon: Package },
          { value: "order", label: "Orders", icon: ShoppingCart }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
              filter === tab.value
                ? "text-green-600 border-b-2 border-green-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchActivities}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Activities List */}
      {!error && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Eye size={48} className="mx-auto mb-3 opacity-30" />
              <p>No activities found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type, activity.status)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900">{activity.action}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{activity.user}</p>
                      <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                    </div>
                    
                    {/* Detail Link */}
                    <Link
                      href={`/admin/${activity.type}s/${activity.id}`}
                      className="text-slate-400 hover:text-green-600 transition-colors"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}