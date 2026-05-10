"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  UserPlus,
  UserCheck,
  PlusCircle,
  List,
  Tag,
  TrendingUp,
  BarChart3,
  Bell,
  Globe
} from "lucide-react";
import { useState } from "react";

// Menu item type definition
interface MenuItem {
  name: string;
  icon: React.ReactNode;
  href?: string;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(item => item !== menuName)
        : [...prev, menuName]
    );
  };

  const isMenuOpen = (menuName: string) => openMenus.includes(menuName);

  // Menu items with dropdowns
  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      href: "/admin/dashboard"
    },
    {
      name: "User Management",
      icon: <Users size={20} />,
      subItems: [
        { name: "All Users", href: "/admin/users", icon: <List size={16} /> },
        { name: "Add New User", href: "/admin/users/add", icon: <UserPlus size={16} /> },
        { name: "Pending Approvals", href: "/admin/users/pending", icon: <UserCheck size={16} /> }
      ]
    },
    {
      name: "Product Management",
      icon: <ShoppingBag size={20} />,
      subItems: [
        { name: "All Products", href: "/admin/products", icon: <List size={16} /> },
        { name: "Add Product", href: "/admin/products/add", icon: <PlusCircle size={16} /> },
        { name: "Categories", href: "/admin/categories", icon: <Tag size={16} /> },
        { name: "Pending Verification", href: "/admin/products/pending", icon: <Bell size={16} /> }
      ]
    },
    {
      name: "Market Insights",
      icon: <TrendingUp size={20} />,
      subItems: [
        { name: "Price Analytics", href: "/admin/analytics/prices", icon: <BarChart3 size={16} /> },
        { name: "Market Trends", href: "/admin/analytics/trends", icon: <TrendingUp size={16} /> },
        { name: "Regional Data", href: "/admin/analytics/regions", icon: <Globe size={16} /> }
      ]
    },
    {
      name: "Settings",
      icon: <Settings size={20} />,
      href: "/admin/settings"
    }
  ];

  const isActive = (href: string) => pathname === href;
  const isSubItemActive = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false;
    return subItems.some(item => pathname === item.href);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed top-0 left-0 h-full shadow-2xl z-50 overflow-y-auto">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">AgriSmart</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isItemActive = item.href ? isActive(item.href) : false;
            const isItemOrSubActive = isItemActive || isSubItemActive(item.subItems);
            const isOpen = isMenuOpen(item.name);

            return (
              <div key={item.name} className="mb-1">
                {/* Main Menu Item */}
                {hasSubItems ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      isItemOrSubActive
                        ? "bg-green-600 text-white shadow-lg shadow-green-900/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown size={16} className="transition-transform" />
                    ) : (
                      <ChevronRight size={16} className="transition-transform" />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                      isItemActive
                        ? "bg-green-600 text-white shadow-lg shadow-green-900/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {isItemActive && <ChevronRight size={16} />}
                  </Link>
                )}

                {/* Submenu Items */}
                {hasSubItems && isOpen && (
                  <div className="ml-9 mt-1 space-y-1 border-l border-slate-700 pl-3 animate-in slide-in-from-left-2 duration-200">
                    {item.subItems!.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          pathname === subItem.href
                            ? "bg-green-600/20 text-green-400 font-medium"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {subItem.icon && <span className="opacity-60">{subItem.icon}</span>}
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 min-h-screen">
        {children}
      </main>
    </div>
  );
}