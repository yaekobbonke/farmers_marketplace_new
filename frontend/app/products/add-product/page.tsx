"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    unit: "kg",
    type: "CROP",
    farmerId: "1", // Hardcoded for demo; usually from Auth context
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/product/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Product listed successfully!");
        router.push("/products"); // Go back to marketplace
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-black mb-6">List New Crop</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">Crop Name</label>
          <input 
            type="text" 
            className="w-full p-3 border rounded-xl"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Organic White Wheat"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Price (per unit)</label>
            <input 
              type="number" 
              className="w-full p-3 border rounded-xl"
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Quantity</label>
            <input 
              type="number" 
              className="w-full p-3 border rounded-xl"
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              required
            />
          </div>
        </div>
        <button 
          type="submit" 
          className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
        >
          Post to Marketplace
        </button>
      </form>
    </div>
  );
}