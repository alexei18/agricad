
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgriCad - System Logs",
  description: "View system activity logs",
};

export default function AdminLogsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Rendered within AdminLayout
}
