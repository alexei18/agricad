
import type { Metadata } from "next";
import { getFarmerById } from "@/services/farmers"; // Service to fetch farmer data
import { unstable_noStore as noStore } from 'next/cache';

// TODO: Replace with actual mechanism to get current farmer's ID
const currentFarmerId = "farmer1"; // Placeholder - REPLACE THIS WITH ACTUAL AUTH LOGIC

export async function generateMetadata(): Promise<Metadata> {
    noStore();
    let villageName = "Satul Meu"; // Default
    try {
        const farmer = await getFarmerById(currentFarmerId);
        if (farmer) {
            villageName = farmer.village;
        }
    } catch (error) {
        console.error("[FarmerStatsLayout Metadata] Failed to fetch farmer village:", error);
    }

    return {
      title: `AgriCad - Statistici Sat (${villageName})`, // Dynamic title
      description: `Vizualizează statisticile satului ${villageName}`, // Dynamic description
    };
}

export default function FarmerStatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Rendered within FarmerLayout
}
