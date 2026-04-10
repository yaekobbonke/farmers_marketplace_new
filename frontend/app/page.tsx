"use client";

import Link from "next/link";
import { ShoppingCart, LayoutDashboard, ArrowRight, Sprout } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-12">
        
        {/* Logo/Brand */}
        <div className="space-y-4">
          <div className="w-20 h-20 bg-green-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-green-200">
            <Sprout size={40} className="text-white" />
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter">AgriSmart AI</h1>
          <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto">
            The next-generation marketplace connecting local farmers with real-time intelligence.
          </p>
        </div>

        {/* Path Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Buyer Path */}
          <Link href="/marketplace" className="group p-10 bg-white rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShoppingCart size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">I am a Buyer</h2>
            <p className="text-slate-400 font-medium mb-8">Browse fresh produce and livestock from local farms.</p>
            <div className="flex items-center gap-2 font-black text-blue-600">
              Enter Marketplace <ArrowRight size={20} />
            </div>
          </Link>

          {/* Farmer Path */}
          <Link href="/dashboard" className="group p-10 bg-slate-900 rounded-[3rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all">
            <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mb-6">
              <LayoutDashboard size={32} />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">I am a Farmer</h2>
            <p className="text-slate-400 font-medium mb-8">Manage inventory, list products, and view AI insights.</p>
            <div className="flex items-center gap-2 font-black text-green-500">
              Go to Dashboard <ArrowRight size={20} />
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}