"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  LogOut, 
  User as UserIcon 
} from "lucide-react";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const userName = typeof window !== "undefined" ? localStorage.getItem("userName") : "Farmer";

  const menuItems = [
    { name: "Dashboard", href: "/dashboard/farmer", icon: LayoutDashboard },
    { name: "Marketplace", href: "/products", icon: ShoppingBag },
    { name: "AI Assistant", href: "/ai-assistant", icon: MessageSquare },
  ];

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-green-600 flex items-center gap-2">
          <span className="bg-green-600 text-white p-1 rounded">Ag</span> Agri-Insight
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? "bg-green-50 text-green-700 font-bold" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="bg-gray-100 p-2 rounded-full">
            <UserIcon size={18} className="text-gray-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-400 uppercase">Farmer</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};