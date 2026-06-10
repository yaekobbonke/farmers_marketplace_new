"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InactivityWarning from "./InactivityWarning";
import api from "@/lib/api";

export default function SessionManager() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    let activityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
    const WARNING_BEFORE = 60 * 1000; // Show warning 1 minute before

    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      router.push("/login");
    };

    const refreshSession = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Call your refresh token endpoint
          const response = await api.post("/auth/refresh-token");
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            console.log("✅ Session refreshed");
          }
        }
      } catch (error) {
        console.error("Failed to refresh session:", error);
        handleLogout();
      }
    };

    const startTimers = () => {
      // Clear existing timers
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      setShowWarning(false);

      // Set warning timer
      warningTimer = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(60);
        
        // Start countdown
        countdownInterval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, SESSION_DURATION - WARNING_BEFORE);

      // Set logout timer
      activityTimer = setTimeout(() => {
        handleLogout();
      }, SESSION_DURATION);
    };

    const handleActivity = () => {
      startTimers();
    };

    // Track user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => window.addEventListener(event, handleActivity));
    
    startTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
    };
  }, [router]);

  const handleStay = async () => {
    try {
      // Refresh the token
      const response = await api.post("/auth/refresh-token");
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setShowWarning(false);
        console.log("✅ User chose to stay logged in");
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      // Force logout if refresh fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  return (
    <InactivityWarning
      show={showWarning}
      onStay={handleStay}
      onLogout={handleLogout}
      secondsLeft={timeLeft}
    />
  );
}