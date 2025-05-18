
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgriCad - Manage Mayors",
  description: "Admin tools for managing mayor accounts and subscriptions",
};

export default function AdminMayorsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Rendered within the parent AdminLayout's SidebarInset
}
