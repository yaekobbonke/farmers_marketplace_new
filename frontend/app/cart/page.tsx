"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { 
  Trash2, 
  ShoppingBag, 
  ArrowLeft, 
  CreditCard, 
  Loader2,
  AlertCircle,
  Minus,
  Plus,
  Truck,      // ← Add this
  Percent,    // ← Add this
  Shield,     // ← Add this
  X
} from "lucide-react";
import api from "@/lib/api";

interface StockValidation {
  productId: number;
  name: string;
  requestedQuantity: number;
  availableQuantity: number;
  hasStock: boolean;
}

// Fee configuration (matching checkout page)
const DELIVERY_FEE = 100;
const SYSTEM_FEE_PERCENTAGE = 0.005; // 0.5%
const TAX_PERCENTAGE = 0.05; // 5% tax

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockErrors, setStockErrors] = useState<{ [key: string]: string }>({});
  const [validatingStock, setValidatingStock] = useState(false);

  // Calculate cart total
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  
  // Calculate fees
  const deliveryFee = DELIVERY_FEE;
  const systemFee = subtotal * SYSTEM_FEE_PERCENTAGE;
  const taxFee = subtotal * TAX_PERCENTAGE;
  const grandTotal = subtotal + deliveryFee + systemFee + taxFee;

  // Validate stock before checkout
  const validateStock = async (): Promise<boolean> => {
    setValidatingStock(true);
    setStockErrors({});
    setError(null);
    
    try {
      const validationPromises = items.map(async (item) => {
        try {
          const response = await api.get(`/products/${item.productId || item.id}`);
          const product = response.data?.data || response.data;
          
          if (!product) {
            return {
              productId: item.id,
              name: item.name,
              requestedQuantity: item.quantity,
              availableQuantity: 0,
              hasStock: false
            };
          }
          
          const availableStock = product.quantity || product.stockQuantity || 0;
          
          if (availableStock < item.quantity) {
            return {
              productId: item.id,
              name: item.name,
              requestedQuantity: item.quantity,
              availableQuantity: availableStock,
              hasStock: false
            };
          }
          return null;
        } catch (err) {
          console.error(`Failed to validate stock for ${item.name}:`, err);
          return {
            productId: item.id,
            name: item.name,
            requestedQuantity: item.quantity,
            availableQuantity: 0,
            hasStock: false
          };
        }
      });
      
      const results = await Promise.all(validationPromises);
      const outOfStockItems = results.filter(r => r !== null) as StockValidation[];
      
      if (outOfStockItems.length > 0) {
        const errors: { [key: string]: string } = {};
        outOfStockItems.forEach(item => {
          if (item.availableQuantity === 0) {
            errors[item.name] = `${item.name} is currently out of stock. Please remove it from your cart.`;
          } else {
            errors[item.name] = `Only ${item.availableQuantity} ${item.name} available. You requested ${item.requestedQuantity}.`;
          }
        });
        setStockErrors(errors);
        setError(`Cannot checkout: Some items have stock issues. Please adjust quantities or remove them.`);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Stock validation failed:", err);
      setError("Unable to verify stock availability. Please try again.");
      return false;
    } finally {
      setValidatingStock(false);
    }
  };

  const handleProceedToCheckout = async () => {
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    const hasStock = await validateStock();
    if (!hasStock) {
      return;
    }

    // Save cart data to session storage for checkout page
    sessionStorage.setItem('checkoutSubtotal', subtotal.toString());
    sessionStorage.setItem('checkoutTotal', grandTotal.toString());
    sessionStorage.setItem('checkoutItems', JSON.stringify(items));
    
    // Navigate to checkout page
    router.push('/checkout');
  };

  const handleUpdateQuantity = (itemId: number, newQuantity: number, itemName: string) => {
    if (newQuantity >= 1) {
      updateQuantity(itemId, newQuantity);
      setStockErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[itemName];
        return newErrors;
      });
      setError(null);
    }
  };

  const handleRemoveItem = (itemId: number, itemName: string) => {
    removeFromCart(itemId);
    setStockErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[itemName];
      return newErrors;
    });
    setError(null);
  };

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  };

  const hasStockError = Object.keys(stockErrors).length > 0;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 mb-8">
            <ArrowLeft size={20} /> Continue Shopping
          </Link>
          
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={48} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link 
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 mb-6">
          <ArrowLeft size={20} /> Continue Shopping
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X size={18} />
            </button>
          </div>
        )}

        {validatingStock && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-blue-500" />
            <p className="text-blue-700">Checking product availability...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className={`bg-white rounded-2xl p-5 shadow-sm border ${
                stockErrors[item.name] ? 'border-red-200 bg-red-50/30' : 'border-slate-100'
              }`}>
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={32} className="text-green-500" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                        <p className="text-sm text-slate-500">{item.unit}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    {stockErrors[item.name] && (
                      <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded-lg">
                        ⚠️ {stockErrors[item.name]}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.name)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-lg font-semibold text-slate-800 min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.name)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          {formatETB(item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-slate-400">{formatETB(item.price)} per {item.unit}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {items.map((item, index) => (
                  <div key={`summary-${item.id}-${index}`} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span className="font-semibold">{formatETB(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">{formatETB(subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <Truck size={14} className="text-slate-400" />
                    <span className="text-slate-600">Delivery Fee</span>
                  </div>
                  <span className="font-semibold">{formatETB(deliveryFee)}</span>
                </div>
                
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <Percent size={14} className="text-slate-400" />
                    <span className="text-slate-600">System Fee (0.5%)</span>
                  </div>
                  <span className="font-semibold">{formatETB(systemFee)}</span>
                </div>
                
                <div className="flex justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-sm">💰</span>
                    <span className="text-slate-600">Tax (5%)</span>
                  </div>
                  <span className="font-semibold">{formatETB(taxFee)}</span>
                </div>
                
                <div className="flex justify-between pt-3 border-t border-slate-200">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">{formatETB(grandTotal)}</span>
                </div>
              </div>

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
              
              <button
                onClick={handleProceedToCheckout}
                disabled={hasStockError || validatingStock}
                className={`w-full mt-4 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  hasStockError || validatingStock
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 active:scale-95 shadow-lg shadow-green-100'
                }`}
              >
                <CreditCard size={20} />
                Proceed to Checkout
              </button>
              
              {hasStockError && (
                <p className="text-xs text-red-500 text-center mt-3">
                  Please remove or adjust out-of-stock items to proceed
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}