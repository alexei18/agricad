
import type { Metadata } from "next";
import { unstable_noStore as noStore } from 'next/cache';

// Although this inherits the main FarmerLayout, defining it ensures
// correct structure and allows for potential future map-specific layout adjustments.

export async function generateMetadata(): Promise<Metadata> {
    noStore(); // Ensure metadata is dynamic
    return {
      title: "AgriCad - Harta Parcelelor", // Romanian Title
      description: "Vizualizați parcelele pe hartă", // Romanian Description
    };
}

export default function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Children will be rendered within the parent FarmerLayout's SidebarInset
}
