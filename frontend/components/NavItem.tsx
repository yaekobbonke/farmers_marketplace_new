"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  onClick?: () => void; // Still useful for closing the mobile menu or triggering the AI slide-over
}

export default function NavItem({ icon, label, href, onClick }: NavItemProps) {
  const pathname = usePathname();
  
  // Logic: Highlight if the current URL matches the link's destination
  const isActive = pathname === href;

  return (
    <Link 
      href={href}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-green-600 text-white shadow-md' 
          : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}