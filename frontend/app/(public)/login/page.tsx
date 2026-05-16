"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; 
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import Cookies from "js-cookie";

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
      console.log("Attempting login with email:", email);
      
      const response = await api.post("auth/login", { 
        email: email.trim().toLowerCase(), 
        password: password 
      });
      
      console.log("Login response:", response.data);
      
      const { token, user } = response.data.data;

      // Store session
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); 
      localStorage.setItem("userRole", user.role);

      // Store in cookies
      Cookies.set("token", token, { expires: 7, path: "/" });
      Cookies.set("user", JSON.stringify(user), { expires: 7, path: "/" });

      // Redirect based on role
      const role = user.role?.toUpperCase();

      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (role === "FARMER") {
        router.push("/farmer/dashboard");
      } else if (role === "BUYER") {
        router.push("/buyer/dashboard");
      } else {
        router.push("/marketplace");
      }
    } catch (err: any) {
      console.error("Login error details:", err);
      console.error("Response data:", err.response?.data);
      
      // Show user-friendly error message
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again or register a new account.");
      } else if (err.response?.status === 404) {
        setError("Login service not found. Please check if backend is running.");
      } else if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to server. Please make sure backend is running on port 5000.");
      } else {
        setError(err.response?.data?.message || "Login failed. Please try again.");
      }
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
                autoComplete="email"
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
                autoComplete="current-password"
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

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}