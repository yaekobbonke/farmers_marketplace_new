"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  CreditCard,
  Percent
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
    farmer?: {
      id: number;
      first_name: string;
      last_name: string;
      phone?: string;
    };
  };
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  buyer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  orderItems: OrderItem[];
}

// Fee configuration (matching checkout)
const DELIVERY_FEE = 100;
const SYSTEM_FEE_PERCENTAGE = 0.005; // 0.5%
const TAX_PERCENTAGE = 0.05; // 5%

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      const orderData = response.data?.data || response.data;
      setOrder(orderData);
    } catch (err: any) {
      console.error("Error fetching order:", err);
      if (err.response?.status === 404) {
        setError("Order not found");
      } else if (err.response?.status === 401) {
        setError("Please login to view this order");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError("Failed to load order details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    
    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      await fetchOrderDetails();
      alert("Order cancelled successfully");
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      alert(err.response?.data?.error || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'REFUNDED':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'DELIVERED':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'CANCELLED':
        return <XCircle size={20} className="text-red-600" />;
      default:
        return <Clock size={20} className="text-yellow-600" />;
    }
  };

  const canCancel = () => {
    return order && ['PENDING', 'CONFIRMED'].includes(order.status.toUpperCase());
  };

  // Calculate fee breakdown from order total
  const calculateBreakdown = (total: number) => {
    // Total = Subtotal + Delivery Fee + (Subtotal * 0.005) + (Subtotal * 0.05)
    // Total = Subtotal * (1 + 0.005 + 0.05) + 100
    // Total = Subtotal * 1.055 + 100
    // Subtotal = (Total - 100) / 1.055
    const subtotal = (total - DELIVERY_FEE) / (1 + SYSTEM_FEE_PERCENTAGE + TAX_PERCENTAGE);
    const systemFee = subtotal * SYSTEM_FEE_PERCENTAGE;
    const taxFee = subtotal * TAX_PERCENTAGE;
    
    return {
      subtotal,
      systemFee,
      taxFee,
      deliveryFee: DELIVERY_FEE,
      total
    };
  };

  const breakdown = order ? calculateBreakdown(order.totalAmount) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-white">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-500 mb-6">{error || "We couldn't find your order details."}</p>
          <Link 
            href="/buyer/dashboard" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link 
          href="/buyer/dashboard" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-slate-500">Order Number</p>
                <h1 className="text-3xl font-black text-slate-900">#{order.id}</h1>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Order Date</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Order Status</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="text-sm font-medium">{order.status}</span>
                </div>
              </div>
              
              {canCancel() && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package size={20} className="text-blue-600" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{item.product.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.quantity} × {item.product.unit} @ {formatETB(item.unitPrice)}
                    </p>
                    {item.product.farmer && (
                      <p className="text-xs text-slate-400 mt-1">
                        Seller: {item.product.farmer.first_name} {item.product.farmer.last_name}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-green-600">
                    {formatETB(item.quantity * item.unitPrice)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Calculate subtotal from order items */}
          {(() => {
            const itemsSubtotal = order.orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const systemFee = itemsSubtotal * SYSTEM_FEE_PERCENTAGE;
            const taxFee = itemsSubtotal * TAX_PERCENTAGE;
            
            return (
              <>
                {/* Shipping Information */}
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Truck size={20} className="text-blue-600" />
                    Shipping Information
                  </h2>
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-700">{order.shippingAddress || "No address provided"}</p>
                      {order.trackingNumber && (
                        <p className="text-sm text-slate-500 mt-2">
                          Tracking Number: <span className="font-mono">{order.trackingNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Summary with Fee Breakdown */}
                <div className="p-6 bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-900">{formatETB(itemsSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1">
                        <Truck size={14} className="text-slate-400" />
                        <span className="text-slate-600">Delivery Fee</span>
                      </div>
                      <span className="font-semibold text-slate-900">{formatETB(DELIVERY_FEE)}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1">
                        <Percent size={14} className="text-slate-400" />
                        <span className="text-slate-600">System Fee (0.5%)</span>
                      </div>
                      <span className="font-semibold text-slate-900">{formatETB(systemFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-sm">💰</span>
                        <span className="text-slate-600">Tax (5%)</span>
                      </div>
                      <span className="font-semibold text-slate-900">{formatETB(taxFee)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-bold text-green-600">{formatETB(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fee Breakdown Info */}
                  <div className="mt-4 p-3 bg-white rounded-xl">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      🚚 Delivery fee: {formatETB(DELIVERY_FEE)} fixed rate
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      ⚙️ System fee: {SYSTEM_FEE_PERCENTAGE * 100}% of subtotal
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      💰 Tax: {TAX_PERCENTAGE * 100}% of subtotal
                    </p>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Order Notes */}
          {order.notes && (
            <div className="p-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                <span className="font-medium">Order Notes:</span> {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/marketplace"
            className="flex-1 text-center px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/buyer/dashboard"
            className="flex-1 text-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}