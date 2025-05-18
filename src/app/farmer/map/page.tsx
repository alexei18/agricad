'use client';
import { BackButton } from '@/components/ui/back-button'; 
import React, { useEffect, useState, Suspense } from 'react'; // Am scos useMemo, nu e folosit direct aici
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Loader2, AlertCircle, Eye, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getParcelsByVillage, Parcel } from '@/services/parcels';
import { getFarmerById, Farmer, getAllFarmers } from '@/services/farmers';
// Nu mai importăm ParcelMap static aici, folosim ParcelMapWithNoSSR definit mai jos
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import dynamic from 'next/dynamic';

// --- Import Dinamic pentru ParcelMap ---
// Folosim un nume consistent cu cel din pagina primarului pentru claritate
const ParcelMapWithNoSSR = dynamic(() =>
    import('@/components/maps/parcel-map').then((mod) => mod.ParcelMap),
    {
        ssr: false,
        loading: () => ( // Loader specific pentru hartă
            <div className="h-[600px] w-full border rounded-md bg-muted/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Se încarcă harta...</p>
            </div>
        )
    }
);


function FarmerMapContent() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams(); // Suspense în wrapper se ocupă de asta
    const initialVillageFromUrl = searchParams.get('village');

    const [currentFarmer, setCurrentFarmer] = useState<Omit<Farmer, 'password'> | null>(null);
    const [villageParcels, setVillageParcels] = useState<Parcel[]>([]);
    const [villageFarmers, setVillageFarmers] = useState<Omit<Farmer, 'password'>[]>([]);
    const [mapVillageContext, setMapVillageContext] = useState<string | null>(null); // Inițial null, setat în useEffect
    const [loadingData, setLoadingData] = useState(true); // Stare specifică pentru încărcarea datelor API
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false); // Pentru a ne asigura că suntem pe client
    const [showAllFarmerColorsOnMap, setShowAllFarmerColorsOnMap] = useState(false);

    const actualFarmerId = (session?.user as any)?.id;

    useEffect(() => {
        // Setează isClient la true DUPĂ ce componenta s-a montat pe client
        setIsClient(true);

        const fetchData = async () => {
            if (status === 'authenticated' && actualFarmerId) {
                setLoadingData(true); // Începe încărcarea datelor API
                setError(null);
                try {
                    const farmerData = await getFarmerById(actualFarmerId);
                    if (!farmerData) throw new Error("Datele agricultorului nu au fost găsite.");
                    setCurrentFarmer(farmerData);

                    const villageToDisplay = initialVillageFromUrl || farmerData.village;
                    // Setăm mapVillageContext doar dacă este diferit sau dacă este prima încărcare (null)
                    // Acest lucru previne buclele dacă initialVillageFromUrl se schimbă (deși nu ar trebui fără o nouă navigare)
                    if (villageToDisplay && villageToDisplay !== mapVillageContext) {
                        setMapVillageContext(villageToDisplay);
                    } else if (!villageToDisplay && !mapVillageContext) { // Cazul în care nici URL, nici farmerData.village nu oferă un sat
                        throw new Error("Nu s-a putut determina satul pentru afișarea hărții.");
                    }
                    
                    // Fetch datele pentru satul determinat (mapVillageContext va fi setat în renderul următor dacă s-a schimbat)
                    const finalVillageForDataFetch = villageToDisplay || mapVillageContext;

                    if (finalVillageForDataFetch) {
                        const [parcelsData, farmersData] = await Promise.all([
                            getParcelsByVillage(finalVillageForDataFetch),
                            getAllFarmers(finalVillageForDataFetch)
                        ]);
                        setVillageParcels(parcelsData);
                        setVillageFarmers(farmersData);
                    } else {
                        // Această ramură ar trebui să fie atinsă doar dacă mapVillageContext era deja null și villageToDisplay a fost tot null
                         throw new Error("Contextul satului pentru hartă este nedefinit.");
                    }
                } catch (err) {
                    console.error("Error fetching farmer's map data:", err);
                    setError(err instanceof Error ? err.message : "Nu s-au putut încărca datele hărții.");
                    setVillageParcels([]); setVillageFarmers([]); // Nu reseta mapVillageContext aici, poate fi din URL
                } finally {
                    setLoadingData(false); // Termină încărcarea datelor API
                }
            } else if (status === 'unauthenticated') {
                setError("Acces neautorizat.");
                setLoadingData(false);
            }
            // Nu facem nimic dacă status === 'loading' (pentru sesiune)
        };

        if (status !== 'loading') { // Rulează fetchData doar când sesiunea nu se mai încarcă
            fetchData();
        }
    // Scoatem mapVillageContext din dependențe pentru a evita rularea fetchData când doar el se schimbă intern.
    // FetchData ar trebui să ruleze când ID-ul fermierului, statusul sesiunii, sau satul din URL se schimbă.
    // MapVillageContext este un rezultat al acestor schimbări.
    }, [status, actualFarmerId, initialVillageFromUrl]);


    // Gestionare Stări de Încărcare și Eroare
    if (status === 'loading') {
        return <div className="flex-1 p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Se încarcă sesiunea...</p></div>;
    }
    if (status === 'unauthenticated') {
        return <div className="flex-1 p-6">{renderErrorAlertForFarmerMap("Acces neautorizat.", "Neautentificat")}</div>;
    }
    if (error) { // Eroare generală (din fetch sau configurare)
        return <div className="flex-1 p-6">{renderErrorAlertForFarmerMap(error, "Eroare Date Hartă")}</div>;
    }
    // Afișează loader dacă datele API se încarcă SAU dacă nu suntem pe client SAU dacă mapVillageContext nu e încă setat
    if (loadingData || !isClient || !mapVillageContext) {
        return (
            <div className="flex-1 p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">
                    {loadingData ? "Se încarcă datele hărții..." : !mapVillageContext ? "Se determină satul..." : "Se pregătește harta..."}
                </p>
            </div>
        );
    }
    // Dacă am trecut de toate, dar currentFarmer nu e setat (ar trebui să fie prins de error, dar ca extra check)
    if (!currentFarmer) {
         return <div className="flex-1 p-6">{renderErrorAlertForFarmerMap("Datele agricultorului nu au putut fi încărcate.", "Eroare Utilizator")}</div>;
    }


    return (
        <div className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="mb-4"> {/* Adaugă un mic spațiu sub buton */}
                <BackButton />
            </div>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" /> Harta Parcelelor - {mapVillageContext} {/* Acum mapVillageContext ar trebui să fie definit */}
                    </CardTitle>
                    <CardDescription>
                        Vizualizare a parcelelor din {mapVillageContext}.
                        {showAllFarmerColorsOnMap
                            ? " Sunt afișate culorile tuturor fermierilor."
                            : ` Parcelele dvs. (${currentFarmer.name}) sunt evidențiate.`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 justify-end mb-4">
                        <Switch
                            id="show-all-farmers-switch"
                            checked={showAllFarmerColorsOnMap}
                            onCheckedChange={setShowAllFarmerColorsOnMap}
                            disabled={loadingData} // Dezactivează în timpul încărcării datelor
                        />
                        <Label htmlFor="show-all-farmers-switch" className="flex items-center gap-1 cursor-pointer">
                            {showAllFarmerColorsOnMap ? <Users className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            Afișează {showAllFarmerColorsOnMap ? "toți fermierii" : "doar pe mine"}
                        </Label>
                    </div>

                    <div className="border rounded-md h-[600px] overflow-hidden relative bg-muted/10">
                        {/* Randarea ParcelMap este condiționată de isClient și existența datelor */}
                        {isClient && mapVillageContext ? (
                            <ParcelMapWithNoSSR
                                parcels={villageParcels}
                                village={mapVillageContext} // mapVillageContext este garantat string aici
                                farmers={villageFarmers} // Tipul Omit<Farmer, 'password'> ar trebui să fie OK dacă ParcelMap îl acceptă
                                highlightFarmerId={actualFarmerId} // actualFarmerId este ID-ul fermierului logat
                                showAllFarmersColors={showAllFarmerColorsOnMap}
                                mapViewType="satellite"
                            />
                        ) : (
                            // Acest fallback este pentru cazul teoretic în care isClient e true dar mapVillageContext nu e (deși logica de sus ar trebui să prevină)
                            // Sau, dacă se ajunge aici, e starea de încărcare a componentei ParcelMapWithNoSSR (definită în dynamic import)
                            <div className="h-full w-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="ml-2 text-muted-foreground">Se inițializează harta...</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Funcție helper specifică pentru această pagină, pentru a evita conflicte de nume
const renderErrorAlertForFarmerMap = (errorMsg: string | null, title = "Eroare") => (
    <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{errorMsg || "A apărut o eroare."}</AlertDescription>
    </Alert>
);

export default function FarmerMapPageWrapper() {
    // Suspense este necesar pentru useSearchParams în FarmerMapContent
    return (
        <Suspense fallback={
            <div className="flex-1 p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Se încarcă pagina hărții...</p>
            </div>
        }>
            <FarmerMapContent />
        </Suspense>
    );
}