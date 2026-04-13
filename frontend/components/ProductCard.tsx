"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // Import Link for navigation
import { TrendingUp, TrendingDown, AlertCircle, User, Phone, MapPin, ChevronRight } from "lucide-react";

interface MarketPrice {
  price: number;
}

interface Prediction {
  predictedPrice: number;
}

<<<<<<< HEAD
// Inside your ProductCard file
export interface Product {  // <--- Added 'export'
  _id: string;
  name: string;
  type: string; 
  price: number; // The component expects a number
=======
interface Product {
  _id: string;
  name: string;
  type: string; 
  price: number;
>>>>>>> 21815d8f14fb771ea61b4529855f6e39448e5c59
  location?: string;
  unit?: string; 
  farmer_name?: string; 
  phone?: string; 
  marketPrices?: MarketPrice[];
  predictions?: Prediction[];
}

interface ProductCardProps {
  product: Product; 
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [sessionUser, setSessionUser] = useState({ name: "", phone: "" });

  useEffect(() => {
    const name = localStorage.getItem("first_name") || "Verified Farmer";
    const phone = localStorage.getItem("phone") || "+251 --- --- ---";
    setSessionUser({ name, phone });
  }, []);

  if (!product) return null;

  const displayName = product.farmer_name || sessionUser.name;
  const displayPhone = product.phone || sessionUser.phone;
  const marketPrice = product.marketPrices?.[0]?.price ?? 0;
  const farmerPrice = product.price ?? 0;
  const aiForecast = product.predictions?.[0]?.predictedPrice ?? 0;
  const unit = product.unit || "qtl";
  const isGoodDeal = aiForecast > farmerPrice;

  return (
    /* Wrap everything in a Link pointing to the product ID */
    <Link href={`/marketplace/${product._id}`} className="block group">
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 group-hover:shadow-xl group-hover:shadow-slate-200/50 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        
        {/* 1. Farmer Contact & Location */}
        <div className="flex flex-col gap-1 border-b border-slate-50 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg text-green-600">
                <User size={14} strokeWidth={3} />
              </div>
              <span className="text-sm font-black text-slate-900 truncate max-w-[120px]">
                {displayName}
              </span>
            </div>
            
            {product.location && (
              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                <MapPin size={10} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase">{product.location}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-slate-400">
            <Phone size={12} strokeWidth={3} />
            <span className="text-[11px] font-bold tracking-tight">
              {displayPhone}
            </span>
          </div>
        </div>

        {/* 2. Crop Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">CROP</p>
            <h3 className="font-black text-xl text-slate-900 tracking-tight group-hover:text-green-600 transition-colors">
              {product.name}
            </h3>
          </div>
          
          {aiForecast > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
              isGoodDeal ? "bg-green-500 text-white" : "bg-amber-500 text-white"
            }`}>
              {isGoodDeal ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
            </div>
          )}
        </div>

        {/* 3. Price Comparison Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Farmer Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-slate-900">ETB</span>
              <p className="text-2xl font-black text-slate-900">{farmerPrice}</p>
            </div>
          </div>
          
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <p className="text-[10px] uppercase font-black text-blue-500 mb-1">Market Avg</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-blue-800">ETB</span>
              <p className="text-2xl font-black text-blue-800">{marketPrice || '---'}</p>
            </div>
          </div>
        </div>

        {/* 4. Action Footer & AI Prediction */}
        <div className="space-y-3">
          {aiForecast > 0 ? (
            <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-lg shadow-slate-200 flex justify-between items-center">
              <div>
                <p className="text-[8px] uppercase font-black tracking-widest opacity-60 mb-1">Forecast</p>
                <p className="text-xl font-black text-white">{aiForecast.toFixed(0)} <span className="text-[10px] text-slate-400">ETB</span></p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-green-400 uppercase">
                View Details <ChevronRight size={14} strokeWidth={3} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-widest">More Info</span>
              <ChevronRight size={14} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};