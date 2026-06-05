"use client";

import { useCart } from '@/contexts/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const router = useRouter();

  const handleCheckout = async () => {
    if (!shippingAddress) {
      alert('Please enter your shipping address');
      return;
    }

    setIsCheckingOut(true);
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: totalPrice,
        shippingAddress: shippingAddress,
        notes: notes
      };
      
      const response = await api.post('/orders', orderData);
      
      if (response.data.success) {
        clearCart();
        router.push(`/orders/${response.data.data.orderId}`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Failed to create order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <ShoppingBag size={80} className="mx-auto text-slate-300 mb-6" />
          <h1 className="text-3xl font-black text-slate-900 mb-4">Your Cart is Empty</h1>
          <p className="text-slate-500 mb-8">Browse our marketplace and add some fresh produce!</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-green-700 transition-colors"
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-slate-900">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 text-sm font-bold uppercase tracking-wider"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag size={32} className="text-green-500" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-black text-xl text-slate-900">{item.name}</h3>
                        <p className="text-sm text-slate-500">by {item.farmerName}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-end mt-4">
                      <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-slate-900 min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-slate-400">per {item.unit}</p>
                        <p className="text-2xl font-black text-green-600">
                          ETB {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-8">
              <h2 className="text-xl font-black text-slate-900 mb-4">Order Summary</h2>
              
              {/* Shipping Address */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Shipping Address *
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your full delivery address"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              {/* Order Notes */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions for the farmer"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-bold">ETB {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-bold">To be calculated</span>
                </div>
              </div>
              
              <div className="flex justify-between py-4 text-lg font-black text-slate-900">
                <span>Estimated Total</span>
                <span className="text-2xl text-green-600">ETB {totalPrice.toLocaleString()}</span>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || !shippingAddress}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              
              <Link
                href="/marketplace"
                className="block text-center mt-4 text-sm text-slate-500 hover:text-slate-700"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}