// src/components/layout/MayorLayoutClient.tsx
'use client'; // Marcat ca și componentă client

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react'; // Importăm useSession și signOut
import { Home, Users, Edit3, BarChartHorizontal, Settings, Info, LogOut, Loader2, AlertCircle } from 'lucide-react'; // Includem Loader2 și AlertCircle
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
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Putem defini textele aici sau le putem primi ca props dacă preferi
const t = {
    sidebarTitle: "AgriCad",
    villageLabel: "Sat",
    dashboard: "Panou Principal",
    manageFarmers: "Gestionare Agricultori",
    manageParcels: "Gestionare Parcele",
    villageStats: "Statistici Sat",
    myAccount: "Contul Meu",
    support: "Suport",
    logout: "Deconectare",
    headerTitleTemplate: "Panou Primar - {village}",
    loadingSession: "Se încarcă sesiunea...",
    unauthorized: "Acces neautorizat.",
    defaultVillageName: "Nespecificat" // Fallback dacă satul nu e găsit
};

// Componenta Client
export function MayorLayoutClient({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession(); // Obținem sesiunea

    // Extragem datele necesare din sesiune DUPĂ ce s-a încărcat
    const mayorVillage = status === 'authenticated' ? (session?.user as any)?.village || t.defaultVillageName : t.defaultVillageName;
    const mayorName = status === 'authenticated' ? session?.user?.name || "Primar" : "Primar"; // Folosim și numele din sesiune

    const handleLogout = async () => {
        console.log("MayorLayoutClient: Attempting logout...");
        await signOut({ callbackUrl: '/' });
    };

    // --- Stare de Încărcare Sesiune ---
    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">{t.loadingSession}</span>
            </div>
        );
    }

    // --- Stare Neautentificat (Middleware ar trebui să prevină, dar ca fallback) ---
    if (status === 'unauthenticated') {
        // Poate afișăm un mesaj și un link către login
        return (
            <div className="flex h-screen items-center justify-center">
                <Alert variant="destructive" className="w-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Eroare</AlertTitle>
                    <AlertDescription>
                        {t.unauthorized} <Link href="/" className="font-bold underline">Autentificare</Link>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // --- Randare Layout Autentificat ---
    const headerTitle = t.headerTitleTemplate.replace('{village}', mayorVillage);

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex flex-col items-start gap-2 p-2">
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                            <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">{t.sidebarTitle}</span>
                        </div>
                        {/* Afișăm satul dinamic */}
                        <Badge variant="secondary" className="ml-1 group-data-[collapsible=icon]:hidden">{t.villageLabel}: {mayorVillage}</Badge>
                        <Badge variant="outline" className="hidden group-data-[collapsible=icon]:inline-flex" title={mayorVillage}>
                            <Home className="h-3 w-3" />
                        </Badge>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    {/* Meniul pentru Primar */}
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <Link href="/mayor/dashboard" className="w-full">
                                <SidebarMenuButton tooltip={t.dashboard}>
                                    <Home /><span>{t.dashboard}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Link href="/mayor/farmers" className="w-full">
                                <SidebarMenuButton tooltip={t.manageFarmers}>
                                    <Users /><span>{t.manageFarmers}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Link href="/mayor/parcels" className="w-full">
                                <SidebarMenuButton tooltip={t.manageParcels}>
                                    <Edit3 /><span>{t.manageParcels}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Link href="/mayor/stats" className="w-full">
                                <SidebarMenuButton tooltip={t.villageStats}>
                                    <BarChartHorizontal /><span>{t.villageStats}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Link href="/mayor/account" className="w-full">
                                <SidebarMenuButton tooltip={t.myAccount}>
                                    <Settings /><span>{t.myAccount}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Link href="/mayor/support" className="w-full">
                                <SidebarMenuButton tooltip={t.support}>
                                    <Info /><span>{t.support}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            {/* Butonul de Logout funcțional */}
                            <SidebarMenuButton
                                tooltip={t.logout}
                                onClick={handleLogout}
                                className="w-full"
                            >
                                <LogOut />
                                <span>{t.logout}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 gap-4">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="md:hidden" />
                        {/* Afișăm titlul dinamic */}
                        <h1 className="text-xl font-semibold text-primary">{headerTitle}</h1>
                    </div>
                    {/* Aici poți adăuga un meniu pentru utilizator dacă dorești, folosind 'session.user.name' etc. */}
                    {/* <div>{session?.user?.name}</div> */}
                </header>
                {/* Aici este randat conținutul paginii specifice */}
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}