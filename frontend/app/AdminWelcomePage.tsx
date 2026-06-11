"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, Users, Package, TrendingUp, ArrowRight } from "lucide-react";

export default function AdminWelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-12">
        
        {/* Admin Brand */}
        <div className="space-y-4">
          <div className="w-20 h-20 bg-green-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-green-900/30">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter">Admin Portal</h1>
          <p className="text-xl text-slate-400 font-medium max-w-xl mx-auto">
            Welcome to the AgriSmart AI administration center.
          </p>
        </div>

        {/* Quick Stats Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-2xl p-6 text-left">
            <Users className="text-blue-400 mb-3" size={28} />
            <h3 className="text-2xl font-bold text-white">User Management</h3>
            <p className="text-slate-400 text-sm mt-2">Manage farmers, buyers, and system access</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 text-left">
            <Package className="text-green-400 mb-3" size={28} />
            <h3 className="text-2xl font-bold text-white">Product Oversight</h3>
            <p className="text-slate-400 text-sm mt-2">Review and verify marketplace listings</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 text-left">
            <TrendingUp className="text-purple-400 mb-3" size={28} />
            <h3 className="text-2xl font-bold text-white">Analytics</h3>
            <p className="text-slate-400 text-sm mt-2">View platform statistics and insights</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/30"
          >
            Go to Dashboard <ArrowRight size={18} />
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-700 text-slate-300 rounded-2xl font-bold hover:bg-slate-600 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}