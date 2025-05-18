
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgriCad - System Settings",
  description: "Admin configuration settings",
};

export default function AdminSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Rendered within AdminLayout
}
