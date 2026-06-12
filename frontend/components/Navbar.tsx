"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sprout, 
  LayoutDashboard, 
  Info, 
  Briefcase,
  Phone,
  User, 
  Bell,
  Home,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  ShoppingCart
} from "lucide-react";
import api from "@/lib/api";
import { useCart } from "@/contexts/CartContext";

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "ADMIN" | "FARMER" | "BUYER";
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  read: boolean;
  createdAt: string;
  productId?: number;
}

const getUserFromStorage = (): UserData | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Failed to parse user data:", error);
    return null;
  }
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserData | null>(getUserFromStorage);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { totalItems } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!user || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      const response = await api.get("/notifications");
      const data = response.data.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error("Error fetching notifications:", error);
      }
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error("Error marking notification as read:", error);
      }
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error("Error marking all as read:", error);
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user && token && mounted) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications, mounted]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsDropdownOpen(false);
      setIsNotificationOpen(false);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    router.push("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "FARMER":
        return "/farmer/dashboard";
      case "BUYER":
        return "/buyer/dashboard";
      default:
        return "/dashboard";
    }
  };

  const getDashboardLabel = () => {
    if (!user) return "Sign In";
    switch (user.role) {
      case "ADMIN":
        return "Admin Panel";
      case "FARMER":
        return "Dashboard";
      case "BUYER":
        return "My Account";
      default:
        return "Dashboard";
    }
  };

  const getDashboardIcon = () => {
    if (!user) return <User size={18} />;
    switch (user.role) {
      case "ADMIN":
        return <ShieldCheck size={18} />;
      default:
        return <LayoutDashboard size={18} />;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle size={14} className="text-green-500" />;
      case "error":
        return <XCircle size={14} className="text-red-500" />;
      case "warning":
        return <AlertCircle size={14} className="text-yellow-500" />;
      default:
        return <Bell size={14} className="text-blue-500" />;
    }
  };

  const mainNavItems = [
    { href: "/", icon: <Home size={18} />, label: "Home" },
    { href: "/about", icon: <Info size={18} />, label: "About Us" },
    { href: "/services", icon: <Briefcase size={18} />, label: "Services" },
    { href: "/contact", icon: <Phone size={18} />, label: "Contacts" },
  ];

  return (
    <>
      <nav 
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-lg" 
            : "bg-white/80 backdrop-blur-sm border-b border-slate-100 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Brand Identity */}
          <Link 
            href="/" 
            className="flex items-center gap-2 sm:gap-3 group shrink-0"
            aria-label="AgriSmart Home"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100 group-hover:scale-105 transition-transform duration-200">
              <Sprout size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="hidden xs:block">
              <span className="font-black text-lg sm:text-xl text-slate-900 tracking-tight block leading-none">
                AgriSmart
              </span>
              <span className="text-[8px] sm:text-[10px] text-green-600 font-black uppercase tracking-tight mt-0.5 block">
                AI Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
              />
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!mounted ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse"></div>
                <div className="w-24 h-10 bg-gray-100 rounded-xl animate-pulse"></div>
              </div>
            ) : (
              <>
                {/* Shopping Cart Button */}
                {user && user.role === "BUYER" && (
                  <Link href="/cart" className="relative">
                    <div className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors">
                      <ShoppingCart size={20} />
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                          {totalItems > 99 ? "99+" : totalItems}
                        </span>
                      )}
                    </div>
                  </Link>
                )}

                {/* Notification Bell */}
                {user && (
                  <div className="relative" ref={notificationRef}>
                    <button 
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                      aria-label="Notifications"
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                          <h3 className="font-bold text-slate-900">Notifications</h3>
                          {notifications.length > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-green-600 hover:underline"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                              <Bell size={32} className="mx-auto mb-2 opacity-30" />
                              <p className="text-sm">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${
                                  !notification.read ? "bg-green-50/30" : ""
                                }`}
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div className="flex gap-3">
                                  <div className="shrink-0">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                                  )}
                                </div>
                                {notification.productId && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/marketplace/${notification.productId}`);
                                      setIsNotificationOpen(false);
                                    }}
                                    className="mt-2 text-xs text-green-600 hover:underline"
                                  >
                                    View Product →
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User Dropdown */}
                {!user ? (
                  <div className="flex items-center gap-3">
                    <Link 
                      href="/register"
                      className="text-sm font-bold text-slate-600 hover:text-green-600 transition-colors"
                    >
                      Register
                    </Link>
                    <Link 
                      href="/login"
                      className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-100"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl hover:bg-green-100 transition-all border border-slate-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-100">
                          <p className="text-sm font-bold text-slate-800">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-green-700">
                            {user.role}
                          </span>
                        </div>
                        
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              router.push(getDashboardLink());
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left"
                          >
                            {getDashboardIcon()}
                            <span className="text-sm font-medium">{getDashboardLabel()}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              router.push("/profile");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left"
                          >
                            <User size={18} />
                            <span className="text-sm font-medium">My Profile</span>
                          </button>
                          
                          {user.role === "BUYER" && (
                            <button
                              onClick={() => {
                                setIsDropdownOpen(false);
                                router.push("/cart");
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                              <ShoppingCart size={18} />
                              <span className="text-sm font-medium">
                                My Cart {totalItems > 0 && `(${totalItems})`}
                              </span>
                            </button>
                          )}
                          
                          <div className="border-t border-slate-100 my-1"></div>
                          
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left"
                          >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && mounted && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-lg animate-in slide-in-from-top duration-300 max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-3 space-y-1">
              {mainNavItems.map((item) => (
                <MobileNavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              
              {user && user.role === "BUYER" && (
                <MobileNavLink
                  href="/cart"
                  icon={<ShoppingCart size={18} />}
                  label={`My Cart ${totalItems > 0 ? `(${totalItems})` : ""}`}
                  active={isActive("/cart")}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}
              
              {!user ? (
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <MobileNavLink
                    href="/register"
                    icon={<User size={18} />}
                    label="Register"
                    active={isActive("/register")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <MobileNavLink
                    href="/login"
                    icon={<LogOut size={18} />}
                    label="Sign In"
                    active={isActive("/login")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
              ) : (
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <div className="px-4 py-3 bg-slate-50 rounded-xl mb-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <MobileNavLink
                    href={getDashboardLink()}
                    icon={getDashboardIcon()}
                    label={getDashboardLabel()}
                    active={isActive(getDashboardLink())}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <MobileNavLink
                    href="/profile"
                    icon={<User size={18} />}
                    label="My Profile"
                    active={isActive("/profile")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* SPACER REMOVED - No more extra gap */}
    </>
  );
}

// Desktop NavLink Component
function NavLink({ href, icon, label, active }: any) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 px-3 lg:px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
        active 
          ? "bg-white text-green-600 shadow-sm" 
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
      }`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

// Mobile NavLink Component
function MobileNavLink({ href, icon, label, active, onClick }: any) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? "bg-green-50 text-green-600 font-semibold" 
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
