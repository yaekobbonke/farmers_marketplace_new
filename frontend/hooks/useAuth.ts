"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth(requiredRole?: "FARMER" | "BUYER") {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 1. Check for token in localStorage
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token) {
      // No token? Send them to login
      router.push("/login");
      return;
    }

    // 2. Check for Role match (if a specific role is required)
    if (requiredRole && userRole !== requiredRole) {
      // Role mismatch? Send them to the default products page or unauthorized
      router.push("/products"); 
      return;
    }

    setIsAuthenticated(true);
  }, [requiredRole, router]);

  return { isAuthenticated };
}