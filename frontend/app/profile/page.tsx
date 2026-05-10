"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit2, 
  Save, 
  X,
  Camera,
  ShoppingBag,
  Package,
  TrendingUp,
  Shield,
  LogOut,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  ArrowLeft
} from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  role: "ADMIN" | "FARMER" | "BUYER";
  is_suspended: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    orders: number;
    cartItems: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Form data for editing
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          router.replace("/login");
          return;
        }
        
        const user = JSON.parse(userStr);
        
        // Fetch full profile from backend
        const response = await api.get("/auth/profile");
        const profileData = response.data.data;
        
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          phone: profileData.phone || "",
          location: profileData.location || "",
        });
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        if (error.response?.status === 401) {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await api.put("/auth/profile", formData);
      setProfile(response.data.data);
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }
    
    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setMessage({ type: "success", text: "Password changed successfully!" });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to change password" });
    } finally {
      setChangingPassword(false);
    }
  };

  const getDashboardLink = () => {
    if (!profile) return "/login";
    switch (profile.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "FARMER":
        return "/farmer/dashboard";
      case "BUYER":
        return "/buyer/dashboard";
      default:
        return "/dashboard";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const getRoleBadge = () => {
    switch (profile.role) {
      case "ADMIN":
        return { color: "bg-purple-100 text-purple-700", icon: Shield, label: "Administrator" };
      case "FARMER":
        return { color: "bg-green-100 text-green-700", icon: Package, label: "Farmer" };
      case "BUYER":
        return { color: "bg-blue-100 text-blue-700", icon: ShoppingBag, label: "Buyer" };
      default:
        return { color: "bg-gray-100 text-gray-700", icon: User, label: "Member" };
    }
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex justify-between items-center">
          <div>
            {/* Back to Dashboard Button */}
            <Link 
              href={getDashboardLink()}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-green-600 mb-4 transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-black text-slate-900">My Profile</h1>
            <p className="text-slate-500 mt-1">Manage your account information and preferences</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-8">
              {/* Cover Image */}
              <div className="h-24 bg-gradient-to-r from-green-600 to-emerald-600" />
              
              {/* Avatar */}
              <div className="relative px-6 pb-6">
                <div className="relative -mt-12 mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-4 border-white">
                    <span className="text-3xl font-black text-white">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-1/2 translate-x-12 bg-white rounded-full p-1.5 shadow-md hover:bg-slate-50 transition-colors">
                    <Camera size={16} className="text-slate-500" />
                  </button>
                </div>
                
                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-900">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{profile.email}</p>
                  <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    <RoleIcon size={12} />
                    {roleBadge.label}
                  </div>
                </div>
              </div>
              
              {/* Stats for Farmer/Buyer */}
              {profile.role !== "ADMIN" && (
                <div className="border-t border-slate-100 px-6 py-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Activity Summary</h3>
                  <div className="space-y-3">
                    {profile.role === "FARMER" && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Products Listed</span>
                        <span className="font-bold text-slate-900">{profile._count?.products || 0}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Total Orders</span>
                      <span className="font-bold text-slate-900">{profile._count?.orders || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Member Since</span>
                      <span className="font-bold text-slate-900">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Lock size={16} />
                    <span className="font-medium">Change Password</span>
                  </button>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                    >
                      <Edit2 size={16} />
                      <span className="font-medium">Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span>{saving ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <User size={14} className="inline mr-1" /> First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-700">{profile.first_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <User size={14} className="inline mr-1" /> Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-700">{profile.last_name}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Mail size={14} className="inline mr-1" /> Email Address
                  </label>
                  <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-700">{profile.email}</p>
                  <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Phone size={14} className="inline mr-1" /> Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-700">
                      {profile.phone || "Not provided"}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <MapPin size={14} className="inline mr-1" /> Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="City, Region"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-700">
                      {profile.location || "Not provided"}
                    </p>
                  )}
                </div>

                {/* Member Since */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Calendar size={14} className="inline mr-1" /> Member Since
                  </label>
                  <p className="px-4 py-2.5 bg-slate-50 rounded-xl text-slate-700">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Specific Sections */}
            {profile.role === "FARMER" && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Farm Information</h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Farm Name</label>
                    <input
                      type="text"
                      placeholder="Your farm name"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Farm Size (hectares)</label>
                    <input
                      type="number"
                      placeholder="Farm size"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                  Save Farm Info
                </button>
              </div>
            )}

            {profile.role === "BUYER" && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Shipping Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Default Shipping Address</label>
                    <textarea
                      rows={3}
                      placeholder="Enter your default shipping address"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                    Save Shipping Info
                  </button>
                </div>
              </div>
            )}

            {profile.role === "ADMIN" && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Admin Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">Admin Privileges</p>
                      <p className="text-sm text-slate-500">Full access to all admin features</p>
                    </div>
                    <Shield size={24} className="text-purple-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-500">Add an extra layer of security</p>
                    </div>
                    <button className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                >
                  {changingPassword ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}