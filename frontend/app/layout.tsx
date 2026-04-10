import "./globals.css";
import type { Metadata } from "next";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Metadata is a named export (correct)
export const metadata: Metadata = {
  title: "Farmers Hub | AI Price Intelligence",
  description: "BSc Final Year Project",
};

// This function MUST be 'export default'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Navbar />
        <MainLayoutWrapper>
          {children}
        </MainLayoutWrapper>
        <Footer />
      </body>
    </html>
  );
}