// app/layout.tsx - COMPLETELY MINIMAL
import "./globals.css";
import type { Metadata } from "next";
import { CartProvider } from '@/contexts/CartContext';
import SessionManager from "@/components/SessionManager";

export const metadata: Metadata = {
  title: "Farmers Hub | AI Price Intelligence",
  description: "BSc Final Year Project",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50"><CartProvider>
        <SessionManager />
          {children}
        </CartProvider></body>
    </html>
  );
}