
'use client';
import { BackButton } from '@/components/ui/back-button'; 
import React, { useEffect } from 'react'; // Adaugă useEffect dacă vrei să faci fetch de date aici
import { useSession } from 'next-auth/react'; // <-- Importă useSession
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getParcelsByVillage, Parcel } from '@/services/parcels';
import { getAllFarmers, Farmer } from '@/services/farmers';
import { getMayorById, Mayor } from '@/services/mayors'; // Import mayor service
import { Loader2, Users, MapPin, BarChartHorizontal, AlertCircle, Edit3 } from 'lucide-react'; // Added Edit3
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert


export default function MayorDashboard() {
  const { data: session, status } = useSession();
  const [mayor, setMayor] = React.useState<Omit<Mayor, 'password'> | null>(null);
  const [parcels, setParcels] = React.useState<Parcel[]>([]);
  const [farmers, setFarmers] = React.useState<Omit<Farmer, 'password'>[]>([]); // Exclude password
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentMayorVillage, setCurrentMayorVillage] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Funcția fetchData va rula doar dacă sesiunea este autentificată
    const fetchData = async () => {
      // Verifică dacă sesiunea este încărcată și autentificată și dacă există ID utilizator
      if (status === 'authenticated' && session?.user) {
        const actualMayorId = (session.user as any)?.id; // Obține ID-ul real din sesiune

        if (!actualMayorId) {
          setError("ID-ul primarului nu a putut fi obținut din sesiune.");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        try {
          // 1. Fetch Mayor details folosind ID-ul REAL
          console.log(`[MayorDashboard] Fetching data for mayor ID: ${actualMayorId}`); // Log pentru debug
          const mayorData = await getMayorById(actualMayorId); // <-- Folosește ID-ul real
          if (!mayorData) {
            throw new Error("Datele primarului nu au fost găsite pentru ID-ul curent.");
          }
          setMayor(mayorData);
          const village = mayorData.village;
          setCurrentMayorVillage(village);

          // 2. Fetch parcels și farmers pentru satul primarului curent
          const [parcelsData, farmersData] = await Promise.all([
            getParcelsByVillage(village),
            getAllFarmers(village)
          ]);
          setParcels(parcelsData);
          setFarmers(farmersData);
        } catch (err) {
          console.error("Error fetching village data:", err);
          setError(err instanceof Error ? err.message : "Nu s-au putut încărca datele satului.");
          // Resetează state-urile în caz de eroare
          setParcels([]);
          setFarmers([]);
          setMayor(null);
          setCurrentMayorVillage(null);
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        // Utilizatorul nu este autentificat (middleware ar trebui să prevină, dar ca fallback)
        setError("Acces neautorizat. Vă rugăm să vă autentificați.");
        setLoading(false);
      }
      if (status === 'loading' || (loading && !error)) { // Afișează loading dacă sesiunea se încarcă SAU dacă datele încă se încarcă
        return (
          <div className="flex-1 p-4 sm:p-6 space-y-6">
            {/* Poți afișa un schelet mai complet aici */}
            <Skeleton className="h-20 w-full mb-4" />
            <Skeleton className="h-40 w-full" />
          </div>
        );
      }    };

    fetchData();
  }, [session, status]); // <-- Rulează efectul când sesiunea sau statusul se schimbă
  const totalVillageArea = parcels.reduce((sum, parcel) => sum + parcel.area, 0);
  const numberOfFarmers = farmers.length;
  const numberOfParcels = parcels.length;

  const renderLoadingList = (count = 5) => (
    Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex justify-between items-center p-2 animate-pulse">
            <div className="flex-1 space-y-1 pr-4">
                 <Skeleton className="h-4 w-2/3" />
                 <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-1/4" />
        </div>
     ))
  );

  if (error) {
     return (
          <div className="flex-1 p-4 sm:p-6">
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Eroare</AlertTitle>
                <AlertDescription>
                    {error} Vă rugăm reîncărcați pagina sau contactați suportul dacă problema persistă.
                </AlertDescription>
             </Alert>
          </div>
     );
  }


  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Village Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parcele</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20 mt-1" /> : <div className="text-2xl font-bold">{numberOfParcels}</div>}
            <p className="text-xs text-muted-foreground">parcele înregistrate în {currentMayorVillage || 'sat'}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suprafață Totală Înregistrată</CardTitle>
             <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24 mt-1" /> : <div className="text-2xl font-bold">{totalVillageArea.toFixed(2)} ha</div>}
             <p className="text-xs text-muted-foreground">hectare totale în {currentMayorVillage || 'sat'}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agricultori Înregistrați</CardTitle>
             <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <div className="text-2xl font-bold">{numberOfFarmers}</div>}
             <p className="text-xs text-muted-foreground">agricultori activi în {currentMayorVillage || 'sat'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
       <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Acțiuni Rapide</CardTitle>
                <CardDescription>Navigați la zonele cheie de management pentru {currentMayorVillage || 'satul dvs.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/mayor/farmers" passHref>
                    <Button variant="outline" className="w-full">
                        <Users className="mr-2 h-4 w-4" /> Gestionează Agricultori
                    </Button>
                </Link>
                <Link href="/mayor/parcels" passHref>
                     <Button variant="outline" className="w-full">
                         <Edit3 className="mr-2 h-4 w-4" /> Gestionează Parcele
                    </Button>
                </Link>
                <Link href="/mayor/stats" passHref>
                    <Button variant="outline" className="w-full">
                         <BarChartHorizontal className="mr-2 h-4 w-4" /> Vezi Statistici
                    </Button>
                </Link>
            </CardContent>
       </Card>

       {/* Recent Activity / Overview (Example) */}
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Activitate Recentă Agricultori</CardTitle>
          <CardDescription>Prezentare generală a celor mai recent actualizați agricultori din {currentMayorVillage || 'satul dvs.'}</CardDescription>
        </CardHeader>
        <CardContent>
           <ScrollArea className="h-[250px] rounded-md border">
             {loading ? (
                 <div className="p-4 space-y-2">{renderLoadingList(5)}</div>
             ) : farmers.length > 0 ? (
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume</TableHead>
                    <TableHead>Cod Fiscal</TableHead>
                    <TableHead className="text-right">Ultima Actualizare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmers
                    .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)) // Sort by most recent update
                    .slice(0, 10) // Show top 10 recent
                    .map((farmer) => (
                    <TableRow key={farmer.id}>
                      <TableCell className="font-medium">{farmer.name}</TableCell>
                      <TableCell>{farmer.companyCode}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {farmer.updatedAt ? farmer.updatedAt.toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             ) : (
                 <div className="p-4 text-center text-muted-foreground">Nu s-au găsit agricultori pentru {currentMayorVillage || 'acest sat'}.</div>
             )}
           </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
}
