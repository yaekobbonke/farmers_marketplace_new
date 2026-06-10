"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SessionTimeoutProps {
  timeoutMinutes?: number; // Default 30 minutes
  warningMinutes?: number; // Show warning before logout
  children: React.ReactNode;
}

export default function SessionTimeout({ 
  timeoutMinutes = 30, 
  warningMinutes = 2,
  children 
}: SessionTimeoutProps) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  };

  const logout = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Redirect to login
    router.push("/login");
  };

  const showWarning = () => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      const warningMessage = `You will be logged out due to inactivity in ${warningMinutes} minute${warningMinutes > 1 ? 's' : ''}.`;
      console.log(warningMessage);
      
      // Optional: Show a toast/notification
      const shouldStay = confirm(`${warningMessage}\n\nClick OK to stay logged in.`);
      if (shouldStay) {
        resetTimer();
        warningShownRef.current = false;
      }
    }
  };

  const resetTimer = () => {
    clearTimeouts();
    
    // Set warning timeout
    const warningTimeoutMs = (timeoutMinutes - warningMinutes) * 60 * 1000;
    if (warningTimeoutMs > 0) {
      warningRef.current = setTimeout(showWarning, warningTimeoutMs);
    }
    
    // Set logout timeout
    timeoutRef.current = setTimeout(logout, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    // Set up event listeners for user activity
    const events = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'mousemove'
    ];
    
    const handleActivity = () => {
      resetTimer();
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // Start timer
    resetTimer();
    
    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeouts();
    };
  }, []);

  return <>{children}</>;
}