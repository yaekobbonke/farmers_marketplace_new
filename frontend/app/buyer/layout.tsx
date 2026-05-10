"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userStr) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role?.toUpperCase() !== "BUYER") {
        if (user.role?.toUpperCase() === "ADMIN") {
          router.replace("/admin/dashboard");
        } else if (user.role?.toUpperCase() === "FARMER") {
          router.replace("/farmer/dashboard");
        } else {
          router.replace("/login");
        }
        return;
      }
      setIsAuthorized(true);
    } catch (error) {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
}