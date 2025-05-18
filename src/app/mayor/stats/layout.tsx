
import type { Metadata } from "next";
import { getMayorById } from '@/services/mayors'; // Service to fetch mayor data
import { unstable_noStore as noStore } from 'next/cache';

// TODO: Replace with actual mechanism to get current mayor's ID
const currentMayorId = "mayor1"; // Placeholder - REPLACE THIS WITH ACTUAL AUTH LOGIC

export async function generateMetadata(): Promise<Metadata> {
    noStore();
    let villageName = "Satul Meu"; // Default
    try {
        const mayor = await getMayorById(currentMayorId);
        if (mayor) {
            villageName = mayor.village;
        }
    } catch (error) {
        console.error("[MayorStatsLayout Metadata] Failed to fetch mayor village:", error);
    }

    return {
        title: `AgriCad - Statistici pentru ${villageName}`, // Dynamic title
        description: `Vizualizează statisticile satului pentru ${villageName}`, // Dynamic description
    };
}

export default function MayorStatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Rendered within the parent MayorLayout's SidebarInset
}
