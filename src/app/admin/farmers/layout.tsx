
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgriCad - View Farmers",
  description: "Admin view for browsing farmer accounts",
};

export default function AdminFarmersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Children will be rendered within the parent AdminLayout's SidebarInset
}
