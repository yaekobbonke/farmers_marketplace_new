"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sprout, 
  LayoutDashboard, 
  Store, 
  PlusCircle, 
  User, 
  Bell,
  Home // Added Home icon
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  // Helper to check if a link is active
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100 group-hover:scale-105 transition-transform">
            <Sprout size={30} />
          </div>
          <div className="hidden sm:block">
            <span className="font-black text-xl text-slate-900 tracking-tight block leading-none">AgriSmart</span>
            <span className="text-[10px] text-green-600 font-black uppercase tracking-tight mt-0.5 block">AI Marketplace</span>
          </div>
        </Link>

        {/* Primary Navigation Links */}
        <div className="hidden md:flex items-center gap-15 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {/* Added Home Link */}
          <NavLink 
            href="/" 
            icon={<Home size={18} />} 
            label="Home" 
            active={isActive("/")} 
          />
          <NavLink 
            href="/marketplace" 
            icon={<Store size={18} />} 
            label="Marketplace" 
            active={isActive("/marketplace")} 
          />
          <NavLink 
            href="/dashboard" 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={isActive("/dashboard")} 
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          
          {/* Added Register Button (Secondary Style) */}
          <Link 
            href="/register"
            className="hidden sm:block text-sm font-bold text-slate-600 hover:text-green-600 transition-colors"
          >
            Register
          </Link>

          {/* List Product Button */}
          {pathname !== "/products/add" && (
            <Link 
              href="/products/add" 
              className="hidden lg:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black hover:shadow-lg transition-all active:scale-95"
            >
              <PlusCircle size={18} />
              List Produce
            </Link>
          )}

          {/* User & Notifications */}
          <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
            <button 
              aria-label="Notifications"
              className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            >
              <Bell size={20} />
            </button>
            <Link 
              href="/login" // Changed to login as a logical entry point
              aria-label="Profile"
              className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-green-100 hover:text-green-600 transition-all border border-slate-200"
            >
              <User size={20} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Sub-component for Nav Links
function NavLink({ href, icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
        active 
        ? "bg-white text-green-600 shadow-sm" 
        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}