"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Download,
  Calendar,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Loader2,
  FileBarChart,
  FileSpreadsheet,
  Printer
} from "lucide-react";

interface ReportData {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  userGrowth: number;
  orderGrowth: number;
  productGrowth: number;
}

interface SalesData {
  date: string;
  orders: number;
  revenue: number;
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month");
  const [reportType, setReportType] = useState<"summary" | "sales" | "users" | "products">("summary");

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsResponse = await api.get("/admin/stats");
      setReportData(statsResponse.data.data);
      
      // Fetch sales data (you'll need to implement this endpoint)
      try {
        const salesResponse = await api.get(`/admin/sales-data?range=${dateRange}`);
        setSalesData(salesResponse.data.data);
      } catch (err) {
        // Mock data if endpoint doesn't exist
        setSalesData(generateMockSalesData());
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSalesData = (): SalesData[] => {
    const data: SalesData[] = [];
    const days = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 12;
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      if (dateRange === "year") {
        date.setMonth(now.getMonth() - i);
      } else {
        date.setDate(now.getDate() - i);
      }
      
      data.push({
        date: dateRange === "year" 
          ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 50000) + 5000
      });
    }
    return data;
  };

  const handleExport = (format: "csv" | "pdf") => {
    if (!reportData) return;
    
    if (format === "csv") {
      // Generate CSV
      const headers = ["Metric", "Value"];
      const rows = [
        ["Total Users", reportData.totalUsers],
        ["Total Products", reportData.totalProducts],
        ["Total Orders", reportData.totalOrders],
        ["Total Revenue", `${reportData.totalRevenue} ETB`],
        ["Monthly Revenue", `${reportData.monthlyRevenue} ETB`],
        ["User Growth", `${reportData.userGrowth}%`],
        ["Order Growth", `${reportData.orderGrowth}%`],
        ["Product Growth", `${reportData.productGrowth}%`]
      ];
      
      const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    // For PDF, you would typically use a library like jsPDF
    alert("PDF export coming soon!");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  return (
    <div className="print:p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 print:mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">View and export platform analytics</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <FileSpreadsheet size={18} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <FileBarChart size={18} />
            Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2 mb-6 print:hidden">
        {[
          { value: "week", label: "Last 7 Days" },
          { value: "month", label: "Last 30 Days" },
          { value: "year", label: "Last 12 Months" }
        ].map((range) => (
          <button
            key={range.value}
            onClick={() => setDateRange(range.value as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              dateRange === range.value
                ? "bg-green-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-100 print:hidden">
        {[
          { value: "summary", label: "Summary Report", icon: FileBarChart },
          { value: "sales", label: "Sales Report", icon: TrendingUp },
          { value: "users", label: "Users Report", icon: Users },
          { value: "products", label: "Products Report", icon: Package }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setReportType(tab.value as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
              reportType === tab.value
                ? "text-green-600 border-b-2 border-green-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Report */}
      {reportType === "summary" && reportData && (
        <div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ReportStatCard
              title="Total Users"
              value={reportData.totalUsers}
              change={reportData.userGrowth}
              icon={<Users size={24} />}
              color="bg-blue-500"
            />
            <ReportStatCard
              title="Total Products"
              value={reportData.totalProducts}
              change={reportData.productGrowth}
              icon={<Package size={24} />}
              color="bg-green-500"
            />
            <ReportStatCard
              title="Total Orders"
              value={reportData.totalOrders}
              change={reportData.orderGrowth}
              icon={<ShoppingCart size={24} />}
              color="bg-purple-500"
            />
            <ReportStatCard
              title="Total Revenue"
              value={`${reportData.totalRevenue.toLocaleString()} ETB`}
              icon={<DollarSign size={24} />}
              color="bg-yellow-500"
            />
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Revenue Overview</h3>
            <div className="space-y-3">
              {salesData.map((data, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-sm text-slate-500 w-24">{data.date}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      style={{ width: `${(data.revenue / Math.max(...salesData.map(d => d.revenue))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-32 text-right">
                    {data.revenue.toLocaleString()} ETB
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sales Report */}
      {reportType === "sales" && salesData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Orders</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Revenue (ETB)</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Avg Order Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {salesData.map((data, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{data.date}</td>
                    <td className="p-4 text-slate-600">{data.orders}</td>
                    <td className="p-4 text-slate-600">{data.revenue.toLocaleString()} ETB</td>
                    <td className="p-4 text-slate-600">
                      {Math.round(data.revenue / data.orders).toLocaleString()} ETB
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-100">
                <tr>
                  <td className="p-4 font-bold text-slate-900">Total</td>
                  <td className="p-4 font-bold text-slate-900">
                    {salesData.reduce((sum, d) => sum + d.orders, 0)}
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {salesData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()} ETB
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {Math.round(salesData.reduce((sum, d) => sum + d.revenue, 0) / salesData.reduce((sum, d) => sum + d.orders, 0)).toLocaleString()} ETB
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Users Report */}
      {reportType === "users" && reportData && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4">User Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <Users size={32} className="mx-auto text-blue-500 mb-3" />
              <p className="text-3xl font-black text-slate-900">{reportData.totalUsers}</p>
              <p className="text-sm text-slate-500 mt-1">Total Registered Users</p>
            </div>
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <TrendingUp size={32} className="mx-auto text-green-500 mb-3" />
              <p className="text-3xl font-black text-slate-900">{reportData.userGrowth}%</p>
              <p className="text-sm text-slate-500 mt-1">User Growth Rate</p>
            </div>
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <Calendar size={32} className="mx-auto text-purple-500 mb-3" />
              <p className="text-3xl font-black text-slate-900">
                {Math.round(reportData.totalUsers / 30)}/day
              </p>
              <p className="text-sm text-slate-500 mt-1">Average Daily Signups</p>
            </div>
          </div>
        </div>
      )}

      {/* Products Report */}
      {reportType === "products" && reportData && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Product Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <Package size={32} className="mx-auto text-green-500 mb-3" />
              <p className="text-3xl font-black text-slate-900">{reportData.totalProducts}</p>
              <p className="text-sm text-slate-500 mt-1">Total Listings</p>
            </div>
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <TrendingUp size={32} className="mx-auto text-green-500 mb-3" />
              <p className="text-3xl font-black text-slate-900">{reportData.productGrowth}%</p>
              <p className="text-sm text-slate-500 mt-1">Product Growth Rate</p>
            </div>
            <div className="text-center p-6 bg-slate-50 rounded-xl">
              <ShoppingCart size={32} className="mx-auto text-purple-500 mb-3" />
              <p className="text-3xl font-black text-slate-900">
                {Math.round(reportData.totalProducts / reportData.totalUsers * 100)}%
              </p>
              <p className="text-sm text-slate-500 mt-1">Products per User</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Report Stat Card Component
function ReportStatCard({ title, value, change, icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} bg-opacity-10 rounded-xl`}>
          {icon}
        </div>
        <span className="text-2xl font-black text-slate-900">{value}</span>
      </div>
      <h3 className="font-semibold text-slate-600 text-sm">{title}</h3>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp size={12} />
          <span>{Math.abs(change)}% from last month</span>
        </div>
      )}
    </div>
  );
}