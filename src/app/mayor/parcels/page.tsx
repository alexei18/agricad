'use client';


import { BackButton } from '@/components/ui/back-button';
import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    getParcelsByVillage,
    Parcel,
    assignParcelsToFarmer,
    ParcelAssignmentConflict,
    AssignmentResult
} from '@/services/parcels';
import { getAllFarmers, Farmer } from '@/services/farmers';
import { MapPin, Loader2, AlertCircle, Edit3, Users, Landmark, Tractor } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

const ParcelMapWithNoSSR = dynamic(() =>
    import('@/components/maps/parcel-map').then((mod) => mod.ParcelMap),
    {
        ssr: false,
        loading: () => (
            <div className="h-[500px] w-full border rounded-md bg-muted/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Se încarcă harta...</p>
            </div>
        ),
    }
);

export default function MayorParcelsPage() {
    const { data: session, status } = useSession();

    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [farmers, setFarmers] = useState<Omit<Farmer, 'password'>[]>([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState<string>('');

    const [newOwnedCodesInput, setNewOwnedCodesInput] = useState('');
    const [newCultivatedCodesInput, setNewCultivatedCodesInput] = useState('');

    const [isAssigning, setIsAssigning] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCultivatedAssignment, setShowCultivatedAssignment] = useState(false);
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);

    const [assignmentConflicts, setAssignmentConflicts] = useState<ParcelAssignmentConflict[]>([]);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [conflictResolutions, setConflictResolutions] = useState<Record<string, 'force' | 'keep'>>({});
    const [pendingOwnedParcels, setPendingOwnedParcels] = useState<string[]>([]);
    const [pendingCultivatedParcels, setPendingCultivatedParcels] = useState<string[]>([]);


    const actualMayorId = (session?.user as any)?.id;
    const actualMayorVillage = (session?.user as any)?.village;

    const fetchData = useCallback(async (village: string) => {
        setLoadingData(true); setError(null);
        try {
            const [parcelsData, farmersData] = await Promise.all([
                getParcelsByVillage(village),
                getAllFarmers(village)
            ]);
            setParcels(parcelsData);
            setFarmers(farmersData as Omit<Farmer, 'password'>[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to load data for ${village}.`);
            setParcels([]); setFarmers([]);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        setIsClient(true);
        if (status === 'authenticated' && actualMayorVillage) {
            fetchData(actualMayorVillage);
        } else if (status === 'unauthenticated') {
             setError("Acces neautorizat."); setLoadingData(false);
        }
    }, [status, actualMayorVillage, fetchData]);

    useEffect(() => {
        setNewOwnedCodesInput('');
        setNewCultivatedCodesInput('');
    }, [selectedFarmerId]);


    const handleAssignment = async (forceTheAssignments: boolean = false, conflictResolutionData?: { owned: string[], cultivated: string[] }) => {
        if (!selectedFarmerId) {
            toast({ variant: "destructive", title: "Eroare", description: "Selectați un agricultor." }); return;
        }

        const parseCodes = (codesString: string): string[] =>
            codesString.split(/[\s,;\n]+/).map(code => code.trim()).filter(Boolean);

        let newOwnedToAdd: string[];
        let newCultivatedToAdd: string[];

        if (forceTheAssignments && conflictResolutionData) {
            newOwnedToAdd = conflictResolutionData.owned;
            newCultivatedToAdd = conflictResolutionData.cultivated;
        } else {
            newOwnedToAdd = parseCodes(newOwnedCodesInput);
            newCultivatedToAdd = showCultivatedAssignment ? parseCodes(newCultivatedCodesInput) : [];
        }

        if (!forceTheAssignments && newOwnedToAdd.length === 0 && newCultivatedToAdd.length === 0) {
            toast({
                variant: "default", // Corectat de la "info"
                title: "Info",
                description: "Nu ați introdus niciun cod nou de parcelă pentru atribuire."
            });
            return;
        }
        
        const currentlyOwnedByFarmer = parcels
            .filter(p => p.ownerId === selectedFarmerId)
            .map(p => p.id);
        const finalDesiredOwnedIds = [...new Set([...currentlyOwnedByFarmer, ...newOwnedToAdd])];

        let finalDesiredCultivatedIds: string[] = [];
        if (showCultivatedAssignment || (forceTheAssignments && conflictResolutionData)) {
            const currentlyCultivatedByFarmer = parcels
                .filter(p => p.cultivatorId === selectedFarmerId)
                .map(p => p.id);
            finalDesiredCultivatedIds = [...new Set([...currentlyCultivatedByFarmer, ...newCultivatedToAdd])];
        } else {
             finalDesiredCultivatedIds = parcels
                .filter(p => p.cultivatorId === selectedFarmerId)
                .map(p => p.id);
             if (newCultivatedToAdd.length > 0) {
                 finalDesiredCultivatedIds = [...new Set([...finalDesiredCultivatedIds, ...newCultivatedToAdd])];
             }
        }

        const allVillageParcelIdsSet = new Set(parcels.map(p => p.id));
        // Verificăm doar codurile NOI introduse dacă există în sat,
        // deoarece cele existente ale fermierului sunt deja validate.
        const allNewAttemptedIds = [...new Set([...newOwnedToAdd, ...newCultivatedToAdd])];
        const invalidNewIds = allNewAttemptedIds.filter(id => !allVillageParcelIdsSet.has(id));


        if (invalidNewIds.length > 0) {
           const invalidList = invalidNewIds.join(', ');
           toast({ variant: "destructive", title: "Coduri Noi Invalide", description: `Următoarele coduri noi introduse nu aparțin satului ${actualMayorVillage}: ${invalidList}.`, duration: 7000 });
           return;
        }
        
        if (!forceTheAssignments) {
            setPendingOwnedParcels(newOwnedToAdd);
            setPendingCultivatedParcels(newCultivatedToAdd);
        }

        setIsAssigning(true);
        try {
            // console.log("--- Frontend: Sending to assignParcelsToFarmer ---");
            // console.log("Target Farmer ID:", selectedFarmerId);
            // console.log("FINAL Desired Owned IDs:", finalDesiredOwnedIds);
            // console.log("FINAL Desired Cultivated IDs:", finalDesiredCultivatedIds);
            // console.log("Force Assignments:", forceTheAssignments);

            const result: AssignmentResult = await assignParcelsToFarmer(
                selectedFarmerId,
                finalDesiredOwnedIds,
                finalDesiredCultivatedIds,
                actualMayorId,
                forceTheAssignments
            );

            if (result.success) {
                toast({ title: "Succes", description: result.message || `Parcelele pentru ${farmers.find(f => f.id === selectedFarmerId)?.name} au fost actualizate.` });
                setNewOwnedCodesInput('');
                setNewCultivatedCodesInput('');
                if (actualMayorVillage) await fetchData(actualMayorVillage);
                setShowConflictDialog(false); setAssignmentConflicts([]); setConflictResolutions({});
            } else if (result.conflicts && result.conflicts.length > 0) {
                setAssignmentConflicts(result.conflicts);
                const initialResolutions: Record<string, 'keep'> = {};
                result.conflicts.forEach(conflict => {
                    initialResolutions[conflict.parcelId + '_' + conflict.attemptedAssignmentType] = 'keep';
                });
                setConflictResolutions(initialResolutions);
                setShowConflictDialog(true);
                toast({ variant: "default", title: "Conflicte de Atribuire", description: "Vă rugăm rezolvați conflictele.", duration: 7000 });
            } else {
                throw new Error(result.error || "Eroare la atribuirea parcelelor.");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Eroare Atribuire", description: error instanceof Error ? error.message : "Eroare necunoscută." });
        } finally {
            setIsAssigning(false);
        }
    };

    const handleConflictResolution = () => {
        let resolvedOwned = parcels.filter(p => p.ownerId === selectedFarmerId).map(p => p.id);
        let resolvedCultivated = parcels.filter(p => p.cultivatorId === selectedFarmerId).map(p => p.id);

        assignmentConflicts.forEach(conflict => {
            const key = conflict.parcelId + '_' + conflict.attemptedAssignmentType;
            if (conflictResolutions[key] === 'force') {
                if (conflict.attemptedAssignmentType === 'owner') {
                    resolvedOwned.push(conflict.parcelId);
                } else if (conflict.attemptedAssignmentType === 'cultivator') {
                    resolvedCultivated.push(conflict.parcelId);
                }
            }
        });

        pendingOwnedParcels.forEach(id => {
            if (!assignmentConflicts.some(c => c.parcelId === id && c.attemptedAssignmentType === 'owner' && conflictResolutions[c.parcelId + '_' + c.attemptedAssignmentType] === 'keep')) {
                resolvedOwned.push(id);
            }
        });
        if (showCultivatedAssignment) {
            pendingCultivatedParcels.forEach(id => {
                if (!assignmentConflicts.some(c => c.parcelId === id && c.attemptedAssignmentType === 'cultivator' && conflictResolutions[c.parcelId + '_' + c.attemptedAssignmentType] === 'keep')) {
                    resolvedCultivated.push(id);
                }
            });
        }

        setShowConflictDialog(false);
        handleAssignment(true, { owned: [...new Set(resolvedOwned)], cultivated: [...new Set(resolvedCultivated)] });
    };

    const updateConflictResolution = (parcelId: string, type: 'owner' | 'cultivator', resolution: 'force' | 'keep') => {
        setConflictResolutions(prev => ({ ...prev, [parcelId + '_' + type]: resolution }));
    };


    if (status === 'loading') return <div className="flex-1 p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Se încarcă sesiunea...</p></div>;
    if (status === 'unauthenticated') return <div className="flex-1 p-6">{renderErrorAlertForContent("Acces neautorizat.", "Neautentificat")}</div>;
    if (error && !loadingData) return <div className="flex-1 p-6">{renderErrorAlertForContent(error, "Eroare Date")}</div>; // Afișează eroarea doar dacă nu mai e loadingData
    if (!actualMayorVillage && !loadingData) return <div className="flex-1 p-6">{renderErrorAlertForContent("Satul primarului este indisponibil.", "Eroare Configurare")}</div>;
    if (loadingData || !isClient) return <div className="flex-1 p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">{loadingData ? "Se încarcă datele..." : "Se pregătește interfața..."}</p></div>;


    return (
        <div className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="mb-4">
                <BackButton />
            </div>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Edit3 className="h-5 w-5"/> Gestionează Parcelele din {actualMayorVillage}</CardTitle>
                    <CardDescription>Introduceți doar codurile cadastrale NOI pe care doriți să le adăugați fermierului selectat. Cele existente vor fi păstrate.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6">
                     <Card className="bg-muted/30">
                         <CardHeader> <CardTitle className="text-lg">Adaugă Parcele unui Agricultor</CardTitle> </CardHeader>
                         <CardContent className="space-y-4">
                             {farmers.length > 0 ? (
                                 <div className="space-y-2">
                                     <Label htmlFor="farmer-select">Selectează Agricultor</Label>
                                     <Select value={selectedFarmerId} onValueChange={setSelectedFarmerId} disabled={isAssigning}>
                                         <SelectTrigger id="farmer-select" className="w-full max-w-sm"><SelectValue placeholder="Alege un agricultor..." /></SelectTrigger>
                                         <SelectContent>{farmers.map((f) => (<SelectItem key={f.id} value={f.id}><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border" style={{ backgroundColor: f.color || 'transparent' }}></span>{f.name} ({f.companyCode})</div></SelectItem>))}</SelectContent>
                                     </Select>
                                 </div>
                             ) : <p className="text-sm text-muted-foreground">Nu există agricultori.</p> }
                             <div className="grid grid-cols-1 gap-4">
                                 <div className="space-y-2">
                                     <Label htmlFor="new-owned-codes-input" className="flex items-center gap-1"><Landmark className="h-4 w-4"/> Parcele Noi Deținute (Coduri)</Label>
                                     <Textarea id="new-owned-codes-input" placeholder="Coduri noi de adăugat..." value={newOwnedCodesInput} onChange={(e) => setNewOwnedCodesInput(e.target.value)} rows={3} disabled={!selectedFarmerId || isAssigning} />
                                 </div>
                                 <div className="flex items-center space-x-2 mb-1">
                                     <Switch id="toggle-cultivated" checked={showCultivatedAssignment} onCheckedChange={setShowCultivatedAssignment} disabled={!selectedFarmerId || isAssigning} />
                                     <Label htmlFor="toggle-cultivated" className="cursor-pointer text-sm">Specifică și parcele prelucrate (noi)</Label>
                                 </div>
                                  {showCultivatedAssignment && (
                                     <div className="space-y-2">
                                         <Label htmlFor="new-cultivated-codes-input" className="flex items-center gap-1"><Tractor className="h-4 w-4"/> Parcele Noi Prelucrate (Coduri)</Label>
                                         <Textarea id="new-cultivated-codes-input" placeholder="Coduri noi de adăugat..." value={newCultivatedCodesInput} onChange={(e) => setNewCultivatedCodesInput(e.target.value)} rows={3} disabled={!selectedFarmerId || isAssigning}/>
                                     </div>
                                  )}
                             </div>
                             <Button onClick={() => handleAssignment(false)} disabled={!selectedFarmerId || isAssigning || (!newOwnedCodesInput.trim() && (!showCultivatedAssignment || !newCultivatedCodesInput.trim()))}>
                                 {isAssigning && !showConflictDialog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Adaugă Parcele
                             </Button>
                         </CardContent>
                     </Card>

                    <Card>
                         <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5"/> Hartă Parcele Sat</CardTitle></CardHeader>
                         <CardContent>
                             <div className="border rounded-md h-[500px] overflow-hidden relative bg-muted/10">
                                 {isClient && actualMayorVillage ? (
                                    <ParcelMapWithNoSSR
                                        parcels={parcels} village={actualMayorVillage} farmers={farmers as Farmer[]} // Asigură-te că tipul Farmer e complet aici dacă ParcelMap îl așteaptă
                                        mapViewType="satellite" showAllFarmersColors={true} // Pentru primar, arătăm mereu toate culorile
                                    />
                                 ) : ( <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/><p className="ml-2">Se pregătește harta...</p></div> )}
                             </div>
                         </CardContent>
                     </Card>
                     <Card>
                         <CardHeader><CardTitle className="text-lg">Listă Parcele Atribuite</CardTitle><CardDescription>Detalii pentru {actualMayorVillage}. Filtrează după agricultorul selectat mai sus.</CardDescription></CardHeader>
                         <CardContent>
                             <ScrollArea className="h-[400px] rounded-md border">
                                 {parcels.length > 0 ? (
                                     <Table><TableHeader className="sticky top-0 bg-background z-10"><TableRow><TableHead>Cod</TableHead><TableHead className="text-right">Supraf. (ha)</TableHead><TableHead>Proprietar</TableHead><TableHead>Cultivator</TableHead></TableRow></TableHeader>
                                         <TableBody>
                                             {parcels.map((p) => {
                                                 const owner = farmers.find(f => f.id === p.ownerId);
                                                 const cultivator = farmers.find(f => f.id === p.cultivatorId);
                                                 const isSelectedFarmerRelated = selectedFarmerId && (p.ownerId === selectedFarmerId || p.cultivatorId === selectedFarmerId);
                                                 return (
                                                     <TableRow key={p.id} className={isSelectedFarmerRelated ? 'bg-blue-50 dark:bg-blue-900/30' : ''}>
                                                         <TableCell className="font-medium">{p.id}</TableCell>
                                                         <TableCell className="text-right">{p.area.toFixed(2)}</TableCell>
                                                         <TableCell>{owner ? (<Badge variant={owner.id === selectedFarmerId ? "default" : "secondary"} style={owner.color ? { backgroundColor: owner.color, color: (owner.id === selectedFarmerId || !owner.color.startsWith('hsl')) ? 'white': 'hsl(var(--secondary-foreground))' } : {}}><span className="w-2 h-2 rounded-full mr-1 inline-block" style={{ backgroundColor: owner.color || 'transparent', border: '1px solid #ccc' }}></span>{owner.name}</Badge>) : (<span className="text-xs text-muted-foreground">Liber</span>)}</TableCell>
                                                         <TableCell>{cultivator ? (<Badge variant={cultivator.id === selectedFarmerId ? "default" : "outline"} style={cultivator.color ? { borderColor: cultivator.color, color: (cultivator.id === selectedFarmerId && cultivator.color.startsWith('hsl')? 'white' : cultivator.color), backgroundColor: (cultivator.id === selectedFarmerId ? cultivator.color : undefined) } : {}}><span className="w-2 h-2 rounded-full mr-1 inline-block" style={{ backgroundColor: cultivator.color || 'transparent', border: '1px solid #ccc' }}></span>{cultivator.id === owner?.id ? 'Proprietar' : cultivator.name}</Badge>) : (<span className="text-xs text-muted-foreground">N/A</span>)}</TableCell>
                                                     </TableRow>
                                                 );
                                             })}
                                         </TableBody>
                                     </Table>
                                 ) : ( <div className="p-4 text-center text-muted-foreground">Nicio parcelă înregistrată în {actualMayorVillage}.</div> )}
                             </ScrollArea>
                         </CardContent>
                     </Card>

                    <Dialog open={showConflictDialog} onOpenChange={(isOpen) => {
                        if (!isOpen) { setShowConflictDialog(false); setAssignmentConflicts([]); setConflictResolutions({}); }
                        else { setShowConflictDialog(true); }
                    }}>
                        <DialogContent className="sm:max-w-[650px]">
                            <DialogHeader>
                                <DialogTitle>Rezolvare Conflicte de Atribuire</DialogTitle>
                                <DialogDescription>Următoarele parcele noi sunt deja atribuite. Alegeți cum procedați pentru fiecare.</DialogDescription>
                            </DialogHeader>
                            <div className="py-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {assignmentConflicts.map((conflict) => { // Nu mai e nevoie de index aici
                                    const currentAssigneeName = conflict.attemptedAssignmentType === 'owner' ? conflict.currentOwnerName : conflict.currentCultivatorName;
                                    const conflictKey = conflict.parcelId + '_' + conflict.attemptedAssignmentType;
                                    const targetFarmer = farmers.find(f => f.id === conflict.attemptingToAssignToFarmerId);
                                    return (
                                        <div key={conflictKey} className="p-3 border rounded-md space-y-1 text-sm"> {/* Folosește conflictKey ca și cheie */}
                                            <p>Parcela: <Badge variant="outline">{conflict.parcelId}</Badge></p>
                                            <p>Tip atribuire încercat: <span className="font-medium capitalize">{conflict.attemptedAssignmentType}</span></p>
                                            <p>Deja atribuită lui: <Badge variant="secondary">{currentAssigneeName || 'N/A'}</Badge></p>
                                            <p>Se încearcă adăugarea pentru: <Badge>{targetFarmer?.name || 'N/A'}</Badge></p>
                                            <div className="mt-2 pt-2 border-t flex items-center justify-end space-x-3">
                                                <Label className="mr-auto">Acțiune dorită:</Label>
                                                <Button variant={conflictResolutions[conflictKey] === 'force' ? "destructive" : "outline"} size="sm" onClick={() => updateConflictResolution(conflict.parcelId, conflict.attemptedAssignmentType, 'force')}>Forțează pt. {targetFarmer?.name.split(' ')[0]}</Button>
                                                <Button variant={conflictResolutions[conflictKey] === 'keep' ? "default" : "outline"} size="sm" onClick={() => updateConflictResolution(conflict.parcelId, conflict.attemptedAssignmentType, 'keep')}>Păstrează pt. {currentAssigneeName?.split(' ')[0] || 'Actual'}</Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="ghost" onClick={() => { setAssignmentConflicts([]); setConflictResolutions({}); }}>Anulează</Button></DialogClose>
                                <Button type="button" onClick={handleConflictResolution} disabled={isAssigning}>{isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmă Rezoluțiile</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                 </CardContent>
            </Card>
        </div>
    );
}

const renderErrorAlertForContent = (errorMsg: string | null, title = "Eroare") => ( <Alert variant="destructive"> <AlertCircle className="h-4 w-4" /> <AlertTitle>{title}</AlertTitle> <AlertDescription>{errorMsg || "A apărut o eroare."}</AlertDescription> </Alert> );