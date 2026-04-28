"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sprout,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api"; 

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // New state for password confirmation
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState<{
    type: "error" | "success" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    role: "FARMER",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Password Confirmation Logic
    if (formData.password !== confirmPassword) {
      return setStatus({
        type: "error",
        message: "Passwords do not match!",
      });
    }

    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const payload = { 
        ...formData, 
        role: formData.role.toUpperCase() 
      };

      const response = await api.post("/auth/register", payload);

      setStatus({
        type: "success",
        message: "Account created! Redirecting to login...",
      });

      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Registration failed. Try again.";
      setStatus({ type: "error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-12">
      <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-100">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-green-100">
            <Sprout size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Join AgriSmart</h1>
          <p className="text-slate-400 font-medium mt-2">The future of farm-to-market trading.</p>
        </div>

        {/* Status Messages */}
        {status.type && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm animate-in fade-in zoom-in duration-300 ${
            status.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
          }`}>
            {status.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="First Name"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-green-500 outline-none font-bold placeholder:text-slate-300"
            />
            <input
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Last Name"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-green-500 outline-none font-bold placeholder:text-slate-300"
            />
          </div>

          <input
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email Address"
            className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-green-500 outline-none font-bold placeholder:text-slate-300"
          />

          <input
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone Number"
            className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-green-500 outline-none font-bold placeholder:text-slate-300"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-green-500 outline-none font-bold placeholder:text-slate-300"
            />
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className={`w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 outline-none font-bold placeholder:text-slate-300 ${
                confirmPassword && formData.password !== confirmPassword 
                ? "ring-2 ring-red-400" 
                : "focus:ring-green-500"
              }`}
            />
          </div>

          <p className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 pt-2">I am a:</p>
          
          <div className="flex gap-3">
            {["FARMER", "TRADER", "ADMIN"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({ ...formData, role })}
                className={`flex-1 py-3 rounded-2xl font-bold transition-all text-xs ${
                  formData.role === role 
                  ? "bg-green-600 text-white shadow-lg shadow-green-100 scale-105" 
                  : "bg-slate-50 text-slate-400 border border-transparent hover:border-slate-200"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white font-black text-lg rounded-2xl hover:bg-black disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-slate-200"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : "CREATE ACCOUNT"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <p className="text-center mt-8 text-sm font-bold text-slate-400">
          Already a member? <Link href="/login" className="text-green-600 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}