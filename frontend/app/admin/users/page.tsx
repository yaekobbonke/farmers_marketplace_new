"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { UserCheck, UserMinus, Mail, ShieldAlert, Loader2, Search } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isSuspended: !currentStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: !currentStatus } : u));
    } catch (err) {
      alert("Action failed.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" size={40} /></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">User Management</h1>
          <p className="text-slate-500 font-medium">Monitor and manage access for Farmers and Traders.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full md:w-80 focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">User Details</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Activity</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map((user: any) => (
              <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1"><Mail size={12}/> {user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                    user.role === 'farmer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-6">
                  <p className="text-sm font-medium text-slate-700">
                    {user.role === 'farmer' ? `${user._count.products} Listings` : `${user._count.orders} Orders`}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => toggleStatus(user.id, user.is_suspended)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      user.is_suspended 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {user.is_suspended ? <ShieldAlert size={14}/> : <UserCheck size={14}/>}
                    {user.is_suspended ? "UNSUSPEND" : "SUSPEND USER"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}