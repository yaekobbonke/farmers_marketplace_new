"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/admin/dashboard" },
  { name: "User Management", icon: <Users size={20} />, href: "/admin/users" },
  { name: "All Products", icon: <ShoppingBag size={20} />, href: "/admin/products" },
  { name: "Settings", icon: <Settings size={20} />, href: "/admin/settings" },
];

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed h-full shadow-2xl">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center font-black text-slate-900">
              AS
            </div>
            <h1 className="text-xl font-black tracking-tight">AgriSmart Admin</h1>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group ${
                    isActive 
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="font-bold text-sm">{item.name}</span>
                  </div>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto p-8 border-t border-slate-800">
          <button className="flex items-center gap-3 text-slate-400 hover:text-red-400 font-bold transition-colors w-full p-2">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-72">
        {children}
      </main>
    </div>
  );
}