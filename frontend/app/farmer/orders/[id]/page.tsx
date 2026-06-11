"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  Printer,
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
  };
}

interface OrderDetails {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress: string;
  notes?: string;
  trackingNumber?: string;
  buyer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  orderItems: OrderItem[];
}

// Fee configuration
const DELIVERY_FEE = 100;
const SYSTEM_FEE_PERCENTAGE = 0.005; // 0.5%
const TAX_PERCENTAGE = 0.05; // 5%

export default function FarmerOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/orders/${id}`);
      const orderData = response.data?.data || response.data;
      
      if (orderData) {
        setOrder(orderData);
      } else {
        setError("Order not found");
      }
    } catch (err: any) {
      console.error("Error fetching order:", err);
      if (err.response?.status === 404) {
        setError("Order not found. The order may have been deleted or you don't have permission to view it.");
      } else if (err.response?.status === 401) {
        setError("Please login to view this order");
        setTimeout(() => router.push("/login"), 2000);
      } else if (err.response?.status === 403) {
        setError("You don't have permission to view this order");
      } else {
        setError(err.response?.data?.error || "Failed to load order details");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status: string) => {
    if (!confirm(`Are you sure you want to mark this order as ${status}?`)) return;
    
    setProcessing(true);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      await fetchOrder();
      alert(`Order status updated to ${status} successfully!`);
    } catch (err: any) {
      console.error("Error updating order:", err);
      alert(err.response?.data?.error || "Failed to update order status");
    } finally {
      setProcessing(false);
    }
  };

  const formatETB = (val: number) => 
    new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock size={16} className="text-yellow-600" />,
        text: 'Pending'
      },
      CONFIRMED: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <CheckCircle size={16} className="text-blue-600" />,
        text: 'Confirmed'
      },
      PROCESSING: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Package size={16} className="text-purple-600" />,
        text: 'Processing'
      },
      SHIPPED: {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: <Truck size={16} className="text-indigo-600" />,
        text: 'Shipped'
      },
      DELIVERED: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle size={16} className="text-green-600" />,
        text: 'Delivered'
      },
      CANCELLED: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle size={16} className="text-red-600" />,
        text: 'Cancelled'
      }
    };
    
    const statusConfig = config[status] || config.PENDING;
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
        {statusConfig.icon}
        <span className="text-sm font-medium">{statusConfig.text}</span>
      </div>
    );
  };

  const getNextActions = (status: string) => {
    switch(status) {
      case 'PENDING':
        return (
          <div className="flex gap-4">
            <button
              onClick={() => updateOrderStatus('CONFIRMED')}
              disabled={processing}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {processing ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Accept Order"}
            </button>
            <button
              onClick={() => updateOrderStatus('CANCELLED')}
              disabled={processing}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Reject Order
            </button>
          </div>
        );
      case 'CONFIRMED':
        return (
          <button
            onClick={() => updateOrderStatus('PROCESSING')}
            disabled={processing}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {processing ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Start Processing"}
          </button>
        );
      case 'PROCESSING':
        return (
          <button
            onClick={() => updateOrderStatus('SHIPPED')}
            disabled={processing}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {processing ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Mark as Shipped"}
          </button>
        );
      case 'SHIPPED':
        return (
          <button
            onClick={() => updateOrderStatus('DELIVERED')}
            disabled={processing}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {processing ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Mark as Delivered"}
          </button>
        );
      default:
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate fee breakdown
  const calculateBreakdown = () => {
    if (!order) return null;
    
    const itemsSubtotal = order.orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const systemFee = itemsSubtotal * SYSTEM_FEE_PERCENTAGE;
    const taxFee = itemsSubtotal * TAX_PERCENTAGE;
    
    return {
      itemsSubtotal,
      systemFee,
      taxFee,
      deliveryFee: DELIVERY_FEE,
      customerTotal: order.totalAmount
    };
  };

  const breakdown = calculateBreakdown();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <div className="text-center">
          <Loader2 className="animate-spin text-green-600 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-white">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-500 mb-6">{error || "We couldn't find your order details."}</p>
          <Link 
            href="/farmer/orders" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/farmer/orders" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Orders
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Printer size={18} />
            Print Order
          </button>
        </div>

        {/* Order Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header Section */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Order #{order.id}</h1>
                <p className="text-sm text-slate-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* Customer Information */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-green-600" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="font-medium text-slate-800">{order.buyer.first_name} {order.buyer.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  {order.buyer.email}
                </p>
              </div>
              {order.buyer.phone && (
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    {order.buyer.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-green-600" />
              Shipping Address
            </h2>
            <p className="text-slate-700">{order.shippingAddress}</p>
          </div>

          {/* Order Items */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package size={18} className="text-green-600" />
              Order Items
            </h2>
            <div className="space-y-3">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800">{item.product.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.quantity} × {item.product.unit} @ {formatETB(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {formatETB(item.quantity * item.unitPrice)}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Items Subtotal */}
            {breakdown && (
              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Items Subtotal:</span>
                  <span className="font-medium">{formatETB(breakdown.itemsSubtotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Fee Breakdown Section */}
          {breakdown && (
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Percent size={18} className="text-green-600" />
                Fee Breakdown
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span>🚚 Delivery Fee</span>
                  </div>
                  <span className="font-medium">{formatETB(breakdown.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span>⚙️ System Fee (0.5%)</span>
                  </div>
                  <span className="font-medium">{formatETB(breakdown.systemFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span>💰 Tax (5%)</span>
                  </div>
                  <span className="font-medium">{formatETB(breakdown.taxFee)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Customer Total</span>
                    <span className="text-xl font-bold text-green-600">{formatETB(breakdown.customerTotal)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Your Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatETB(breakdown.itemsSubtotal)}</p>
                <p className="text-xs text-green-600 mt-1">
                  You receive the items subtotal. Delivery fee, system fee, and tax are collected by the platform.
                </p>
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Order Notes:</span> {order.notes}
              </p>
            </div>
          )}

          {/* Tracking Information */}
          {order.trackingNumber && (
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Truck size={18} className="text-green-600" />
                Tracking Information
              </h2>
              <p className="text-slate-700">Tracking Number: <span className="font-mono">{order.trackingNumber}</span></p>
            </div>
          )}

          {/* Action Buttons */}
          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
            <div className="p-6 bg-slate-50">
              {getNextActions(order.status)}
            </div>
          )}

          {/* Order Timeline */}
          <div className="p-6 bg-slate-50/30">
            <h2 className="font-bold text-slate-900 mb-4">Order Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Order Placed</p>
                  <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              
              {order.status !== 'PENDING' && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Order Confirmed</p>
                    <p className="text-sm text-slate-500">Order was confirmed by you</p>
                  </div>
                </div>
              )}
              
              {(order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Processing</p>
                    <p className="text-sm text-slate-500">Order is being prepared</p>
                  </div>
                </div>
              )}
              
              {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Shipped</p>
                    <p className="text-sm text-slate-500">Order is on the way</p>
                  </div>
                </div>
              )}
              
              {order.status === 'DELIVERED' && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Delivered</p>
                    <p className="text-sm text-slate-500">Order has been delivered</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}