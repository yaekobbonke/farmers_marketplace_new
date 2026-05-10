"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  Search, 
  MoreVertical, 
  Loader2, 
  Trash2, 
  Shield, 
  ShieldAlert, 
  X, 
  Check,
  UserCog,
  Crown,
  UserX
} from "lucide-react";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_suspended: boolean;
  createdAt: string;
  _count?: {
    products: number;
    orders: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showMenuFor, setShowMenuFor] = useState<number | null>(null);
  const [updatingRole, setUpdatingRole] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingRole(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      alert(`User role updated to ${newRole}`);
    } catch (error: any) {
      console.error("Error updating role:", error);
      alert(error.response?.data?.message || "Failed to update user role");
    } finally {
      setUpdatingRole(null);
      setShowMenuFor(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
      alert("User deleted successfully");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(error.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
      setShowMenuFor(null);
    }
  };

  const handleSuspendToggle = async (user: User) => {
    try {
      await api.patch(`/admin/users/${user.id}/suspend`, { isSuspended: !user.is_suspended });
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, is_suspended: !u.is_suspended } : u
      ));
      setShowMenuFor(null);
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      alert(error.response?.data?.message || "Failed to update user status");
    }
  };

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(search.toLowerCase()) ||
    user.last_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return { color: "bg-purple-100 text-purple-700", icon: Crown, label: "Admin" };
      case "FARMER":
        return { color: "bg-green-100 text-green-700", icon: Shield, label: "Farmer" };
      default:
        return { color: "bg-blue-100 text-blue-700", icon: Shield, label: "Buyer" };
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
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage users and their roles on the platform</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none w-80"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">User</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Activity</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                const RoleIcon = roleBadge.icon;
                
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${roleBadge.color}`}>
                        <RoleIcon size={12} />
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${
                        user.is_suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {user.is_suspended ? <ShieldAlert size={12} /> : <Shield size={12} />}
                        {user.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {user.role === 'FARMER' && (
                          <p className="text-slate-600">Products: {user._count?.products || 0}</p>
                        )}
                        {user.role === 'BUYER' && (
                          <p className="text-slate-600">Orders: {user._count?.orders || 0}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowMenuFor(showMenuFor === user.id ? null : user.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={18} className="text-slate-400" />
                        </button>
                        
                        {showMenuFor === user.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 z-10 overflow-hidden">
                            {/* Role Management Section */}
                            <div className="p-2 border-b border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                                <UserCog size={12} className="inline mr-1" /> Change Role
                              </p>
                              <div className="space-y-1">
                                {user.role !== "ADMIN" && (
                                  <button
                                    onClick={() => handleRoleChange(user.id, "ADMIN")}
                                    disabled={updatingRole === user.id}
                                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  >
                                    <Crown size={14} />
                                    Promote to Admin
                                  </button>
                                )}
                                {user.role !== "FARMER" && user.role !== "ADMIN" && (
                                  <button
                                    onClick={() => handleRoleChange(user.id, "FARMER")}
                                    disabled={updatingRole === user.id}
                                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  >
                                    <Shield size={14} />
                                    Make Farmer
                                  </button>
                                )}
                                {user.role !== "BUYER" && user.role !== "ADMIN" && (
                                  <button
                                    onClick={() => handleRoleChange(user.id, "BUYER")}
                                    disabled={updatingRole === user.id}
                                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Shield size={14} />
                                    Make Buyer
                                  </button>
                                )}
                                {user.role === "ADMIN" && (
                                  <button
                                    onClick={() => handleRoleChange(user.id, "FARMER")}
                                    disabled={updatingRole === user.id}
                                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  >
                                    <UserX size={14} />
                                    Demote from Admin
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="p-2">
                              <button
                                onClick={() => {
                                  handleSuspendToggle(user);
                                  setShowMenuFor(null);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-colors ${
                                  user.is_suspended ? 'text-green-600' : 'text-yellow-600'
                                }`}
                              >
                                {user.is_suspended ? <Check size={14} /> : <ShieldAlert size={14} />}
                                {user.is_suspended ? 'Activate User' : 'Suspend User'}
                              </button>
                              
                              {user.role !== 'ADMIN' && (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeleteModal(true);
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} />
                                  Delete User
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete User</h3>
            </div>
            
            <p className="text-slate-600 mb-2">
              Are you sure you want to delete <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action cannot be undone. All user data will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {deleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}