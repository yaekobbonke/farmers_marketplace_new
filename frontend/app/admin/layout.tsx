import AdminSidebar from "@/components/admin/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSidebar>
      {children}
    </AdminSidebar>
  );
}