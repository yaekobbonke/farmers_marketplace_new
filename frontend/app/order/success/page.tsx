// app/order/success/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Truck, Clock, Printer, ArrowLeft, Download, Share2, Loader2, AlertCircle, Percent } from "lucide-react";
import api from "@/lib/api";

interface OrderDetails {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  shippingAddress: string;
  notes: string;
  buyer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  orderItems: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    product: {
      id: number;
      name: string;
      unit: string;
    };
  }>;
}

// Fee configuration (matching checkout)
const DELIVERY_FEE = 100;
const SYSTEM_FEE_PERCENTAGE = 0.005; // 0.5%
const TAX_PERCENTAGE = 0.05; // 5%

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");
  const paymentMethod = searchParams.get("payment");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.push('/marketplace');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/orders/${orderId}`);
        const orderData = response.data?.data || response.data;
        setOrder(orderData);
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.error || "Unable to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

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

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMessage = () => {
    switch(paymentMethod) {
      case 'cash':
        return "You'll pay when your order arrives.";
      case 'telebirr':
        return "Payment will be processed via Telebirr. You'll receive a payment request shortly.";
      case 'chapa':
        return "Payment will be processed via Chapa. You'll be redirected to complete payment.";
      case 'bank':
        return "Please transfer the amount to our bank account. Details sent to your email.";
      default:
        return "Your order has been confirmed.";
    }
  };

  const getPaymentIcon = () => {
    switch(paymentMethod) {
      case 'cash': return '💵';
      case 'telebirr': return '📱';
      case 'chapa': return '💳';
      case 'bank': return '🏦';
      default: return '💰';
    }
  };

  const getPaymentName = () => {
    switch(paymentMethod) {
      case 'cash': return 'Cash on Delivery';
      case 'telebirr': return 'Telebirr';
      case 'chapa': return 'Chapa';
      case 'bank': return 'Bank Transfer';
      default: return paymentMethod || 'Payment Method';
    }
  };

  // Calculate fees from order total
  // Note: The order.totalAmount already includes all fees
  // We need to extract the subtotal by reversing the calculation
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
            href="/marketplace" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50/30 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Order Confirmed! 🎉</h1>
          <p className="text-slate-500">Thank you for your purchase!</p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-sm text-slate-500">Order Number</p>
                <p className="text-2xl font-black text-slate-900">#{order.id}</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-sm text-slate-500">Order Date</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Order Status</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">{order.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Truck size={16} />
                <span className="text-sm">Estimated delivery: 3-5 business days</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="p-6 border-b border-slate-100 bg-blue-50/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{getPaymentIcon()}</span>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{getPaymentName()}</p>
                <p className="text-sm text-slate-600">{getPaymentMessage()}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
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
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Truck size={18} className="text-green-600" />
                <h3 className="font-bold text-slate-900">Shipping Address</h3>
              </div>
              <p className="text-slate-600">{order.shippingAddress}</p>
            </div>
          )}

          {/* Order Summary with Fee Breakdown */}
          <div className="p-6 bg-slate-50/50">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">{breakdown ? formatETB(breakdown.subtotal) : formatETB(0)}</span>
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
                <span className="font-semibold text-slate-900">{breakdown ? formatETB(breakdown.systemFee) : formatETB(0)}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-sm">💰</span>
                  <span className="text-slate-600">Tax (5%)</span>
                </div>
                <span className="font-semibold text-slate-900">{breakdown ? formatETB(breakdown.taxFee) : formatETB(0)}</span>
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
            className="flex-1 text-center px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            View My Orders
          </Link>
          <button
            onClick={handlePrint}
            className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            Print Receipt
          </button>
        </div>

        {/* Order Help */}
        <div className="mt-8 p-4 bg-slate-50 rounded-xl text-center">
          <p className="text-sm text-slate-600">
            Need help with your order? Contact our support team at 
            <a href="mailto:support@example.com" className="text-green-600 ml-1 hover:underline">support@example.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
          <div className="text-center">
            <Loader2 className="animate-spin text-green-600 mx-auto mb-4" size={48} />
            <p className="text-slate-500 font-medium">Loading layout context...</p>
          </div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}