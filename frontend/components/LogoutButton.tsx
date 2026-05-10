"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/utils/logout";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    logout(router);
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium text-sm"
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}