"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, CreditCard, Truck, MapPin, User, Phone, Mail, X, Percent } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import api from "@/lib/api";

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: "cash" | "telebirr" | "chapa" | "bank";
}

// FIXED: Added matching constant fee structures
const DELIVERY_FEE = 100; 
const SYSTEM_FEE_PERCENTAGE = 0.005; 

export default function ReviewOrderPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [cartItems, setCartItems] = useState([]);
  
  // FIXED: Separate states for original items total vs dynamic final total
  const [subTotal, setSubTotal] = useState(0); 
  const [grandTotal, setGrandTotal] = useState(0); 
  
  const [checkoutData, setCheckoutData] = useState<CheckoutForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const itemsData = sessionStorage.getItem('checkoutItems');
    const totalData = sessionStorage.getItem('checkoutTotal');
    const formData = sessionStorage.getItem('checkoutForm');
    
    if (itemsData && totalData && formData) {
      const parsedItems = JSON.parse(itemsData);
      setCartItems(parsedItems);
      
      // Calculate original subtotal dynamically from line items
      const itemsSubtotal = parsedItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
      setSubTotal(itemsSubtotal);
      
      // Set grandTotal from the correct value calculated by the checkout screen
      setGrandTotal(parseFloat(totalData));
      setCheckoutData(JSON.parse(formData));
    } else {
      router.push('/cart');
    }
  }, [router]);

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderItems = cartItems.map((item: any) => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
        price: item.price
      }));

      // FIXED: Send the complete matching grandTotal to your backend
      const orderData = {
        items: orderItems,
        totalAmount: grandTotal, 
        shippingAddress: `${checkoutData?.address}, ${checkoutData?.city}`,
        notes: `Payment Method: ${checkoutData?.paymentMethod} | Phone: ${checkoutData?.phone} | Email: ${checkoutData?.email} | Delivery Fee: ${DELIVERY_FEE} ETB | System Fee: ${(subTotal * SYSTEM_FEE_PERCENTAGE).toFixed(2)} ETB`,
      };

      console.log("Sending order data:", orderData);
      const response = await api.post('/orders', orderData);
      
      let orderId = null;
      if (response.data?.data?.id) orderId = response.data.data.id;
      else if (response.data?.id) orderId = response.data.id;
      else if (response.data?.order?.id) orderId = response.data.order.id;
      else if (response.data?.orderId) orderId = response.data.orderId;
      else if (typeof response.data === 'number') orderId = response.data;
      
      if (!orderId && response.headers?.location) {
        const location = response.headers.location;
        const match = location.match(/\/(\d+)$/);
        if (match) orderId = match[1];
      }
      
      if (orderId) {
        clearCart();
        sessionStorage.removeItem('checkoutItems');
        sessionStorage.removeItem('checkoutTotal');
        sessionStorage.removeItem('checkoutForm');
        router.push(`/order/success?id=${orderId}&payment=${checkoutData?.paymentMethod}`);
      } else {
        setError("Order created but couldn't get order ID. Please check your orders page.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Order failed:", err);
      if (err.response?.status === 201 || err.response?.status === 200) {
        let orderId = err.response?.data?.data?.id || err.response?.data?.id;
        if (orderId) {
          clearCart();
          sessionStorage.removeItem('checkoutItems');
          sessionStorage.removeItem('checkoutTotal');
          sessionStorage.removeItem('checkoutForm');
          router.push(`/order/success?id=${orderId}&payment=${checkoutData?.paymentMethod}`);
          return;
        }
      }
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to place order. Please try again.");
      setLoading(false);
    }
  };

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  };

  const getPaymentIcon = (method: string) => {
    switch(method) {
      case 'cash': return '💵';
      case 'telebirr': return '📱';
      case 'chapa': return '💳';
      case 'bank': return '🏦';
      default: return '💰';
    }
  };

  const getPaymentName = (method: string) => {
    switch(method) {
      case 'cash': return 'Cash on Delivery';
      case 'telebirr': return 'Telebirr';
      case 'chapa': return 'Chapa';
      case 'bank': return 'Bank Transfer';
      default: return method;
    }
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  // Calculate dynamic display fees
  const displaySystemFee = subTotal * SYSTEM_FEE_PERCENTAGE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/checkout" className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 mb-6">
          <ArrowLeft size={20} /> Back to Checkout
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Review Your Order</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">{error}</p>
              <p className="text-sm text-red-600 mt-1">Please check your orders page or try again.</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {item.quantity} × {item.unit || 'unit'} @ {formatETB(item.price)}
                      </p>
                    </div>
                    <p className="font-bold text-green-600">
                      {formatETB(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Truck size={20} className="text-green-600" />
                <h2 className="text-xl font-bold text-slate-900">Shipping Information</h2>
              </div>
              <div className="space-y-2 text-slate-600">
                <div className="flex items-start gap-2">
                  <User size={16} className="mt-0.5 text-slate-400" />
                  <div>
                    <p className="font-medium">{checkoutData.firstName} {checkoutData.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  <span>{checkoutData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-slate-400" />
                  <span>{checkoutData.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 text-slate-400" />
                  <span>{checkoutData.address}, {checkoutData.city}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={20} className="text-green-600" />
                <h2 className="text-xl font-bold text-slate-900">Payment Method</h2>
              </div>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-green-50 text-green-700 rounded-xl">
                <span className="text-2xl">{getPaymentIcon(checkoutData.paymentMethod)}</span>
                <span className="font-medium">{getPaymentName(checkoutData.paymentMethod)}</span>
              </div>
              {checkoutData.paymentMethod === "cash" && (
                <p className="text-sm text-slate-500 mt-3">You will pay when you receive your order</p>
              )}
            </div>
          </div>

          {/* Right Column Sidebar Summary Layout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 pb-4 border-b border-slate-100">
                {/* FIXED: Display true matching item breakdown costs */}
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">{formatETB(subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <Truck size={14} className="text-slate-400" />
                    <span className="text-slate-600">Delivery Fee</span>
                  </div>
                  <span className="font-semibold">{formatETB(DELIVERY_FEE)}</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <Percent size={14} className="text-slate-400" />
                    <span className="text-slate-600">System Fee (0.5%)</span>
                  </div>
                  <span className="font-semibold">{formatETB(displaySystemFee)}</span>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 mb-6">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-green-600">{formatETB(grandTotal)}</span>
              </div>
              
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}