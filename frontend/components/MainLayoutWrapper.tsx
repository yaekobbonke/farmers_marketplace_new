"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  X, 
  LogOut, 
  User as UserIcon,
  ChevronRight,
  PlusCircle,
  Store,
  Sparkles 
} from "lucide-react";
import ChatAssistant from "@/components/ChatAssistant";
import Link from "next/link";

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link 
      href={href}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
        ? 'bg-green-600 text-white shadow-lg shadow-green-100 font-bold' 
        : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [showChat, setShowChat] = useState(false);
  const [userName, setUserName] = useState("Farmer");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName);
  }, []);

  /**
   * UPDATED: Handles the assistant opening with safe JSON parsing
   */
  const handleOpenAssistant = async () => {
    setShowChat(true);
    
    if (chatMessages.length === 0) {
      setIsAiLoading(true);
      try {
        const response = await fetch("http://127.0.0.1:5000/api/assistant/chat", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: "userQuery", 
            user: userName 
          }),
        });

        // Get raw text first to avoid crashing on non-JSON responses (like "I don't have...")
        const rawResponse = await response.text();
        let assistantReply = "";

        try {
          // Try to parse the text as JSON
          const data = JSON.parse(rawResponse);
          assistantReply = data.reply || data.message || `Hello ${userName}! How can I assist with your farm today?`;
        } catch (parseError) {
          // If parsing fails, use the raw text directly (this handles the "Unexpected token I" error)
          assistantReply = rawResponse || "The assistant returned an empty response.";
        }
        
        setChatMessages([
          { role: "assistant", content: assistantReply }
        ]);
      } catch (error) {
        console.error("AI Error:", error);
        setChatMessages([
          { role: "assistant", content: "Sorry, I'm having trouble connecting to the expert system. Please try again in a moment." }
        ]);
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isStandalonePage = pathname === "/products/add" || pathname === "/marketplace";

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (isAuthPage || isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden text-slate-900 bg-gray-50">
      
      <aside className="w-72 bg-white border-r flex flex-col z-20 shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-100">
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-green-900 block leading-none">Farmers Hub</span>
            <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1 block">AI Intelligence</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={20}/>} label="Console Home" active={pathname === "/dashboard"} />
          <NavItem href="/marketplace" icon={<Store size={20}/>} label="Public Market" active={pathname === "/marketplace"} />
          <NavItem href="/products/add" icon={<PlusCircle size={20}/>} label="List New Crop" active={pathname === "/products/add"} />
          
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">AI Services</p>
            <button 
              onClick={handleOpenAssistant}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                showChat 
                ? 'bg-green-600 text-white shadow-lg shadow-green-100' 
                : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-md ${showChat ? 'bg-white/20' : 'bg-green-100 text-green-600 group-hover:bg-green-200'}`}>
                  <Sparkles size={18}/>
                </div>
                <span className="font-bold text-sm tracking-tight">AI Assistant</span>
              </div>
              <ChevronRight size={16} className={`transition-transform duration-300 ${showChat ? "rotate-90" : "group-hover:translate-x-1"}`} />
            </button>
          </div>
        </nav>

        <div className="p-4 border-t bg-gray-50/50">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <UserIcon size={18} className="text-green-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Authorized Farmer</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-bold">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 z-10">
          <h1 className="font-black text-xl text-slate-900 tracking-tight capitalize">
            {pathname.split('/').pop()?.replace('-', ' ') || "Dashboard"}
          </h1>
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-green-700 bg-green-100/50 px-4 py-2 rounded-full border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Real-time Market Data Active
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {children}
        </main>

        {showChat && (
          <div className="absolute inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowChat(false)} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
              <div className="p-5 border-b flex justify-between items-center bg-green-700 text-white shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><MessageSquare size={20} /></div>
                  <div>
                    <span className="font-bold block text-lg leading-none">Agri-AI Expert</span>
                    <span className="text-[10px] opacity-80 uppercase font-bold tracking-widest mt-1 block">Market Intelligence</span>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden bg-gray-50">
                 <ChatAssistant messages={chatMessages} setMessages={setChatMessages} loading={isAiLoading} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}