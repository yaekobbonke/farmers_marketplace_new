"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Info,
  Sprout, 
  Banknote, 
  CheckCircle2, 
  MapPin,
  Loader2
} from "lucide-react";
import api from "@/lib/api"; 

export default function AddProductPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "CROP", 
    price: "",
    quantity: "",
    unit: "qtl", 
    location: "",
    categoryId: 1,
    status: "AVAILABLE"
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Pre-fill location from profile if available
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      setFormData(prev => ({ ...prev, location: savedLocation }));
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      
      const response = await api.post("/product", {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity),
        categoryId: Number(formData.categoryId),
      });

      if (response.data.success) {
        setSuccess(true);
        // Clear local draft if any
        setTimeout(() => router.push("/marketplace"), 2000);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to publish listing. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-500 font-bold hover:text-green-600 transition-all"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
            Back
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {success ? (
            <div className="py-32 text-center animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={56} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Harvest Listed!</h2>
              <p className="text-slate-500 font-medium mt-4">Redirecting you to the marketplace...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              <div className="lg:col-span-7 p-8 md:p-16 border-r border-slate-50">
                <div className="mb-10">
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Post Produce</h1>
                  <p className="text-slate-400 font-medium text-sm md:text-base">List your crops for bulk buyers across Ethiopia.</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 animate-shake">
                    <Info size={18} /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 md:y-8">
                  {/* Product Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. White Teff"
                      value={formData.name}
                      className="w-full p-5 md:p-6 bg-slate-50 border-2 border-transparent focus:border-green-500/10 focus:bg-white rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-green-500/5 outline-none text-lg md:text-xl font-bold transition-all"
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  {/* Location Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origin Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Gojam, Amhara"
                        value={formData.location}
                        className="w-full pl-14 pr-6 py-5 md:py-6 bg-slate-50 border-transparent rounded-2xl md:rounded-3xl focus:bg-white focus:ring-4 focus:ring-green-500/5 outline-none font-bold text-base md:text-lg transition-all"
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Price */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price per Unit</label>
                      <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none">
                           <Banknote size={18} />
                           <span className="text-[10px] font-black">ETB</span>
                        </div>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price}
                          className="w-full pl-20 pr-6 py-5 md:py-6 bg-slate-50 border-transparent rounded-2xl md:rounded-3xl focus:bg-white focus:ring-4 focus:ring-green-500/5 outline-none font-black text-xl md:text-2xl transition-all"
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Quantity</label>
                      <div className="flex gap-2">
                        <input 
                          required
                          type="number"
                          placeholder="0"
                          value={formData.quantity}
                          className="w-full p-5 md:p-6 bg-slate-50 border-transparent rounded-2xl md:rounded-3xl focus:bg-white focus:ring-4 focus:ring-green-500/5 outline-none font-black text-xl md:text-2xl transition-all"
                          onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        />
                        <select 
                          value={formData.unit}
                          className="bg-slate-100 px-4 rounded-2xl md:rounded-3xl font-black text-slate-500 uppercase text-[10px] tracking-widest outline-none hover:bg-slate-200 transition-colors cursor-pointer"
                          onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        >
                          <option value="kg">kg</option>
                          <option value="qtl">qtl</option>
                          <option value="ton">ton</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quality Notes (Optional)</label>
                    <textarea 
                      placeholder="e.g. Grade A, freshly harvested, organic..."
                      value={formData.description}
                      className="w-full p-6 bg-slate-50 border-none rounded-2xl md:rounded-3xl focus:bg-white focus:ring-4 focus:ring-green-500/5 outline-none font-medium min-h-[100px] transition-all"
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 md:py-8 bg-slate-900 text-white font-black text-xl rounded-[2rem] md:rounded-[2.5rem] hover:bg-green-600 active:scale-[0.98] transition-all shadow-xl disabled:bg-slate-400 disabled:scale-100 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <><Loader2 className="animate-spin" /> PROCESSING...</>
                    ) : (
                      "PUBLISH LISTING"
                    )}
                  </button>
                </form>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-5 bg-slate-900 p-10 md:p-16 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
                <div className="space-y-8 relative z-10">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 border border-green-500/20">
                    <Sprout size={24} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">Market Tip</h3>
                  <p className="text-slate-400 font-medium leading-relaxed text-lg">
                    Accurate <span className="text-white">Location</span> and <span className="text-white">Quantity</span> data helps our AI connect you with the right buyers faster.
                  </p>
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                      <CheckCircle2 size={18} className="text-green-500" /> Real-time pricing index
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                      <CheckCircle2 size={18} className="text-green-500" /> National buyer reach
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}