"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: any;
  logout: () => void;
  resetTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const TIMEOUT_MINUTES = 30;
  const WARNING_MINUTES = 2;

  const clearTimeouts = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    setUser(null);
    router.push("/login");
  };

  const showWarning = () => {
    const shouldStay = confirm(`You will be logged out due to inactivity in ${WARNING_MINUTES} minute(s). Click OK to stay logged in.`);
    if (shouldStay) {
      resetTimer();
    }
  };

  const resetTimer = () => {
    clearTimeouts();
    
    const warningTimeout = (TIMEOUT_MINUTES - WARNING_MINUTES) * 60 * 1000;
    if (warningTimeout > 0) {
      warningRef.current = setTimeout(showWarning, warningTimeout);
    }
    
    timeoutRef.current = setTimeout(logout, TIMEOUT_MINUTES * 60 * 1000);
  };

  useEffect(() => {
    // Load user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    // Activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    const handleActivity = () => resetTimer();
    events.forEach(event => window.addEventListener(event, handleActivity));
    
    resetTimer();
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeouts();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, logout, resetTimer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}