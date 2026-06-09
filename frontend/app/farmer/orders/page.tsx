"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Package, 
  Loader2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Ban,
  Eye
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

interface FarmerOrder {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  shippingAddress: string;
  notes?: string;
  buyer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  orderItems: OrderItem[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function FarmerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<FarmerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/orders/farmer-orders?page=${pagination.page}&limit=${pagination.limit}&status=${filter}`);
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

  const updateOrderStatus = async (orderId: number, status: string) => {
    setProcessingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await fetchOrders();
      alert(`Order ${orderId} has been ${status.toLowerCase()} successfully!`);
    } catch (err: any) {
      console.error("Error updating order:", err);
      alert(err.response?.data?.error || "Failed to update order status");
    } finally {
      setProcessingId(null);
    }
  };

  const cancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;
    
    setProcessingId(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel`);
      await fetchOrders();
      alert(`Order ${orderId} has been cancelled successfully!`);
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      alert(err.response?.data?.error || "Failed to cancel order");
    } finally {
      setProcessingId(null);
    }
  };

  const formatETB = (val: number) => 
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'SHIPPED': return 'bg-blue-100 text-blue-700';
      case 'PROCESSING': return 'bg-purple-100 text-purple-700';
      case 'CONFIRMED': return 'bg-indigo-100 text-indigo-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusActions = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'PENDING': return ['confirm', 'reject'];
      case 'CONFIRMED': return ['process'];
      case 'PROCESSING': return ['ship'];
      case 'SHIPPED': return ['deliver'];
      default: return [];
    }
  };

  const getActionButton = (orderId: number, status: string) => {
    const actions = getStatusActions(status);
    
    return (
      <div className="flex gap-2">
        {actions.includes('confirm') && (
          <button
            onClick={() => updateOrderStatus(orderId, 'CONFIRMED')}
            disabled={processingId === orderId}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {processingId === orderId ? <Loader2 size={14} className="animate-spin" /> : "Accept"}
          </button>
        )}
        
        {actions.includes('reject') && (
          <button
            onClick={() => updateOrderStatus(orderId, 'CANCELLED')}
            disabled={processingId === orderId}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {processingId === orderId ? <Loader2 size={14} className="animate-spin" /> : "Reject"}
          </button>
        )}
        
        {actions.includes('process') && (
          <button
            onClick={() => updateOrderStatus(orderId, 'PROCESSING')}
            disabled={processingId === orderId}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {processingId === orderId ? <Loader2 size={14} className="animate-spin" /> : "Process"}
          </button>
        )}
        
        {actions.includes('ship') && (
          <button
            onClick={() => updateOrderStatus(orderId, 'SHIPPED')}
            disabled={processingId === orderId}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {processingId === orderId ? <Loader2 size={14} className="animate-spin" /> : "Ship"}
          </button>
        )}
        
        {actions.includes('deliver') && (
          <button
            onClick={() => updateOrderStatus(orderId, 'DELIVERED')}
            disabled={processingId === orderId}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {processingId === orderId ? <Loader2 size={14} className="animate-spin" /> : "Deliver"}
          </button>
        )}
      </div>
    );
  };

  const getCancelButton = (status: string, orderId: number) => {
    const cancellableStatuses = ['CONFIRMED', 'PROCESSING'];
    if (cancellableStatuses.includes(status.toUpperCase())) {
      return (
        <button
          onClick={() => cancelOrder(orderId)}
          disabled={processingId === orderId}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {processingId === orderId ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
          Cancel
        </button>
      );
    }
    return null;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  const handleFilterChange = (newStatus: string) => {
    setFilter(newStatus);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const filters = [
    { value: "all", label: "All Orders" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PROCESSING", label: "Processing" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="text-center">
          <Loader2 className="animate-spin text-green-600 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/farmer/dashboard" 
              className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 mb-4 transition-colors"
            >
              <ChevronLeft size={20} />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-slate-900">Manage Orders</h1>
            <p className="text-slate-500 mt-1">View and manage customer orders</p>
          </div>
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
            <ShoppingBag size={24} className="text-white" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-green-50 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
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

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {/* Added index suffix to parent order loop key for strict uniqueness */}
            {orders.map((order, orderIdx) => (
              <div key={`order-${order.id}-${orderIdx}`} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Order Header */}
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Order #{order.id}</p>
                      <p className="text-sm text-slate-600">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <div className="flex gap-2">
                        {getActionButton(order.id, order.status)}
                        {getCancelButton(order.status, order.id)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4">
                  {/* Customer Info */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-1">Customer</p>
                    <p className="text-slate-800">{order.buyer.first_name} {order.buyer.last_name}</p>
                    <p className="text-sm text-slate-500">{order.buyer.email}</p>
                    {order.buyer.phone && (
                      <p className="text-sm text-slate-500">{order.buyer.phone}</p>
                    )}
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-1">Shipping Address</p>
                    <p className="text-sm text-slate-600">{order.shippingAddress}</p>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Items</p>
                    <div className="space-y-2">
                      {/* FIX: Combined parent order ID and map loop index to ensure complete uniqueness across components */}
                      {order.orderItems.map((item, itemIdx) => (
                        <div key={`order-${order.id}-item-${item.id}-${itemIdx}`} className="flex justify-between text-sm">
                          <span>
                            {item.quantity} × {item.product.name} ({item.product.unit})
                          </span>
                          <span className="font-medium">{formatETB(item.quantity * item.unitPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-green-600">{formatETB(order.totalAmount)}</span>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mt-3 text-sm text-slate-500">
                      <span className="font-medium">Notes:</span> {order.notes}
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link 
                      href={`/farmer/order/${order.id}`}
                      className="inline-flex items-center gap-1 text-green-600 text-sm font-medium hover:underline"
                    >
                      <Eye size={14} />
                      View Order Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100">
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Orders Found</h3>
            <p className="text-slate-500">You don't have any orders listed under this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}