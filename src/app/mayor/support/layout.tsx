
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
        console.error("[MayorSupportLayout Metadata] Failed to fetch mayor village:", error);
    }

    return {
        title: `AgriCad - Suport (${villageName})`, // Dynamic title
        description: `Resurse de suport pentru primarul din ${villageName}`, // Dynamic description
    };
}

export default function MayorSupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>; // Rendered within the parent MayorLayout's SidebarInset
}
