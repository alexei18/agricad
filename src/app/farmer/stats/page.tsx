'use client';
import { BackButton } from '@/components/ui/back-button'; 
import React, { useEffect, useState, useMemo } from 'react'; // Am adăugat useMemo
import { useSession } from 'next-auth/react'; // <-- Importăm useSession
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, AlertCircle, Loader2, User, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { getParcelsByVillage, Parcel } from '@/services/parcels';
import { getFarmerById, Farmer, getAllFarmers } from '@/services/farmers';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge'; // Importăm Badge

// Eliminăm ID-ul hardcodat
// const currentFarmerId = 'farmer1';

interface ComparisonStat {
  name: string;
  you: number;
  average: number;
}

interface FarmerAreaStats {
  farmerName: string;
  farmerId: string;
  ownedArea: number;
  cultivatedArea: number;
  color?: string | null;
}

export default function FarmerStatsPage() {
  const { data: session, status } = useSession(); // Obținem sesiunea și statusul

  // State-uri
  const [farmer, setFarmer] = useState<Omit<Farmer, 'password'> | null>(null); // Stocăm datele fermierului curent
  const [comparisonStats, setComparisonStats] = useState<ComparisonStat[]>([]);
  const [villageFarmerStats, setVillageFarmerStats] = useState<FarmerAreaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [farmerVillage, setFarmerVillage] = useState<string | null>(null);

  // Extragem ID-ul fermierului autentificat
  const actualFarmerId = (session?.user as any)?.id;

  useEffect(() => {
    const fetchData = async () => {
      // Rulăm doar dacă sesiunea e gata și utilizatorul e autentificat
      if (status === 'authenticated' && actualFarmerId) {
        setLoading(true);
        setError(null);
        try {
          console.log(`[FarmerStatsPage] Fetching data for farmer ID: ${actualFarmerId}`);

          // 1. Obținem datele fermierului curent
          const currentFarmerData = await getFarmerById(actualFarmerId); // Folosim ID-ul real
          if (!currentFarmerData || !currentFarmerData.village) {
            throw new Error("Nu s-au putut încărca datele agricultorului curent sau lipsește satul.");
          }
          setFarmer(currentFarmerData);
          const village = currentFarmerData.village;
          setFarmerVillage(village);

          // 2. Obținem toate parcelele și fermierii din satul fermierului curent
          const [parcelsData, allVillageFarmers] = await Promise.all([
            getParcelsByVillage(village),
            getAllFarmers(village)
          ]);

          if (allVillageFarmers.length === 0) {
            // Setăm statistici goale dacă nu există fermieri în sat
            console.warn(`Nu s-au găsit alți agricultori în satul ${village} pentru comparație.`);
            setComparisonStats([
              { name: "Suprafață Deținută (ha)", you: 0, average: 0 },
              { name: "Suprafață Prelucrată (ha)", you: 0, average: 0 },
            ]);
            setVillageFarmerStats([]);
            setLoading(false);
            return; // Ieșim devreme dacă nu avem fermieri
          }

          // 3. Calculăm suprafețele pentru fermierul curent
          let farmerOwnedArea = 0;
          let farmerCultivatedArea = 0;
          // Putem folosi și parcelele din sat, dar e mai sigur să folosim cele specifice fermierului
          // Să refacem fetch specific pt fermierul curent pentru siguranță (sau filtrăm parcelsData)
          parcelsData.forEach(p => {
            if (p.ownerId === actualFarmerId) farmerOwnedArea += p.area;
            if (p.cultivatorId === actualFarmerId) farmerCultivatedArea += p.area;
          });
          // Alternativ, mai eficient dacă avem multe parcele:
          // const [ownedParcelsFarmer, cultivatedParcelsFarmer] = await Promise.all([
          //    getParcelsByOwner(actualFarmerId),
          //    getParcelsByCultivator(actualFarmerId)
          // ]);
          // const farmerOwnedArea = ownedParcelsFarmer.reduce((sum, p) => sum + p.area, 0);
          // const farmerCultivatedArea = cultivatedParcelsFarmer.reduce((sum, p) => sum + p.area, 0);

          // 4. Calculăm totalurile și statisticile per fermier în sat
          let totalOwnedAreaVillage = 0;
          let totalCultivatedAreaVillage = 0;
          const farmerStatsMap = new Map<string, FarmerAreaStats>();

          allVillageFarmers.forEach(f => {
            farmerStatsMap.set(f.id, { farmerId: f.id, farmerName: f.name, ownedArea: 0, cultivatedArea: 0, color: f.color });
          });

          parcelsData.forEach(p => {
            if (p.ownerId) {
              const stats = farmerStatsMap.get(p.ownerId);
              if (stats) stats.ownedArea += p.area;
              totalOwnedAreaVillage += p.area;
            }
            if (p.cultivatorId) {
              const stats = farmerStatsMap.get(p.cultivatorId);
              if (stats) stats.cultivatedArea += p.area;
              // Considerăm total cultivat doar ce e explicit atribuit
              if (farmerStatsMap.has(p.cultivatorId)) {
                totalCultivatedAreaVillage += p.area;
              }
            }
          });

          // Setăm state-ul pentru graficul de distribuție
          setVillageFarmerStats(Array.from(farmerStatsMap.values()).sort((a, b) => b.ownedArea - a.ownedArea));

          // Calculăm mediile
          const numberOfFarmersInVillage = allVillageFarmers.length;
          const averageOwnedArea = numberOfFarmersInVillage > 0 ? totalOwnedAreaVillage / numberOfFarmersInVillage : 0;
          // Media cultivată: calculăm doar pe baza fermierilor care au suprafață cultivată nenulă? Sau pe toți? Alegem toți.
          const averageCultivatedArea = numberOfFarmersInVillage > 0 ? totalCultivatedAreaVillage / numberOfFarmersInVillage : 0;


          // 5. Pregătim statisticile comparative
          setComparisonStats([
            { name: "Suprafață Deținută (ha)", you: farmerOwnedArea, average: averageOwnedArea },
            { name: "Suprafață Prelucrată (ha)", you: farmerCultivatedArea, average: averageCultivatedArea },
          ]);

        } catch (err) {
          console.error("Eroare la preluarea statisticilor agricultorului:", err);
          setError(err instanceof Error ? err.message : "Nu s-au putut încărca statisticile.");
          // Reset state
          setComparisonStats([]);
          setVillageFarmerStats([]);
          setFarmer(null);
          setFarmerVillage(null);
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setError("Acces neautorizat.");
        setLoading(false);
      }
      // Nu facem nimic dacă status === 'loading'
    };

    if (status !== 'loading') {
      fetchData();
    }

  }, [status, actualFarmerId]); // Dependența principală este statusul sesiunii și ID-ul


  // Funcțiile renderLoading și renderError definite în scope
  const renderLoading = () => (
    <div className="grid gap-6 md:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
      ))}
    </div>
  );

  const renderError = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Eroare la Încărcarea Statisticilor</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  // Configurările pentru grafice
  const chartConfigCompare = {
    you: { label: "Suprafața Dvs. (ha)", color: "hsl(var(--chart-1))" },
    average: { label: "Media Satului (ha)", color: "hsl(var(--chart-2))" },
    name: { label: "Metric" },
  };
  const chartConfigVillage = {
    ownedArea: { label: "Deținută (ha)" },
    cultivatedArea: { label: "Prelucrată (ha)" },
    farmerName: { label: "Agricultor" },
  };


  // ---- Gestionare Stări Principale ----
  if (status === 'loading') {
    return (<div className="flex-1 p-4 sm:p-6">{renderLoading()}</div>);
  }
  if (status === 'unauthenticated') {
    return (<div className="flex-1 p-4 sm:p-6">{renderErrorAlert("Acces neautorizat.", "Neautentificat")}</div>);
  }
  if (loading) { // Verificăm loading specific datelor API
    return (<div className="flex-1 p-4 sm:p-6">{renderLoading()}</div>);
  }
  if (error || !farmer) { // Verificăm eroare sau lipsa datelor fermierului după încărcare
    return (<div className="flex-1 p-4 sm:p-6">{renderErrorAlert(error, "Eroare Încărcare Date")}</div>);
  }

  // --- Randarea Principală ---
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="mb-4"> {/* Adaugă un mic spațiu sub buton */}
                <BackButton />
            </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Statistici Sat {farmerVillage && `pentru ${farmerVillage}`}
          </CardTitle>
          <CardDescription>
            Statistici comparative pentru terenurile dvs. ({farmer.name}) în cadrul satului.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(comparisonStats.length === 0 && villageFarmerStats.length === 0) ? (
            <div className="flex items-center justify-center h-64 border-dashed border-2 border-muted rounded-md">
              <p className="text-muted-foreground text-center">
                Încă nu sunt disponibile date statistice pentru {farmerVillage}.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {/* Your vs. Average Chart */}
              {comparisonStats.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-1"><User className="h-4 w-4" /> Dvs. vs. Media Satului</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfigCompare} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                          <Bar dataKey="you" fill="var(--color-you)" radius={4} />
                          <Bar dataKey="average" fill="var(--color-average)" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Village Land Distribution Chart */}
              {villageFarmerStats.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-1"><Users className="h-4 w-4" /> Distribuția Terenurilor în Sat (ha)</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfigVillage} className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={villageFarmerStats} layout="vertical" barSize={15} margin={{ left: 30, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="farmerName" type="category" width={100} tick={{ fontSize: 10 }} interval={0} />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                          <Bar dataKey="ownedArea" name="Suprafață Deținută" radius={[0, 4, 4, 0]}>
                            {villageFarmerStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || 'hsl(var(--chart-1))'} className={entry.farmerId === actualFarmerId ? 'stroke-primary stroke-2' : ''} /> // Evidențiem bara fermierului curent
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Funcția renderErrorAlert definită aici sau importată
const renderErrorAlert = (errorMsg: string | null, title = "Eroare") => (
  <Alert variant="destructive" className="my-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{errorMsg || "A apărut o eroare necunoscută."}</AlertDescription>
  </Alert>
);