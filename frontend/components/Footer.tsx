"use client";

import React from "react";
import { Sprout, Globe, Mail, ExternalLink } from "lucide-react"; 

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-0 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        
        {/* Branding Section */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-900/20">
              <Sprout size={18}/>
            </div>
            <span className="font-black text-xl tracking-tighter text-white">AgriSmart AI</span>
          </div>
          <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
            Empowering local farmers with AI-driven market intelligence and a seamless direct-to-buyer marketplace.
          </p>
        </div>

        {/* Platform Links */}
        <div>
          <h4 className="font-black text-white uppercase text-xs tracking-[0.2em] mb-6">Platform</h4>
          <ul className="space-y-4 text-slate-400 font-bold text-sm">
            <li><a href="/marketplace" className="hover:text-green-400 transition-colors">Marketplace</a></li>
            <li><a href="/dashboard" className="hover:text-green-400 transition-colors">Farmer Dashboard</a></li>
            <li><a href="/products/add" className="hover:text-green-400 transition-colors">List Produce</a></li>
          </ul>
        </div>

        {/* Social Section */}
        <div>
          <h4 className="font-black text-white uppercase text-xs tracking-[0.2em] mb-6">Connect</h4>
          <div className="flex gap-4">
            <button 
              aria-label="Social Media" 
              className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-500 hover:bg-green-500 hover:text-white transition-all duration-300"
            >
              <Globe size={20}/>
            </button>
            <button 
              aria-label="Source Code" 
              className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-500 hover:bg-green-500 hover:text-white transition-all duration-300"
            >
              <ExternalLink size={20}/>
            </button>
            <button 
              aria-label="Email" 
              className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-500 hover:bg-green-500 hover:text-white transition-all duration-300"
            >
              <Mail size={20}/>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 text-center">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
          © 2026 AgriSmart AI • Final Year Project • CS Department
        </p>
      </div>
    </footer>
  );
}