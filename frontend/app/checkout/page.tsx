// app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, CreditCard, MapPin, Phone, User, Mail, Building2, Wallet, Percent, Shield } from "lucide-react";

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: "cash" | "telebirr" | "chapa" | "bank";
}

// Fee configuration
const DELIVERY_FEE = 100; 
const SYSTEM_FEE_PERCENTAGE = 0.005; // 0.5%
const TAX_PERCENTAGE = 0.05; // 5% tax

export default function CheckoutPage() {
  const router = useRouter();
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState<CheckoutForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    paymentMethod: "cash"
  });

  useEffect(() => {
    const storedSubtotal = sessionStorage.getItem('checkoutSubtotal');
    const storedTotal = sessionStorage.getItem('checkoutTotal');
    const items = sessionStorage.getItem('checkoutItems');
    
    if (items) {
      setCartItems(JSON.parse(items));
      if (storedSubtotal) {
        setCartTotal(parseFloat(storedSubtotal));
      } else if (storedTotal) {
        setCartTotal(parseFloat(storedTotal));
      }
    } else {
      router.push('/cart');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Calculate all fees
  const deliveryFee = DELIVERY_FEE;
  const systemFee = cartTotal * SYSTEM_FEE_PERCENTAGE;
  const taxFee = cartTotal * TAX_PERCENTAGE;
  const grandTotal = cartTotal + deliveryFee + systemFee + taxFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      alert("Please fill in all fields");
      return;
    }
    
    // Save checkout data to session storage
    sessionStorage.setItem('checkoutForm', JSON.stringify(formData));
    sessionStorage.setItem('checkoutSubtotal', cartTotal.toString());
    sessionStorage.setItem('checkoutTotal', grandTotal.toString());
    
    router.push('/review-order');
  };

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/cart" className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 mb-6">
          <ArrowLeft size={20} /> Back to Cart
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Truck size={20} className="text-green-600" />
                  <h2 className="text-xl font-bold text-slate-900">Shipping Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="First name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="09XXXXXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Street address"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                      required
                    >
                      <option value="">Select City</option>
                      <option value="Addis Ababa">Addis Ababa</option>
                      <option value="Adama">Adama</option>
                      <option value="Bahir Dar">Bahir Dar</option>
                      <option value="Gondar">Gondar</option>
                      <option value="Hawassa">Hawassa</option>
                      <option value="Dire Dawa">Dire Dawa</option>
                      <option value="Mekelle">Mekelle</option>
                      <option value="Jimma">Jimma</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet size={20} className="text-green-600" />
                  <h2 className="text-xl font-bold text-slate-900">Payment Method</h2>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === "cash"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Cash on Delivery</p>
                      <p className="text-xs text-slate-500">Pay when you receive your order</p>
                    </div>
                    <span className="text-2xl">💵</span>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="telebirr"
                      checked={formData.paymentMethod === "telebirr"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Telebirr</p>
                      <p className="text-xs text-slate-500">Pay using Telebirr mobile money</p>
                    </div>
                    <span className="text-2xl">📱</span>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="chapa"
                      checked={formData.paymentMethod === "chapa"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Chapa</p>
                      <p className="text-xs text-slate-500">Pay with Chapa (Card/Bank)</p>
                    </div>
                    <span className="text-2xl">💳</span>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === "bank"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Bank Transfer</p>
                      <p className="text-xs text-slate-500">Direct bank transfer</p>
                    </div>
                    <span className="text-2xl">🏦</span>
                  </label>
                </div>

                {formData.paymentMethod !== "cash" && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium mb-2">🔒 Mock Payment Demo</p>
                    <p className="text-xs text-blue-600">
                      This is a demo. No actual payment will be processed.
                      {formData.paymentMethod === "telebirr" && " In production, you would be redirected to Telebirr payment page."}
                      {formData.paymentMethod === "chapa" && " In production, you would be redirected to Chapa checkout."}
                      {formData.paymentMethod === "bank" && " In production, you would see bank account details for transfer."}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all active:scale-95"
              >
                Review Order
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {cartItems.map((item: any, index: number) => (
                  <div key={`${item.id}-${index}`} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span className="font-semibold">{formatETB(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-100 pt-4 space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">{formatETB(cartTotal)}</span>
                </div>
                
                {/* Delivery Fee */}
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <Truck size={14} className="text-slate-400" />
                    <span className="text-slate-600">Delivery Fee</span>
                  </div>
                  <span className="font-semibold">{formatETB(deliveryFee)}</span>
                </div>
                
                {/* System Fee (0.5%) */}
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <Percent size={14} className="text-slate-400" />
                    <span className="text-slate-600">System Fee (0.5%)</span>
                  </div>
                  <span className="font-semibold">{formatETB(systemFee)}</span>
                </div>
                
                {/* Tax (5%) */}
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-sm">💰</span>
                    <span className="text-slate-600">Tax (5%)</span>
                  </div>
                  <span className="font-semibold">{formatETB(taxFee)}</span>
                </div>
                
                {/* Total */}
                <div className="flex justify-between pt-3 border-t border-slate-200">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">{formatETB(grandTotal)}</span>
                </div>
              </div>

              {/* Fee Breakdown Info */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Shield size={12} />
                  Delivery fee: {formatETB(DELIVERY_FEE)} fixed rate
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  System fee: {SYSTEM_FEE_PERCENTAGE * 100}% of subtotal
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Tax: {TAX_PERCENTAGE * 100}% of subtotal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}