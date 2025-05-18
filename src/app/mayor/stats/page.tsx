'use client';
import { BackButton } from '@/components/ui/back-button'; 
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react'; // <-- Importăm useSession
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartHorizontal, AlertCircle, Loader2, Users, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { getParcelsByVillage, Parcel } from '@/services/parcels';
import { getAllFarmers, Farmer } from '@/services/farmers';
// getMayorById nu mai este necesar pentru funcționalitatea principală a acestei pagini
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// Eliminăm ID-ul hardcodat
// const currentMayorId = "mayor1";

interface FarmerAreaStats {
  farmerName: string;
  farmerId: string;
  ownedArea: number;
  cultivatedArea: number;
}

interface ParcelSizeBucket {
  range: string;
  count: number;
}

export default function MayorStatsPage() {
  const { data: session, status } = useSession(); // <-- Obținem sesiunea și statusul

  const [farmerAreaStats, setFarmerAreaStats] = useState<FarmerAreaStats[]>([]);
  const [parcelSizeDistribution, setParcelSizeDistribution] = useState<ParcelSizeBucket[]>([]);
  const [loadingData, setLoadingData] = useState(true); // Renumit din 'loading' pentru claritate
  const [error, setError] = useState<string | null>(null);
  // const [currentMayorVillage, setCurrentMayorVillage] = useState<string | null>(null); // Luăm direct din sesiune

  // Extragem satul direct din sesiune când e disponibilă
  const currentMayorVillage = (session?.user as any)?.village;
  const actualMayorId = (session?.user as any)?.id; // Îl putem lua, deși nu e folosit direct pt fetch aici

  useEffect(() => {
    // Funcția fetchData rulează doar dacă sesiunea e autentificată și avem un sat
    const fetchData = async () => {
      if (status === 'authenticated' && currentMayorVillage) {
        setLoadingData(true);
        setError(null);
        console.log(`[MayorStatsPage] Fetching stats for village: ${currentMayorVillage}`); // Log debug
        try {
          // Fetch parcels și farmers pentru satul primarului curent
          const [parcelsData, farmersData] = await Promise.all([
            getParcelsByVillage(currentMayorVillage),
            getAllFarmers(currentMayorVillage)
          ]);

          // --- Procesare Statistici Suprafață Agricultori ---
          const statsMap = new Map<string, FarmerAreaStats>();
          farmersData.forEach(farmer => {
            statsMap.set(farmer.id, {
              farmerId: farmer.id,
              farmerName: farmer.name,
              ownedArea: 0,
              cultivatedArea: 0,
            });
          });

          parcelsData.forEach(parcel => {
            if (parcel.ownerId) {
              const stats = statsMap.get(parcel.ownerId);
              if (stats) {
                stats.ownedArea += parcel.area;
              }
            }
            if (parcel.cultivatorId) {
              const stats = statsMap.get(parcel.cultivatorId);
              if (stats) {
                stats.cultivatedArea += parcel.area;
              }
            }
          });
          setFarmerAreaStats(Array.from(statsMap.values()).sort((a, b) => b.ownedArea - a.ownedArea));

          // --- Procesare Distribuție Dimensiune Parcele ---
          processParcelSizes(parcelsData);

        } catch (err) {
          console.error(`Eroare la preluarea statisticilor pentru sat ${currentMayorVillage}:`, err);
          setError(err instanceof Error ? err.message : "Nu s-au putut încărca statisticile.");
          setFarmerAreaStats([]);
          setParcelSizeDistribution([]);
        } finally {
          setLoadingData(false);
        }
      } else if (status === 'authenticated' && !currentMayorVillage) {
        // Cazul în care sesiunea e ok, dar nu avem sat (improbabil cu configurația actuală)
        setError("Informațiile despre satul primarului nu sunt disponibile în sesiune.");
        setLoadingData(false);
      } else if (status === 'unauthenticated') {
        setError("Acces neautorizat.");
        setLoadingData(false);
      }
      // Nu facem nimic dacă status === 'loading' - așteptăm rularea următoare a efectului
    };

    // Funcția processParcelSizes rămâne la fel
    const processParcelSizes = (parcels: Parcel[]) => {
      const buckets: Record<string, number> = { "0-1 ha": 0, "1-5 ha": 0, "5-10 ha": 0, "10-20 ha": 0, "20+ ha": 0 };
      const bucketRanges = [1, 5, 10, 20];
      parcels.forEach(parcel => {
        let assigned = false;
        for (let i = 0; i < bucketRanges.length; i++) {
          if (parcel.area <= bucketRanges[i]) {
            const key = i === 0 ? `0-${bucketRanges[i]} ha` : `${bucketRanges[i - 1]}-${bucketRanges[i]} ha`;
            buckets[key]++;
            assigned = true;
            break;
          }
        }
        if (!assigned) buckets["20+ ha"]++;
      });
      const distribution: ParcelSizeBucket[] = Object.entries(buckets).map(([range, count]) => ({ range, count }));
      setParcelSizeDistribution(distribution);
    };

    fetchData();
    // Dependența este acum status și currentMayorVillage (derivat din sesiune)
  }, [status, currentMayorVillage]); // Eliminăm session din array dacă folosim direct currentMayorVillage

  // Înlocuiește linia const renderLoading = () => ( /* ... */ ); cu:
  const renderLoading = () => (
    <div className="grid gap-6 md:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Înlocuiește linia const renderError = () => ( /* ... */ ); cu:
  const renderError = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Eroare la Încărcarea Statisticilor</AlertTitle>
      {/* 'error' este variabila de state definită mai sus în componentă */}
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  // Definițiile chartConfig pot rămâne cum erau
  const chartConfigFarmerArea = {
    ownedArea: { label: "Deținută (ha)", color: "hsl(var(--chart-1))" },
    // Poți decomenta linia următoare dacă vrei să adaugi și aria prelucrată în grafic/tooltip
    // cultivatedArea: { label: "Prelucrată (ha)", color: "hsl(var(--chart-2))" },
    farmerName: { label: "Agricultor" },
  };

  const chartConfigParcelSize = {
    count: { label: "Număr Parcele" },
    range: { label: "Interval Suprafață" },
    // Folosim o cheie 'bar' pentru a defini culoarea barelor în ChartContainer,
    // sau poți seta direct în componenta <Bar> folosind fill='hsl(var(--chart-3))'
    // Să păstrăm o structură similară cu cea anterioară pentru compatibilitate:
    bar: { color: "hsl(var(--chart-3))" }, // Cheie generică 'bar'
  };
  // Verificări inițiale pentru starea sesiunii
  if (status === 'loading') {
    return renderLoading(); // Afișează loading general cât timp se încarcă sesiunea
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acces Neautorizat</AlertTitle>
          <AlertDescription>Vă rugăm să vă autentificați.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Dacă a trecut de verificările de sesiune, randăm conținutul
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="mb-4"> {/* Adaugă un mic spațiu sub buton */}
                <BackButton />
            </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartHorizontal className="h-5 w-5" />
            {/* Folosim satul din sesiune */}
            Statistici pentru {currentMayorVillage || 'Satul Dvs.'}
          </CardTitle>
          <CardDescription>
            Prezentare generală a distribuției terenurilor și a dimensiunilor parcelelor în satul dvs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Folosim loadingData specific pentru datele API, nu statusul sesiunii */}
          {loadingData ? renderLoading() : error ? renderError() : (
            (farmerAreaStats.length === 0 && parcelSizeDistribution.every(b => b.count === 0)) ? (
              <div className="flex items-center justify-center h-64 border-dashed border-2 border-muted rounded-md">
                <p className="text-muted-foreground text-center">
                  Nu există încă date statistice disponibile pentru {currentMayorVillage || 'acest sat'}.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {/* Farmer Area Chart */}
                {farmerAreaStats.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-1"><Users className="h-4 w-4" /> Suprafață per Agricultor (ha)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfigFarmerArea} className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={farmerAreaStats} layout="vertical" barSize={15} margin={{ left: 30, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="farmerName" type="category" width={100} tick={{ fontSize: 10 }} interval={0} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="ownedArea" name="Suprafață Deținută" fill="var(--color-ownedArea)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Parcel Size Distribution Chart */}
                {parcelSizeDistribution.some(b => b.count > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-1"><MapPin className="h-4 w-4" /> Distribuția Dimensiunii Parcelelor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfigParcelSize} className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={parcelSizeDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                              <Bar dataKey="count" name="Număr Parcele" fill={chartConfigParcelSize.bar.color} radius={4} />                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
