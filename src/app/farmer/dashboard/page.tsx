'use client' // Needed for state management and data fetching hooks

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react'; // <-- Importăm useSession
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getParcelsByOwner, getParcelsByCultivator, getParcelsByVillage, Parcel } from '@/services/parcels';
import { getFarmerById, Farmer, getAllFarmers } from '@/services/farmers';
import { Loader2, AlertCircle, MapPin, Users } from 'lucide-react'; // Am adăugat MapPin, Users și am scos ce nu e folosit
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Eliminăm ID-ul hardcodat
// const currentFarmerId = 'farmer1';

// Definim tipurile necesare
interface VillageFarmerStat {
  name: string;
  farmerId: string;
  ownedArea: number;
  cultivatedArea: number;
  color?: string | null;
}

interface VillageData {
  farmers: VillageFarmerStat[];
  totalOwnedArea: number;
  totalCultivatedArea: number;
  unassignedParcels: { id: string; area: number }[];
}

export default function FarmerDashboard() {
  const { data: session, status } = useSession(); // Obținem sesiunea și statusul

  // State pentru datele fermierului curent
  const [currentFarmer, setCurrentFarmer] = useState<Omit<Farmer, 'password'> | null>(null);
  const [ownedParcels, setOwnedParcels] = useState<Parcel[]>([]);
  const [cultivatedParcels, setCultivatedParcels] = useState<Parcel[]>([]);

  // State pentru datele satului selectat
  const [selectedVillage, setSelectedVillage] = useState<string | null>(null);
  const [villageDataMap, setVillageDataMap] = useState<Record<string, VillageData>>({}); // Cache pentru datele satelor
  const [availableVillages, setAvailableVillages] = useState<string[]>([]); // Satele în care operează fermierul

  // State-uri de încărcare și eroare
  const [loadingInitial, setLoadingInitial] = useState(true); // Pentru datele inițiale ale fermierului
  const [loadingVillage, setLoadingVillage] = useState(false); // Pentru datele specifice satului selectat
  const [error, setError] = useState<string | null>(null);

  // Extragem ID-ul fermierului autentificat
  const actualFarmerId = (session?.user as any)?.id;

  // ---- Efect 1: Încărcare date inițiale (Fermier, Parcele proprii/cultivate) ----
  useEffect(() => {
    const fetchInitialData = async () => {
      // Rulăm doar dacă sesiunea e gata și utilizatorul e autentificat
      if (status === 'authenticated' && actualFarmerId) {
        setLoadingInitial(true);
        setError(null);
        try {
          console.log(`[FarmerDashboard] Fetching initial data for farmer ID: ${actualFarmerId}`);
          // Luăm toate datele inițiale în paralel
          const [farmerData, ownedData, cultivatedData] = await Promise.all([
            getFarmerById(actualFarmerId),
            getParcelsByOwner(actualFarmerId),
            getParcelsByCultivator(actualFarmerId)
          ]);

          if (!farmerData) {
            throw new Error("Datele agricultorului nu au fost găsite.");
          }

          setCurrentFarmer(farmerData);
          setOwnedParcels(ownedData);
          setCultivatedParcels(cultivatedData);

          // Setăm satul inițial selectat ca fiind satul fermierului
          setSelectedVillage(farmerData.village);

          // Determinăm satele disponibile (din satul propriu + satele parcelelor)
          const villages = new Set<string>();
          villages.add(farmerData.village);
          ownedData.forEach(p => villages.add(p.village));
          cultivatedData.forEach(p => villages.add(p.village));
          setAvailableVillages(Array.from(villages).sort());

        } catch (err) {
          console.error("Error fetching initial farmer data:", err);
          setError(err instanceof Error ? err.message : "Nu s-au putut încărca datele inițiale.");
          // Reset state on error
          setCurrentFarmer(null);
          setOwnedParcels([]);
          setCultivatedParcels([]);
          setSelectedVillage(null);
          setAvailableVillages([]);
        } finally {
          setLoadingInitial(false);
        }
      } else if (status === 'unauthenticated') {
        setError("Acces neautorizat.");
        setLoadingInitial(false);
      }
      // Nu facem nimic dacă status === 'loading'
    };

    // Apelăm doar când statusul NU este loading
    if (status !== 'loading') {
      fetchInitialData();
    }

  }, [status, actualFarmerId]); // Dependențe: statusul sesiunii și ID-ul fermierului


  // ---- Efect 2: Încărcare date pentru satul selectat ----
  useEffect(() => {
    if (!selectedVillage || status !== 'authenticated') return; // Nu face fetch dacă nu avem sat sau nu suntem logați

    // Verificăm cache-ul înainte de fetch
    if (villageDataMap[selectedVillage]) {
      console.log(`[FarmerDashboard] Using cached data for village: ${selectedVillage}`);
      setLoadingVillage(false); // Oprim loading dacă avem cache
      return;
    }

    const fetchVillageData = async () => {
      setLoadingVillage(true);
      // Nu setăm eroare aici, gestionăm în blocul principal de render
      console.log(`[FarmerDashboard] Fetching data for selected village: ${selectedVillage}`);
      try {
        const [parcels, farmers] = await Promise.all([
          getParcelsByVillage(selectedVillage),
          getAllFarmers(selectedVillage)
        ]);

        // Procesăm datele (similar cu MayorStatsPage)
        const farmerStatsMap = new Map<string, VillageFarmerStat>();
        let totalOwned = 0;
        let totalCultivated = 0;
        const unassigned: { id: string; area: number }[] = [];

        farmers.forEach(f => {
          farmerStatsMap.set(f.id, { farmerId: f.id, name: f.name, ownedArea: 0, cultivatedArea: 0, color: f.color });
        });

        parcels.forEach(p => {
          let owned = false;
          if (p.ownerId) {
            const stats = farmerStatsMap.get(p.ownerId);
            if (stats) { stats.ownedArea += p.area; owned = true; }
            totalOwned += p.area;
          }
          if (p.cultivatorId) {
            const stats = farmerStatsMap.get(p.cultivatorId);
            if (stats) { stats.cultivatedArea += p.area; }
            totalCultivated += p.area;
          }
          if (!owned && p.ownerId === null) { // Considerăm neasignată doar dacă ownerId e explicit null
            unassigned.push({ id: p.id, area: p.area });
          }
        });

        const newVillageData: VillageData = {
          farmers: Array.from(farmerStatsMap.values()),
          totalOwnedArea: totalOwned,
          totalCultivatedArea: totalCultivated,
          unassignedParcels: unassigned,
        };
        // Actualizăm cache-ul
        setVillageDataMap(prev => ({ ...prev, [selectedVillage]: newVillageData }));

      } catch (err) {
        console.error(`Error fetching data for village ${selectedVillage}:`, err);
        // Putem seta o eroare specifică satului sau lăsa componenta să afișeze un mesaj
        setVillageDataMap(prev => ({
          ...prev, [selectedVillage]: { // Marcăm ca eroare în cache
            farmers: [], totalOwnedArea: 0, totalCultivatedArea: 0, unassignedParcels: [], error: err instanceof Error ? err.message : "Eroare necunoscută"
          } as any
        })); // Folosim 'as any' temporar pentru a adăuga câmpul 'error'
      } finally {
        setLoadingVillage(false);
      }
    };

    fetchVillageData();

  }, [selectedVillage, status, villageDataMap]); // Dependențe: satul selectat, statusul sesiunii, și cache-ul (pt a nu refetch inutil)


  // ---- Calcule Memoizate ----
  const totalOwnedArea = useMemo(() => ownedParcels.reduce((sum, parcel) => sum + parcel.area, 0), [ownedParcels]);
  const totalCultivatedArea = useMemo(() => cultivatedParcels.reduce((sum, parcel) => sum + parcel.area, 0), [cultivatedParcels]);
  const currentVillageStats = selectedVillage ? villageDataMap[selectedVillage] : null;

  // ---- Funcții Render Helper ----
  const renderLoading = (text = "Se încarcă...") => (
    <div className="flex items-center justify-center p-4 text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{text}
    </div>
  );

  const renderErrorAlert = (errorMsg: string | null, title = "Eroare") => (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{errorMsg || "A apărut o eroare necunoscută."}</AlertDescription>
    </Alert>
  );

  // ---- Gestionare Stări Principale ----
  if (status === 'loading' || loadingInitial) {
    // Skeleton pentru întreaga pagină
    return (
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        <Card className="shadow-md"><CardHeader><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32 mt-1" /></CardHeader><CardContent className="grid grid-cols-2 gap-4"><div><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-24 mt-1" /></div><div><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-24 mt-1" /></div></CardContent></Card>
        <Card className="shadow-md"><CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-48 mt-1" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card className="shadow-md"><CardHeader><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56 mt-1" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return renderErrorAlert("Acces neautorizat. Vă rugăm să vă autentificați.", "Neautentificat");
  }

  if (error || !currentFarmer) {
    return renderErrorAlert(error, "Eroare la Încărcarea Datelor");
  }

  // --- Randarea Principală ---
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Farmer Summary - Folosește datele din state */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Bun venit, {currentFarmer.name}!</CardTitle>
          <CardDescription>Cod Fiscal: {currentFarmer.companyCode} | Sat principal: {currentFarmer.village}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Suprafață Totală Deținută</p>
            <p className="text-2xl font-bold">{totalOwnedArea.toFixed(2)} ha</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Suprafață Totală Prelucrată</p>
            <p className="text-2xl font-bold">{totalCultivatedArea.toFixed(2)} ha</p>
          </div>
        </CardContent>
      </Card>

      {/* Parcel Information */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Parcelele Mele</CardTitle>
          <CardDescription>Vizualizare detaliată a terenurilor deținute și prelucrate.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="owned" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="owned">Deținute ({ownedParcels.length})</TabsTrigger>
              <TabsTrigger value="cultivated">Prelucrate ({cultivatedParcels.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="owned">
              <ScrollArea className="h-[250px] rounded-md border mt-4">
                <Table><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Cod Cadastral</TableHead><TableHead className="text-right">Suprafață (ha)</TableHead><TableHead>Sat</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ownedParcels.length > 0 ? ownedParcels.map((parcel) => (
                      <TableRow key={parcel.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{parcel.id}</TableCell>
                        <TableCell className="text-right">{parcel.area.toFixed(2)}</TableCell>
                        <TableCell>{parcel.village}</TableCell>
                      </TableRow>
                    )) : (<TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nu s-au găsit parcele deținute.</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="cultivated">
              <ScrollArea className="h-[250px] rounded-md border mt-4">
                <Table><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Cod Cadastral</TableHead><TableHead className="text-right">Suprafață (ha)</TableHead><TableHead>Sat</TableHead><TableHead>Proprietar</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {cultivatedParcels.length > 0 ? cultivatedParcels.map((parcel) => {
                      // Folosim ID-ul real al fermierului autentificat pentru comparație
                      const ownerDisplay = parcel.ownerId === actualFarmerId ? 'Propriu' : `Altul`; // Nu mai afișăm ID-ul celuilalt proprietar
                      return (
                        <TableRow key={parcel.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{parcel.id}</TableCell>
                          <TableCell className="text-right">{parcel.area.toFixed(2)}</TableCell>
                          <TableCell>{parcel.village}</TableCell>
                          <TableCell>
                            <Badge variant={parcel.ownerId === actualFarmerId ? 'default' : 'secondary'}>
                              {ownerDisplay}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (<TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nu s-au găsit parcele prelucrate.</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Village Information */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle>Prezentare Generală Sat: {selectedVillage || 'Selectați Sat'}</CardTitle>
              <CardDescription>Statistici și detalii despre parcelele din satul selectat.</CardDescription>
            </div>
            <Select
              onValueChange={(value) => { if (value) setSelectedVillage(value); }} // Asigurăm că nu setăm null/undefined
              value={selectedVillage ?? ''}
              // Dezactivăm dacă nu există sat selectat sau avem doar un sat
              disabled={!selectedVillage || availableVillages.length <= 1}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Selectați un sat" />
              </SelectTrigger>
              <SelectContent>
                {availableVillages.length > 0 ? availableVillages.map(village => (
                  <SelectItem key={village} value={village}>{village}</SelectItem>
                )) : (
                  // Afișăm satul curent dacă nu sunt altele disponibile
                  selectedVillage && <SelectItem value={selectedVillage} disabled>{selectedVillage}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Afișăm loading specific pentru datele satului */}
          {loadingVillage ? renderLoading("Se încarcă datele satului...") : !currentVillageStats ? (
            <p className="text-muted-foreground text-center py-4">Nu s-au putut încărca datele pentru satul {selectedVillage} sau nu există date.</p>
          ) : (currentVillageStats as any).error ? ( // Verificăm dacă am marcat cu eroare în cache
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Eroare</AlertTitle><AlertDescription>{(currentVillageStats as any).error}</AlertDescription></Alert>
          ) : (
            <>
              <Tabs defaultValue="villageOwnedStats" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="villageOwnedStats">Statistici Deținute</TabsTrigger>
                  <TabsTrigger value="villageCultivatedStats">Statistici Prelucrate</TabsTrigger>
                </TabsList>
                <TabsContent value="villageOwnedStats">
                  <p className="mb-2 text-sm">Suprafață Totală Deținută în {selectedVillage}: <strong className="text-base">{currentVillageStats.totalOwnedArea.toFixed(2)} ha</strong></p>
                  <ScrollArea className="h-[200px] rounded-md border">
                    <Table><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Agricultor</TableHead><TableHead className="text-right">Suprafață Deținută (ha)</TableHead><TableHead className="w-[20px]"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {currentVillageStats.farmers.length > 0 ? currentVillageStats.farmers.map((farmer) => (
                          <TableRow key={farmer.farmerId} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{farmer.name} {farmer.farmerId === actualFarmerId && <Badge variant="outline" className="ml-2">Dvs.</Badge>}</TableCell>
                            <TableCell className="text-right">{farmer.ownedArea.toFixed(2)}</TableCell>
                            <TableCell><span className="inline-block w-3 h-3 rounded-full border" style={{ backgroundColor: farmer.color || 'transparent' }}></span></TableCell>
                          </TableRow>
                        )) : null}
                        {currentVillageStats.unassignedParcels.length > 0 && (
                          <TableRow className="bg-muted/30 hover:bg-muted/50"><TableCell className="font-medium text-muted-foreground italic">Parcele Neatribuite</TableCell><TableCell className="text-right text-muted-foreground italic">{currentVillageStats.unassignedParcels.reduce((sum, p) => sum + p.area, 0).toFixed(2)}</TableCell><TableCell><span className="inline-block w-3 h-3 rounded-full bg-gray-300 opacity-50"></span></TableCell></TableRow>
                        )}
                        {currentVillageStats.farmers.length === 0 && currentVillageStats.unassignedParcels.length === 0 && (
                          <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nu există date despre proprietari în acest sat.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="villageCultivatedStats">
                  <p className="mb-2 text-sm">Suprafață Totală Prelucrată în {selectedVillage}: <strong className="text-base">{currentVillageStats.totalCultivatedArea.toFixed(2)} ha</strong></p>
                  <ScrollArea className="h-[200px] rounded-md border">
                    <Table><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Agricultor</TableHead><TableHead className="text-right">Suprafață Prelucrată (ha)</TableHead><TableHead className="w-[20px]"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {currentVillageStats.farmers.filter(f => f.cultivatedArea > 0).length > 0 ? currentVillageStats.farmers.filter(f => f.cultivatedArea > 0).map((farmer) => (
                          <TableRow key={farmer.farmerId} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{farmer.name} {farmer.farmerId === actualFarmerId && <Badge variant="outline" className="ml-2">Dvs.</Badge>}</TableCell>
                            <TableCell className="text-right">{farmer.cultivatedArea.toFixed(2)}</TableCell>
                            <TableCell><span className="inline-block w-3 h-3 rounded-full border" style={{ backgroundColor: farmer.color || 'transparent' }}></span></TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nu există date despre cultivatori în acest sat.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              <div className="mt-4 text-center">
                <Link href={`/farmer/map?village=${selectedVillage}`} passHref>
                  <Button variant="outline">Vezi {selectedVillage} pe Hartă</Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Funcțiile renderLoading și renderError pot fi șterse dacă nu mai sunt folosite explicit
// Dar scheletul general de pagină le folosește, deci le păstrăm definite deocamdată
const renderLoading = (text = "Se încarcă...") => (
  <div className="flex items-center justify-center p-4 text-muted-foreground">
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{text}
  </div>
);

const renderErrorAlert = (errorMsg: string | null, title = "Eroare") => (
  <Alert variant="destructive" className="my-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{errorMsg || "A apărut o eroare necunoscută."}</AlertDescription>
  </Alert>
);