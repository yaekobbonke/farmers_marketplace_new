"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, LayoutDashboard, Users, ShoppingBag, Settings, LogOut, ShieldCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userStr) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role?.toUpperCase() !== "ADMIN") {
        if (user.role?.toUpperCase() === "FARMER") {
          router.replace("/farmer/dashboard");
        } else if (user.role?.toUpperCase() === "BUYER") {
          router.replace("/buyer/dashboard");
        } else {
          router.replace("/login");
        }
        return;
      }
      setIsAuthorized(true);
    } catch (error) {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/admin/dashboard" },
    { name: "User Management", icon: <Users size={20} />, href: "/admin/users" },
    { name: "All Products", icon: <ShoppingBag size={20} />, href: "/admin/products" },
    { name: "Settings", icon: <Settings size={20} />, href: "/admin/settings" },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed top-0 left-0 h-full shadow-2xl z-50 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-slate-900" />
            </div>
            <h1 className="text-xl font-black tracking-tight">AgriSmart Admin</h1>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 text-left ${
                    isActive 
                    ? "bg-green-600 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span className="font-bold text-sm">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-red-400 font-bold transition-colors w-full p-2 rounded-xl hover:bg-slate-800"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}