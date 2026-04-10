"use client";

import  { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Sprout, 
  Banknote, 
  CheckCircle2, 
  Info,
  MapPin // Added for Location
} from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "CROP", 
    price: "",
    quantity: "",
    unit: "qtl", // Defaulting to quintal as per your previous request
    location: "", // New Field
    categoryId: 1,
    status: "AVAILABLE"
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    // Pre-fill location if it exists in user session/localStorage
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      setFormData(prev => ({ ...prev, location: savedLocation }));
    }
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/product", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseFloat(formData.quantity),
          categoryId: Number(formData.categoryId),
        }),
      });

      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/marketplace"), 2500);
      } else {
        alert("Error: " + (result.message || "Could not publish listing"));
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Backend server unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push("/dashboard/farmer")}
            className="group flex items-center gap-2 text-slate-500 font-bold hover:text-green-600 transition-all"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {success ? (
            <div className="py-32 text-center animate-in fade-in zoom-in duration-700">
              <div className="w-28 h-28 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={56} />
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Harvest Listed!</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              <div className="lg:col-span-7 p-10 md:p-16 border-r border-slate-50">
                <div className="mb-12">
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Post Produce</h1>
                  <p className="text-slate-400 font-medium">List your crops for bulk buyers across Ethiopia.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Product Title */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. White Teff"
                      value={formData.name}
                      className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-green-500/10 focus:bg-white rounded-3xl focus:ring-4 focus:ring-green-500/5 outline-none text-xl font-bold transition-all"
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  {/* LOCATION FIELD (NEW) */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origin Location</label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <MapPin size={20} />
                      </div>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Gojam, Amhara"
                        value={formData.location}
                        className="w-full pl-14 pr-6 py-6 bg-slate-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-green-500/5 outline-none font-bold text-lg transition-all"
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Price */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price per Unit</label>
                      <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 pointer-events-none">
                           <Banknote size={20} />
                           <span className="text-xs font-black">ETB</span>
                        </div>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price}
                          className="w-full pl-24 pr-6 py-6 bg-slate-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-green-500/5 outline-none font-black text-2xl transition-all"
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Quantity</label>
                      <div className="flex gap-2">
                        <input 
                          required
                          type="number"
                          placeholder="0"
                          value={formData.quantity}
                          className="w-full p-6 bg-slate-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-green-500/5 outline-none font-black text-2xl transition-all"
                          onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        />
                        <select 
                          value={formData.unit}
                          className="bg-slate-100 px-4 rounded-3xl font-black text-slate-500 uppercase text-[10px] tracking-widest outline-none hover:bg-slate-200 transition-colors cursor-pointer"
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
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes (Optional)</label>
                    <textarea 
                      placeholder="Describe the quality..."
                      value={formData.description}
                      className="w-full p-6 bg-slate-50 border-none rounded-3xl focus:bg-white focus:ring-4 focus:ring-green-500/5 outline-none font-medium min-h-[120px] transition-all"
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-8 bg-slate-900 text-white font-black text-xl rounded-[2.5rem] hover:bg-green-600 transition-all shadow-xl disabled:opacity-50"
                  >
                    {loading ? "PROCESSING..." : "PUBLISH LISTING"}
                  </button>
                </form>
              </div>

              {/* Information Panel */}
              <div className="lg:col-span-5 bg-slate-900 p-12 md:p-16 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
                <div className="space-y-12 relative z-10">
                  <div className="space-y-6">
                    <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 border border-green-500/20">
                      <Sprout size={32} />
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">Farmer's Advantage</h3>
                    <p className="text-slate-400 font-medium leading-relaxed text-lg">
                      Adding your <span className="text-white">Location</span> helps buyers estimate transportation costs and builds trust in your region's quality.
                    </p>
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