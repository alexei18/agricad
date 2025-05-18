// src/app/mayor/dashboard/layout.tsx
import type { Metadata } from "next";
// Importăm getServerSession și authOptions pentru a accesa sesiunea pe server
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Asigură-te că exporți authOptions din route.ts
// Importăm DOAR componenta client
import { MayorLayoutClient } from '@/components/layout/MayorLayoutClient';
// Importăm getMayorById doar dacă este absolut necesar pt metadata (deși satul e în sesiune)
import { getMayorById } from '@/services/mayors';
import { unstable_noStore as noStore } from 'next/cache';

// Funcția generateMetadata - acum folosește getServerSession
export async function generateMetadata(): Promise<Metadata> {
    noStore(); // Previne caching-ul static al metadatelor
    let pageTitle = "AgriCad - Panou Primar"; // Titlu default
    let pageDescription = "Panou de control primar";

    const session = await getServerSession(authOptions); // Obține sesiunea pe server
    const mayorVillage = (session?.user as any)?.village; // Extrage satul direct din sesiune

    if (mayorVillage) {
        pageTitle = `AgriCad - Primar (${mayorVillage})`;
        pageDescription = `Panou de control primar pentru ${mayorVillage}`;
    } else {
        // Opțional: Poți încerca să iei satul din DB folosind ID-ul dacă nu e în token,
        // dar ideal ar fi să fie în token. Sau loghează un avertisment.
        console.warn("[MayorLayout Metadata] Nu s-a găsit satul în sesiune.");
        // Încercare fallback cu ID (dacă e absolut necesar și ID-ul e în sesiune)
        const mayorId = (session?.user as any)?.id;
        if (mayorId) {
            try {
                const mayor = await getMayorById(mayorId);
                if (mayor) {
                    pageTitle = `AgriCad - Primar (${mayor.village})`;
                    pageDescription = `Panou de control primar pentru ${mayor.village}`;
                }
            } catch (err) {
                console.error("[MayorLayout Metadata] Eroare fetch mayor pt fallback:", err);
            }
        }
    }

    return {
        title: pageTitle,
        description: pageDescription,
    };
}

// Layout-ul Server Component - acum doar randează componenta client
export default function MayorLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Nu mai facem fetch de date aici, totul e în componenta client
    // Nici nu mai avem nevoie de obiectul 't' sau variabilele 'mayorVillage', 'mayorName' etc.

    return (
        // Randăm componenta client și îi pasăm 'children'
        <MayorLayoutClient>
            {children}
        </MayorLayoutClient>
    );
}