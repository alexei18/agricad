
import type { Metadata } from "next";
import Link from 'next/link'; // Use standard Link
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Map, BarChart2, LogOut } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";
import { getFarmerById } from "@/services/farmers"; // Service to fetch farmer data
import { unstable_noStore as noStore } from 'next/cache';

// TODO: Replace with actual mechanism to get current farmer's ID
const currentFarmerId = "farmer1"; // Placeholder - REPLACE THIS WITH ACTUAL AUTH LOGIC

// Function to generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
    noStore();
    let farmerName = "Agricultor"; // Default
    try {
        const farmer = await getFarmerById(currentFarmerId);
        if (farmer) {
            farmerName = farmer.name;
        }
    } catch (error) {
        console.error("[FarmerLayout Metadata] Failed to fetch farmer name:", error);
    }

  return {
    title: `AgriCad - Agricultor (${farmerName})`,
    description: "Panou de control pentru agricultori AgriCad",
  };
}


export default async function FarmerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
   noStore();
   // Hardcoded Romanian strings
   const t = {
        sidebarTitle: "AgriCad",
        dashboard: "Panou Principal",
        parcelMap: "Harta Parcelelor",
        villageStats: "Statistici Sat",
        backToHome: "Deconectează-te",
        headerTitle: "Panou Agricultor",
   };

   let farmerName = "Agricultor"; // Default
    try {
        const farmer = await getFarmerById(currentFarmerId);
        if (farmer) {
            farmerName = farmer.name;
        }
    } catch (error) {
        console.error("[FarmerLayout] Failed to fetch farmer name:", error);
    }

  return (
     <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">{t.sidebarTitle}</span>
                 </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/farmer/dashboard" className="w-full">
                            <SidebarMenuButton tooltip={t.dashboard}>
                                <LayoutDashboard />
                                <span>{t.dashboard}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                         <Link href="/farmer/map" className="w-full">
                            <SidebarMenuButton tooltip={t.parcelMap}>
                                <Map />
                                <span>{t.parcelMap}</span>
                            </SidebarMenuButton>
                         </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                         <Link href="/farmer/stats" className="w-full">
                            <SidebarMenuButton tooltip={t.villageStats}>
                                <BarChart2 />
                                <span>{t.villageStats}</span>
                            </SidebarMenuButton>
                         </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
             <SidebarFooter>
                 <SidebarMenu>
                    <SidebarMenuItem>
                         {/* TODO: Implement actual Logout functionality */}
                        <Link href="/" className="w-full">
                            <SidebarMenuButton tooltip={t.backToHome}>
                                <LogOut />
                                <span>{t.backToHome}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
         <SidebarInset>
             <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 gap-4">
                 <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-xl font-semibold text-primary">{t.headerTitle}</h1>
                 </div>
                  {/* Placeholder for User menu/language switcher */}
                  {/* <UserMenu user={{ name: farmerName }} /> */}
             </header>
            {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
