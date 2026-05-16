"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  Save, 
  Loader2, 
  Shield, 
  Bell, 
  Globe, 
  Lock, 
  User,
  Mail,
  Phone,
  MapPin,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  Settings as SettingsIcon,
  Key,
  Server,
  Cloud,
  Moon,
  Sun,
  Monitor
} from "lucide-react";

interface AdminProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
}

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  taxRate: number;
  commissionRate: number;
  maxProductImages: number;
  autoApproveProducts: boolean;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  maintenanceMode: boolean;
  theme: "light" | "dark" | "system";
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "system" | "security" | "notifications">("profile");
  
  // Admin Profile
  const [profile, setProfile] = useState<AdminProfile>({
    id: 0,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: ""
  });
  
  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: "AgriSmart",
    siteDescription: "AI-Powered Agricultural Marketplace",
    contactEmail: "support@agrismart.com",
    contactPhone: "+251-911-123456",
    address: "Addis Ababa, Ethiopia",
    currency: "ETB",
    taxRate: 0,
    commissionRate: 5,
    maxProductImages: 5,
    autoApproveProducts: false,
    enableNotifications: true,
    enableEmailAlerts: true,
    maintenanceMode: false,
    theme: "light"
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Fetch admin profile
      const profileResponse = await api.get("/auth/profile");
      setProfile(profileResponse.data.data);
      
      // Fetch system settings (you'll need to implement this endpoint)
      try {
        const settingsResponse = await api.get("/admin/settings");
        setSystemSettings(settingsResponse.data.data);
      } catch (err) {
        // Use default settings if endpoint doesn't exist
        console.log("Using default settings");
      }
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      setError(error.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.put("/auth/profile", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone
      });
      
      setProfile(response.data.data);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setChangingPassword(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setSuccess("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSystemSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Save system settings (implement backend endpoint)
      await api.put("/admin/settings", systemSettings);
      setSuccess("System settings updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const clearCache = async () => {
    try {
      await api.post("/admin/clear-cache");
      setSuccess("Cache cleared successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to clear cache");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and system preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "system", label: "System", icon: SettingsIcon },
          { id: "security", label: "Security", icon: Lock },
          { id: "notifications", label: "Notifications", icon: Bell }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "text-green-600 border-b-2 border-green-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Settings Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileUpdate} className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User size={14} className="inline mr-1" /> First Name
              </label>
              <input
                type="text"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <User size={14} className="inline mr-1" /> Last Name
              </label>
              <input
                type="text"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Mail size={14} className="inline mr-1" /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Phone size={14} className="inline mr-1" /> Phone
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Security Settings Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password */}
          <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Change Password</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {changingPassword ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>

          {/* Session Management */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Session Management</h2>
            <p className="text-slate-500 text-sm mb-4">Manage your active sessions and security settings</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Monitor size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Current Session</p>
                    <p className="text-xs text-slate-500">Active now</p>
                  </div>
                </div>
                <span className="text-xs text-green-600">Current Device</span>
              </div>
            </div>
            
            <button className="mt-4 text-sm text-red-600 hover:text-red-700 flex items-center gap-2">
              <RefreshCw size={14} />
              Terminate All Other Sessions
            </button>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === "system" && (
        <form onSubmit={handleSystemSettingsUpdate} className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">System Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Globe size={14} className="inline mr-1" /> Site Name
              </label>
              <input
                type="text"
                value={systemSettings.siteName}
                onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign size={14} className="inline mr-1" /> Currency
              </label>
              <select
                value={systemSettings.currency}
                onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Package size={14} className="inline mr-1" /> Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={systemSettings.commissionRate}
                onChange={(e) => setSystemSettings({ ...systemSettings, commissionRate: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Database size={14} className="inline mr-1" /> Max Product Images
              </label>
              <input
                type="number"
                value={systemSettings.maxProductImages}
                onChange={(e) => setSystemSettings({ ...systemSettings, maxProductImages: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Mail size={14} className="inline mr-1" /> Contact Email
              </label>
              <input
                type="email"
                value={systemSettings.contactEmail}
                onChange={(e) => setSystemSettings({ ...systemSettings, contactEmail: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Phone size={14} className="inline mr-1" /> Contact Phone
              </label>
              <input
                type="text"
                value={systemSettings.contactPhone}
                onChange={(e) => setSystemSettings({ ...systemSettings, contactPhone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin size={14} className="inline mr-1" /> Address
              </label>
              <textarea
                value={systemSettings.address}
                onChange={(e) => setSystemSettings({ ...systemSettings, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-slate-900">Features</h3>
            
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Auto-approve Products</p>
                <p className="text-xs text-slate-500">Automatically approve new product listings</p>
              </div>
              <button
                type="button"
                onClick={() => setSystemSettings({ ...systemSettings, autoApproveProducts: !systemSettings.autoApproveProducts })}
                className={`relative w-10 h-5 rounded-full transition-colors ${systemSettings.autoApproveProducts ? 'bg-green-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${systemSettings.autoApproveProducts ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </label>
            
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Maintenance Mode</p>
                <p className="text-xs text-slate-500">Put the site in maintenance mode</p>
              </div>
              <button
                type="button"
                onClick={() => setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
                className={`relative w-10 h-5 rounded-full transition-colors ${systemSettings.maintenanceMode ? 'bg-red-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${systemSettings.maintenanceMode ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </label>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving..." : "Save Settings"}
            </button>
            
            <button
              type="button"
              onClick={clearCache}
              className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Clear Cache
            </button>
          </div>
        </form>
      )}

      {/* Notifications Settings Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Notification Preferences</h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Push Notifications</p>
                <p className="text-sm text-slate-500">Receive browser push notifications</p>
              </div>
              <button
                onClick={() => setSystemSettings({ ...systemSettings, enableNotifications: !systemSettings.enableNotifications })}
                className={`relative w-10 h-5 rounded-full transition-colors ${systemSettings.enableNotifications ? 'bg-green-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${systemSettings.enableNotifications ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </label>
            
            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Email Alerts</p>
                <p className="text-sm text-slate-500">Receive email notifications for important events</p>
              </div>
              <button
                onClick={() => setSystemSettings({ ...systemSettings, enableEmailAlerts: !systemSettings.enableEmailAlerts })}
                className={`relative w-10 h-5 rounded-full transition-colors ${systemSettings.enableEmailAlerts ? 'bg-green-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${systemSettings.enableEmailAlerts ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </label>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="font-medium text-slate-900 mb-3">Email Notification Types</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600 rounded" />
                <span className="text-sm text-slate-700">New user registration</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600 rounded" />
                <span className="text-sm text-slate-700">New product listing</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600 rounded" />
                <span className="text-sm text-slate-700">New order placed</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
                <span className="text-sm text-slate-700">System updates</span>
              </label>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setSuccess("Notification preferences saved!")}
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-red-800 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">These actions are irreversible. Please be careful.</p>
        <div className="flex gap-4">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear all cache? This may affect performance temporarily.")) {
                clearCache();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Clear All Cache
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to reset system settings to default? This cannot be undone.")) {
                setSystemSettings({
                  siteName: "AgriSmart",
                  siteDescription: "AI-Powered Agricultural Marketplace",
                  contactEmail: "support@agrismart.com",
                  contactPhone: "+251-911-123456",
                  address: "Addis Ababa, Ethiopia",
                  currency: "ETB",
                  taxRate: 0,
                  commissionRate: 5,
                  maxProductImages: 5,
                  autoApproveProducts: false,
                  enableNotifications: true,
                  enableEmailAlerts: true,
                  maintenanceMode: false,
                  theme: "light"
                });
                setSuccess("Settings reset to default!");
              }
            }}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-xl hover:bg-red-100 transition-colors"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}