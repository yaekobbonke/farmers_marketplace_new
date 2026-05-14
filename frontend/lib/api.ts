import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://farmers-marketplace-twy3.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Make sure this is false
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    
    console.log("=== API Request ===");
    console.log("URL:", config.url);
    console.log("Token exists:", !!token);
    if (token) {
      console.log("Token preview:", token.substring(0, 30) + "...");
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("No token found in localStorage");
    }
    console.log("Headers:", config.headers);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`);
    console.error("Error details:", error.response?.data);
    return Promise.reject(error);
  }
);

export default api;