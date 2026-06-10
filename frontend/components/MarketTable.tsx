"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface MarketPrice {
  id: number;
  productName: string;
  price: number;
  location: string;
  recordedAt: string;
}

export default function MarketTable() {
  const [data, setData] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===============================
  // DATE FORMATTER
  // ===============================
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ===============================
  // NORMALIZE PRODUCT NAME
  // ===============================
  const getProductName = (item: any) => {
    return (
      item.productName ??
      item.product?.name ??
      item.product_name ??
      item.commodity ??
      item.name ??
      "Unknown Product"
    );
  };

  // ===============================
  // FETCH DATA
  // ===============================
  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/prices/latest");

      console.log("RAW API:", res.data);

      const raw =
        Array.isArray(res.data)
          ? res.data
          : res.data?.data
          ? res.data.data
          : res.data?.prices
          ? res.data.prices
          : [];

      const transformed: MarketPrice[] = raw.map((item: any, i: number) => {
        const mapped = {
          id: item.id ?? i + 1,

          productName: getProductName(item),

          price: Number(item.price ?? 0),

          location:
            item.location ??
            item.market ??
            item.region ??
            "Unknown",

          recordedAt:
            item.recordedAt ??
            item.createdAt ??
            item.date ??
            new Date().toISOString(),
        };

        console.log("Mapped Item:", mapped);
        return mapped;
      });

      setData(transformed);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load data");

      setData([
        {
          id: 1,
          productName: "Teff",
          price: 45,
          location: "Addis Ababa",
          recordedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // ===============================
  // UI
  // ===============================
  if (loading && data.length === 0) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-left">Price</th>
            <th className="p-2 text-left">Location</th>
            <th className="p-2 text-left">Date</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-2">{item.productName}</td>
              <td className="p-2">{item.price}</td>
              <td className="p-2">{item.location}</td>
              <td className="p-2">{formatDate(item.recordedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}