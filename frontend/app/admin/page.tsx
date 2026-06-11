"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import PublicHomePage from "../PublicHomePage";
import AdminWelcomePage from "../AdminWelcomePage";

export default function HomePage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const role = user.role?.toUpperCase();
      setUserRole(role);
      
      // Option 1: Auto-redirect (uncomment if you want immediate redirect)
      // if (role === "ADMIN") {
      //   router.replace("/admin/dashboard");
      // } else if (role === "FARMER") {
      //   router.replace("/farmer/dashboard");
      // } else if (role === "BUYER") {
      //   router.replace("/buyer/dashboard");
      // }
    } catch (error) {
      console.error("Error parsing user:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  // Show different home pages based on role
  if (userRole === "ADMIN") {
    return <AdminWelcomePage />;
  }

  // Show public home page for non-logged in users, farmers, and buyers
  return <PublicHomePage />;
}