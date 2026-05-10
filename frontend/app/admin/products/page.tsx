"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  Package, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye,
  Loader2,
  Filter,
  Clock,
  User,
  MapPin,
  DollarSign,
  RefreshCw
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  location: string;
  is_verified: boolean;
  is_active: boolean;
  createdAt: string;
  farmer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    location: string;
  };
  category: {
    id: number;
    name: string;
  };
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("pending");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/product/admin/all");
      setProducts(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      if (error.response?.status === 403) {
        alert("Admin access required");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (productId: number) => {
    setVerifyingId(productId);
    try {
      await api.patch(`/admin/products/${productId}/verify`);
      // Update product status in local state
      setProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, is_verified: true } : p
        )
      );
    } catch (error: any) {
      console.error("Error verifying product:", error);
      alert(error.response?.data?.message || "Failed to verify product");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleReject = async (productId: number) => {
    if (!confirm("Are you sure you want to reject this product?")) return;
    
    setVerifyingId(productId);
    try {
      await api.delete(`/admin/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      console.error("Error rejecting product:", error);
      alert(error.response?.data?.message || "Failed to reject product");
    } finally {
      setVerifyingId(null);
    }
  };

  const viewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const filteredProducts = products.filter(product => {
    // Filter by verification status
    if (filter === "pending" && product.is_verified) return false;
    if (filter === "verified" && !product.is_verified) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.farmer.first_name.toLowerCase().includes(searchLower) ||
        product.farmer.last_name.toLowerCase().includes(searchLower) ||
        product.category?.name.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const pendingCount = products.filter(p => !p.is_verified).length;
  const verifiedCount = products.filter(p => p.is_verified).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Product Management</h1>
          <p className="text-slate-500 mt-1">Review and verify farmer product listings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Products</p>
                <p className="text-3xl font-bold text-slate-900">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Pending Verification</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Verified Products</p>
                <p className="text-3xl font-bold text-green-600">{verifiedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by product name, farmer name, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filter === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("verified")}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filter === "verified"
                    ? "bg-green-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filter === "all"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={fetchProducts}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Farmer</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Price</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Location</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <Package size={48} className="mx-auto mb-3 opacity-30" />
                      <p>No products found</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {product.description?.substring(0, 60)}...
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {product.category?.name || "Uncategorized"}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                            {product.farmer.first_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {product.farmer.first_name} {product.farmer.last_name}
                            </p>
                            <p className="text-xs text-slate-500">{product.farmer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-green-600">
                          {product.price.toLocaleString()} ETB
                        </span>
                        <p className="text-xs text-slate-500">per {product.unit}</p>
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${product.quantity < 10 ? "text-red-600" : "text-slate-700"}`}>
                          {product.quantity} {product.unit}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin size={14} />
                          {product.location || product.farmer.location || "Unknown"}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                          product.is_verified
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {product.is_verified ? (
                            <><CheckCircle size={12} /> Verified</>
                          ) : (
                            <><Clock size={12} /> Pending</>
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewProductDetails(product)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {!product.is_verified && (
                            <>
                              <button
                                onClick={() => handleVerify(product.id)}
                                disabled={verifyingId === product.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                {verifyingId === product.id ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={18} />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(product.id)}
                                disabled={verifyingId === product.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Product Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Product Name</label>
                <p className="text-lg font-bold text-slate-900">{selectedProduct.name}</p>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                <p className="text-slate-600">{selectedProduct.description || "No description"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Price</label>
                  <p className="text-xl font-bold text-green-600">{selectedProduct.price} ETB</p>
                  <p className="text-xs text-slate-500">per {selectedProduct.unit}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Stock</label>
                  <p className="text-xl font-bold text-slate-900">{selectedProduct.quantity}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Farmer Information</label>
                <div className="mt-2 p-3 bg-slate-50 rounded-xl">
                  <p className="font-medium">{selectedProduct.farmer.first_name} {selectedProduct.farmer.last_name}</p>
                  <p className="text-sm text-slate-500">{selectedProduct.farmer.email}</p>
                  <p className="text-sm text-slate-500">{selectedProduct.farmer.location || "No location"}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                <p className="text-slate-600">{selectedProduct.location || "Not specified"}</p>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Submitted On</label>
                <p>{new Date(selectedProduct.createdAt).toLocaleString()}</p>
              </div>
              
              {!selectedProduct.is_verified && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      handleVerify(selectedProduct.id);
                      setShowModal(false);
                    }}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                    Approve Product
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedProduct.id);
                      setShowModal(false);
                    }}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    Reject Product
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}