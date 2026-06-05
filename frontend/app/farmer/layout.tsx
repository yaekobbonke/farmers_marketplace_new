"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import AIAssistant from "@/components/AIAssistant";

// Session timeout configuration
const SESSION_TIMEOUT_MINUTES = 30;
const WARNING_MINUTES = 2;

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_MINUTES * 60);
  const [userName, setUserName] = useState<string>("");
  
  // Refs for timeouts
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timeouts
  const clearTimeouts = () => {
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
  };

  // Logout function
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    router.push("/login");
  };

  // Reset the session timer
  const resetTimer = () => {
    clearTimeouts();
    setShowWarning(false);
    
    const warningTimeoutMs = (SESSION_TIMEOUT_MINUTES - WARNING_MINUTES) * 60 * 1000;
    if (warningTimeoutMs > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(WARNING_MINUTES * 60);
        
        warningIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
              handleLogout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningTimeoutMs);
    }
    
    logoutTimeoutRef.current = setTimeout(handleLogout, SESSION_TIMEOUT_MINUTES * 60 * 1000);
  };

  // Stay logged in
  const stayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    const handleActivity = () => resetTimer();
    
    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer();
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeouts();
    };
  }, []);

  // Authentication check
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userStr) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role?.toUpperCase() !== "FARMER") {
        if (user.role?.toUpperCase() === "ADMIN") {
          router.replace("/admin/dashboard");
        } else if (user.role?.toUpperCase() === "BUYER") {
          router.replace("/buyer/dashboard");
        } else {
          router.replace("/login");
        }
        return;
      }
      setIsAuthorized(true);
      setUserName(user.name || "");
    } catch (error) {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <>
      <Navbar />
      <AIAssistant userRole="FARMER" userName={userName} />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
      
      {/* Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Session Expiring Soon</h3>
                <p className="text-slate-500">Due to inactivity, you'll be logged out in {Math.ceil(timeLeft / 60)} minute{Math.ceil(timeLeft / 60) !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Click "Stay Logged In" to continue your session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={stayLoggedIn}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}