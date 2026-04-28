"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; 
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("auth/login", { email, password });
      // Destructure user and token from your API response
      const { token, user } = response.data.data;

      // 1. Store session in localStorage
      // Storing the whole user object as a string is often easier for the Sidebar to read
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); 
      localStorage.setItem("userRole", user.role); 

      // 2. Redirect based on Role (Matches your Enum roles)
      const role = user.role.toUpperCase(); // Ensure case-insensitive comparison

      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (role === "FARMER") {
        router.push("/dashboard");
      } else {
        // Fallback for TRADER or BUYER
        router.push("/products");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">AgriSmart</h2>
          <p className="mt-2 text-sm text-gray-600">
            Login to access your agricultural insights
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-center text-red-700 rounded-lg">
            <AlertCircle className="mr-2 shrink-0" size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}