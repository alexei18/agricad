
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgriCad - Global Statistics",
  description: "Admin view for global platform statistics",
};

export default function AdminStatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Rendered within AdminLayout
}
