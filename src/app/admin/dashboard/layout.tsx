
import type { Metadata } from "next";
import Link from 'next/link'; // Use standard Link
import { Button } from '@/components/ui/button';
import { Home, Users, Shield, Upload, BarChartHorizontal, History, Settings, LogOut } from 'lucide-react';
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

// Static metadata in Romanian
export const metadata: Metadata = {
  title: "AgriCad - Admin",
  description: "Panou de administrare pentru AgriCad",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
   // Hardcoded Romanian strings
   const sidebarTitle = "AgriCad";
   const dashboard = "Panou Principal";
   const viewFarmers = "Vizualizare Agricultori";
   const manageMayors = "Gestionare Primari";
   const uploadParcels = "Încărcare Parcele";
   const globalStats = "Statistici Globale";
   const logs = "Jurnale";
   const settings = "Setări";
   const logout = "Deconectare";
   const headerTitle = "Panou Administrator";


  return (
     <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">{sidebarTitle}</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                         <Link href="/admin/dashboard" className="w-full">
                            <SidebarMenuButton tooltip={dashboard}>
                                <Home />
                                <span>{dashboard}</span>
                            </SidebarMenuButton>
                         </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                         <Link href="/admin/farmers" className="w-full">
                            <SidebarMenuButton tooltip={viewFarmers}>
                                <Users />
                                <span>{viewFarmers}</span>
                            </SidebarMenuButton>
                         </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                         <Link href="/admin/mayors" className="w-full">
                            <SidebarMenuButton tooltip={manageMayors}>
                                <Shield />
                                <span>{manageMayors}</span>
                            </SidebarMenuButton>
                         </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/admin/parcels" className="w-full">
                            <SidebarMenuButton tooltip={uploadParcels}>
                                <Upload />
                                <span>{uploadParcels}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/admin/stats" className="w-full">
                            <SidebarMenuButton tooltip={globalStats}>
                                <BarChartHorizontal />
                                <span>{globalStats}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/logs" className="w-full">
                            <SidebarMenuButton tooltip={logs}>
                                <History />
                                <span>{logs}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/admin/settings" className="w-full">
                            <SidebarMenuButton tooltip={settings}>
                                <Settings />
                                <span>{settings}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                 <SidebarMenu>
                    <SidebarMenuItem>
                         {/* Update Logout link if needed */}
                         <Link href="/" className="w-full">
                            <SidebarMenuButton tooltip={logout}>
                                <LogOut />
                                <span>{logout}</span>
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
                    <h1 className="text-xl font-semibold text-primary">{headerTitle}</h1>
                 </div>
                 {/* LanguageSwitcher removed */}
             </header>
            {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
