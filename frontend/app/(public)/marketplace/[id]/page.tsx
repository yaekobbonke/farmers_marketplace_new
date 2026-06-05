"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { 
  User, Phone, MapPin, ArrowLeft, Sprout, 
  Scale, ShieldCheck, TrendingUp, 
  BarChart3, Loader2, Package, ShoppingCart, 
  Plus, Minus, CheckCircle
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  location?: string;
  stockQuantity?: number;
  category?: { name: string };
  farmer?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    address?: string;
  };
  pricePredictions?: Array<{
    predictedPrice: number;
    createdAt: string;
  }>;
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, items: cartItems } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Check if product is already in cart
  const isInCart = cartItems.some(item => item.productId === product?.id);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_BASE}/products/${id}`);
        
        if (!response.ok) {
          throw new Error("Product not found");
        }

        const result = await response.json();
        const productData = result.data || result;
        
        // ✅ Ensure stockQuantity exists (default to 10 if not present)
        setProduct({
          ...productData,
          stockQuantity: productData.stockQuantity ?? 10
        });
        
        // Fetch similar products
        if (productData.id) {
          const similarResponse = await fetch(`${API_BASE}/search/similar/${productData.id}?limit=4`);
          const similarResult = await similarResponse.json();
          setSimilarProducts(similarResult.data || []);
        }
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) {
      alert('Product not loaded');
      return;
    }
    
    console.log('Adding to cart:', { product, quantity });
    addToCart(product, quantity);
    setAddedToCart(true);
    
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD] gap-4">
        <Loader2 className="animate-spin text-green-600" size={40} />
        <div className="text-center font-black text-slate-300 uppercase tracking-widest">
          Loading Product...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-20 text-center">
        <div className="font-black text-red-400 uppercase tracking-widest mb-4">
          {error || "Product Not Found"}
        </div>
        <Link href="/marketplace" className="text-sm font-bold underline text-green-600">
          Return to Market
        </Link>
      </div>
    );
  }

  const farmerName = product.farmer?.first_name 
    ? `${product.farmer.first_name} ${product.farmer.last_name || ''}`
    : "Verified Farmer";
  const farmerPhone = product.farmer?.phone || "Contact via App";
  const unit = product.unit || "kg";

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <div className="max-w-6xl mx-auto p-6">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm uppercase tracking-tight">
          <ArrowLeft size={16} strokeWidth={3} /> Back to Marketplace
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-[0.2em]">
                <Sprout size={14} strokeWidth={3} /> Verified Database Record
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter capitalize">
                {product.name}
              </h1>
            </div>

            {/* Pricing Card with Cart */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Listing Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">ETB</span>
                      <span className="text-6xl font-black text-slate-900">{product.price?.toLocaleString()}</span>
                      <span className="text-lg font-bold text-slate-400">/ {unit}</span>
                    </div>
                  </div>
                  
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-2">
                    <button
                      onClick={decrementQuantity}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-2xl font-black text-slate-900 min-w-[50px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                    <span className="text-sm text-slate-500 font-medium ml-2">{unit}</span>
                  </div>
                </div>
                
                {/* Add to Cart Button - Always enabled */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    className={`flex-1 py-5 rounded-2xl font-black text-center uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${
                      addedToCart
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100 active:scale-95'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <CheckCircle size={20} />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={20} />
                        Add to Cart - ETB {(product.price * quantity).toLocaleString()}
                      </>
                    )}
                  </button>
                  
                  {isInCart && (
                    <button
                      onClick={() => router.push('/cart')}
                      className="px-6 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                    >
                      View Cart
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Farmer Information Sidebar */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl">
              <div className="text-center space-y-4 mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto text-green-600 shadow-inner">
                  <User size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{farmerName}</h2>
                <div className="flex items-center justify-center gap-1 text-blue-600 font-black text-[10px] uppercase tracking-tighter">
                  <ShieldCheck size={14} /> Registered Vendor
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone size={10} /> Verified Number
                  </p>
                  <p className="text-lg font-black text-slate-900">{farmerPhone}</p>
                </div>
              </div>

              <div className="mt-8">
                <a 
                  href={`tel:${farmerPhone}`} 
                  className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-center block uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-green-100"
                >
                  Call Farmer
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}