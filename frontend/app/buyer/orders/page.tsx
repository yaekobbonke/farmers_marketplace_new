"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  Eye, 
  Loader2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import api from "@/lib/api";

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    unit: string;
  };
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderItems: OrderItem[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/orders/my-orders?page=${pagination.page}&limit=${pagination.limit}`);
      const result = response.data?.data;
      const ordersData = result?.orders || [];
      setOrders(ordersData);
      setPagination({
        page: result?.pagination?.page || 1,
        limit: result?.pagination?.limit || 10,
        total: result?.pagination?.total || 0,
        totalPages: result?.pagination?.totalPages || 0
      });
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        setError("Failed to load orders. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatETB = (val: number) => 
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-700';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-700';
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'REFUNDED':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/buyer/dashboard" 
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-slate-900">My Orders</h1>
            <p className="text-slate-500 mt-1">View and track all your orders</p>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <Package size={24} className="text-white" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-red-700 flex-1">{error}</p>
            <button onClick={fetchOrders} className="text-red-600 hover:text-red-800 text-sm font-medium">
              Try Again
            </button>
          </div>
        )}

        {/* Orders Table */}
        {orders.length > 0 ? (
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
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-medium text-slate-800">#{order.id}</span>
                      </td>
                      <td className="p-4 text-slate-600">{formatDate(order.createdAt)}</td>
                      <td className="p-4 text-slate-600">{order.orderItems?.length || 0} items</td>
                      <td className="p-4 font-semibold text-slate-800">{formatETB(order.totalAmount)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/order/${order.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
                        >
                          <Eye size={14} />
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-sm text-slate-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium text-slate-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={40} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Orders Yet</h3>
            <p className="text-slate-500 mb-6">You haven't placed any orders yet.</p>
            <Link 
              href="/marketplace" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}