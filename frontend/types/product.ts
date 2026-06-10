// ============================================
// PRODUCT TYPES
// ============================================

export interface MarketPrice {
  id?: number;
  price: number;
  recordedAt: string;
  productId?: number;
}

export interface Prediction {
  id?: number;
  predictedPrice: number;
  createdAt: string;
  productId?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Farmer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  unit?: string;
  location?: string;
  image?: string;
  images?: string[];
  categoryId?: number;
  category?: Category;
  farmerId?: number;
  farmer?: Farmer;
  is_verified?: boolean;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  marketPrices?: MarketPrice[];
  predictions?: Prediction[];
}

// ============================================
// ADMIN DASHBOARD TYPES
// ============================================

export interface PendingProduct extends Product {
  farmer?: {
    id: number;
    first_name: string;
    last_name: string;
    name?: string;  // For convenience (first_name + last_name)
    email: string;
  };
}

export interface AdminStats {
  userCount: number;
  productCount: number;
  revenue: number;
  pendingProductsCount?: number;
  verifiedProductsCount?: number;
}

// ============================================
// USER/AUTH TYPES
// ============================================

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  role: "ADMIN" | "FARMER" | "BUYER";
  is_suspended?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  password: string;
  role?: "FARMER" | "BUYER";
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// ============================================
// CART & ORDER TYPES
// ============================================

export interface CartItem {
  id: number;
  quantity: number;
  productId: number;
  product: Product;
  cartId: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  productId: number;
  product: Product;
  orderId: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  buyerId: number;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  shippingAddress?: string;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// PRICE TYPES
// ============================================

export interface PricePrediction {
  id: number;
  predictedPrice: number;
  confidence?: number;
  createdAt: string;
  productId: number;
}

export interface PriceHistory {
  id: number;
  price: number;
  recordedAt: string;
  source?: string;
  productId: number;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest";
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  data: Product[];
  count: number;
  total: number;
  page: number;
  totalPages: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  total?: number;
  page?: number;
  totalPages?: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================
// ASSISTANT/AI TYPES
// ============================================

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  query: string;
  context?: string[];
}

export interface ChatResponse {
  success: boolean;
  response: string;
  suggestions?: string[];
}

// ============================================
// PAYLOAD & REQUEST TYPES
// ============================================

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  unit?: string;
  location?: string;
  categoryId?: number;
  images?: string[];
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  is_verified?: boolean;
  is_active?: boolean;
}

export interface CreateOrderPayload {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  shippingAddress?: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  password?: string;
}