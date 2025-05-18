'use client'; // Needed for state and data fetching hooks
import { BackButton } from '@/components/ui/back-button'; 
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react'; // <-- Importăm useSession
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, ShieldCheck, ShieldAlert, CalendarDays, HelpCircle, AlertCircle } from 'lucide-react'; // Am adăugat AlertCircle
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getMayorById, Mayor } from '@/services/mayors';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MayorAccountPage() {
    const { data: session, status } = useSession(); // <-- Obținem sesiunea și statusul

    const [mayor, setMayor] = useState<Omit<Mayor, 'password'> | null>(null);
    const [loadingData, setLoadingData] = useState(true); // Stare separată pentru încărcarea datelor API
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMayorData = async () => {
            // Rulăm doar dacă sesiunea este autentificată
            if (status === 'authenticated' && session?.user) {
                const actualMayorId = (session.user as any)?.id; // Obține ID-ul real

                if (!actualMayorId) {
                    setError("ID-ul primarului nu a putut fi obținut din sesiune.");
                    setLoadingData(false);
                    return;
                }

                // Setăm loadingData true doar înainte de fetch-ul efectiv
                setLoadingData(true);
                setError(null);
                try {
                    console.log(`[MayorAccountPage] Fetching data for mayor ID: ${actualMayorId}`);
                    const data = await getMayorById(actualMayorId); // Folosește ID-ul real
                    if (data) {
                        setMayor(data);
                    } else {
                        // Setăm eroare specifică dacă primarul nu e găsit, chiar dacă API-ul nu a aruncat eroare
                        throw new Error("Contul de primar nu a fost găsit pentru ID-ul curent.");
                    }
                } catch (err) {
                    console.error("Eroare la preluarea datelor primarului:", err);
                    setError(err instanceof Error ? err.message : "Nu s-au putut încărca detaliile contului.");
                    setMayor(null);
                } finally {
                    setLoadingData(false);
                }
            } else if (status === 'unauthenticated') {
                // Setăm o eroare dacă utilizatorul devine neautentificat
                setError("Acces neautorizat. Vă rugăm să vă autentificați.");
                setLoadingData(false); // Oprim loading dacă nu e autentificat
                setMayor(null); // Resetăm datele
            }
            // Dacă status === 'loading', nu facem nimic, așteptăm să se schimbe
        };

        // Apelăm funcția doar dacă statusul nu mai este 'loading'
        // pentru a evita rularea înainte ca sesiunea să fie gata
        if (status !== 'loading') {
            fetchMayorData();
        }

    }, [session, status]); // Rulează când sesiunea sau statusul se schimbă

    // --- DEFINIȚIILE FUNCȚIILOR HELPER MUTATE AICI (ÎN INTERIOR) ---
    const renderLoading = () => (
        <div className="space-y-6">
            {/* Account Details Skeleton */}
            <div className="space-y-4 border-b pb-4">
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-10 w-full" /></div>
                    <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-10 w-full" /></div>
                    <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-10 w-full" /></div>
                </div>
                <Skeleton className="h-9 w-40" />
            </div>
            {/* Subscription Status Skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-5 w-44" />
                <div className="flex items-center gap-2"><Skeleton className="h-8 w-24 rounded-full" /></div>
                <div className="flex items-center gap-2 text-sm"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-48" /></div>
                <Skeleton className="h-3 w-5/6" /><Skeleton className="h-9 w-36" />
            </div>
        </div>
    );

    // --- SFÂRȘIT BLOC MUTAT ---

    // Verificăm starea de încărcare a sesiunii PRIMA DATĂ
    if (status === 'loading') {
        return (
            <div className="flex-1 p-4 sm:p-6">
                <Card className="shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> <Skeleton className="h-6 w-32" /></CardTitle><Skeleton className="h-4 w-64 mt-1" /></CardHeader><CardContent>{renderLoading()}</CardContent></Card>
            </div>
        );
    }

    // Verificăm dacă nu suntem autentificați SAU dacă există o eroare setată
    if (status === 'unauthenticated' || error) {
        return (
            <div className="flex-1 p-4 sm:p-6">
                <Card className="shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Contul Meu</CardTitle><CardDescription>Vizualizați detaliile contului și starea abonamentului.</CardDescription></CardHeader><CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Eroare</AlertTitle>
                        {/* Afișăm eroarea specifică sau mesajul de neautentificare */}
                        <AlertDescription>{error || "Acces neautorizat."}</AlertDescription>
                    </Alert>
                </CardContent></Card>
            </div>
        );
    }

    // Verificăm starea de încărcare specifică datelor API
    if (loadingData) {
        // Folosim același loading ca și pentru sesiune, sau unul specific dacă preferi
        return (
            <div className="flex-1 p-4 sm:p-6">
                <Card className="shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> <Skeleton className="h-6 w-32" /></CardTitle><Skeleton className="h-4 w-64 mt-1" /></CardHeader><CardContent>{renderLoading()}</CardContent></Card>
            </div>
        );
    }

    // Verificăm dacă, după încărcare, tot nu avem datele primarului
    if (!mayor) {
        return (
            <div className="flex-1 p-4 sm:p-6">
                <Card className="shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Contul Meu</CardTitle><CardDescription>Vizualizați detaliile contului și starea abonamentului.</CardDescription></CardHeader><CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Eroare</AlertTitle>
                        <AlertDescription>Datele contului nu au putut fi încărcate (primarul nu a fost găsit).</AlertDescription>
                    </Alert>
                </CardContent></Card>
            </div>
        );
    }

    // --- Randare principală ---
    // Dacă am ajuns aici: status='authenticated', error=null, loadingData=false, mayor=obiect valid
    const isSubscriptionActive = mayor.subscriptionStatus === 'ACTIVE';
    const StatusIcon = isSubscriptionActive ? ShieldCheck : mayor.subscriptionStatus === 'PENDING' ? HelpCircle : ShieldAlert;
    const statusColor = isSubscriptionActive ? 'text-green-600' : mayor.subscriptionStatus === 'PENDING' ? 'text-yellow-600' : 'text-destructive';
    const badgeVariant = isSubscriptionActive ? 'default' : mayor.subscriptionStatus === 'PENDING' ? 'secondary' : 'destructive';

    return (
        <div className="flex-1 p-4 sm:p-6">
            <div className="mb-4"> {/* Adaugă un mic spațiu sub buton */}
                <BackButton />
            </div>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" /> Contul Meu
                    </CardTitle>
                    <CardDescription>
                        Vizualizați și gestionați detaliile contului și starea abonamentului pentru {mayor.village}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Account Details Section */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="font-medium flex items-center gap-2"><User className="h-4 w-4" /> Informații Profil</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="name">Nume</Label><Input id="name" value={mayor.name} readOnly disabled /></div>
                            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={mayor.email || ''} readOnly disabled /></div>
                            <div><Label htmlFor="village">Sat</Label><Input id="village" value={mayor.village} readOnly disabled /></div>
                        </div>
                        <Button variant="outline" disabled size="sm">Schimbă Parola (Neimplementat)</Button>
                    </div>

                    {/* Subscription Status Section */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${statusColor}`} /> Stare Abonament
                        </h3>
                        <div className="flex items-center gap-2">
                            <Badge variant={badgeVariant} className="capitalize text-base px-3 py-1">
                                {mayor.subscriptionStatus.toLowerCase().replace('_', ' ')}
                            </Badge>
                            {mayor.subscriptionStatus === 'INACTIVE' && (<p className="text-sm text-destructive">Accesul dvs. este momentan inactiv.</p>)}
                            {mayor.subscriptionStatus === 'PENDING' && (<p className="text-sm text-yellow-600">Contul dvs. este în așteptarea activării.</p>)}
                        </div>
                        {mayor.subscriptionEndDate && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                <span>{isSubscriptionActive ? 'Valabil până la:' : 'Expirat la:'} {new Date(mayor.subscriptionEndDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Contactați administratorul pentru gestionarea abonamentului.
                        </p>
                        <Button variant="secondary" size="sm" onClick={() => window.location.href = 'mailto:admin@AgriCad.example.com'}>
                            <HelpCircle className="mr-2 h-4 w-4" /> Contact Admin
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Funcțiile renderLoading și renderError nu mai sunt necesare definite separat aici,
// deoarece logica lor este inclusă în verificările de la începutul return-ului.
// Le poți șterge complet dacă nu le mai folosești nicăieri altundeva.