"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sprout, BadgeIndianRupee, Scale, CheckCircle2, ShoppingBasket } from "lucide-react";

export default function StandaloneAddProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "CROP",
    price: "",
    quantity: "",
    unit: "kg",
    farmerId: 1, // You will replace this with real Auth later
    categoryId: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseFloat(formData.quantity),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        // Redirect to the main marketplace after 2 seconds
        setTimeout(() => router.push("/products"), 2000);
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Simple Navigation */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => router.push("/products")}
            className="flex items-center gap-2 text-slate-400 font-bold hover:text-green-600 transition-all"
          >
            <ArrowLeft size={20} /> Exit to Marketplace
          </button>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Seller Portal v1.0</span>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-10 md:p-16">
          {success ? (
            <div className="py-24 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Product Listed!</h2>
              <p className="text-slate-500 mt-3 font-medium text-lg">Redirecting you to the marketplace...</p>
            </div>
          ) : (
            <>
              <div className="mb-12">
                <div className="flex items-center gap-3 text-green-600 mb-2">
                  <ShoppingBasket size={24} />
                  <span className="font-bold uppercase tracking-widest text-sm">Inventory Entry</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Add New Produce</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Product Name */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                    What are you listing?
                  </label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Organic Cavendish Bananas"
                    className="w-full p-6 bg-slate-50 border-none rounded-3xl focus:ring-4 focus:ring-green-100 outline-none text-xl font-bold transition-all placeholder:text-slate-300"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                {/* Price and Quantity Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      Price per unit
                    </label>
                    <div className="relative">
                      <BadgeIndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                      <input 
                        required
                        type="number"
                        placeholder="0.00"
                        className="w-full pl-14 pr-6 py-6 bg-slate-50 border-none rounded-3xl focus:ring-4 focus:ring-green-100 outline-none font-black text-2xl"
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      Available Stock
                    </label>
                    <div className="flex gap-3">
                      <input 
                        required
                        type="number"
                        placeholder="Qty"
                        className="w-full p-6 bg-slate-50 border-none rounded-3xl focus:ring-4 focus:ring-green-100 outline-none font-black text-2xl"
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                      <select 
                        className="bg-slate-900 text-white px-8 rounded-3xl font-black text-sm uppercase tracking-widest cursor-pointer hover:bg-black transition-colors"
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      >
                        <option value="kg">kg</option>
                        <option value="qtl">qtl</option>
                        <option value="ton">ton</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-8 bg-green-600 text-white font-black text-2xl rounded-[2rem] hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-green-200 disabled:opacity-50 disabled:hover:scale-100 mt-4"
                >
                  {loading ? "COMMUNICATING WITH DB..." : "CONFIRM & PUBLISH"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}