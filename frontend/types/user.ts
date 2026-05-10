// D:\myapps\farmers-marketplace\frontend\types\user.ts

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  role: "ADMIN" | "FARMER" | "BUYER";
  is_suspended: boolean;
  createdAt: string;
  updatedAt?: string;
  // ✅ Add _count property for activity metrics
  _count?: {
    products: number;
    orders: number;
    cartItems?: number;
  };
}