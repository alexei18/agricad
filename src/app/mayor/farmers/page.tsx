'use client';

import { BackButton } from '@/components/ui/back-button'; 
import React, { useEffect, useState } from 'react'; // Am scos React. din fața hook-urilor
import { useSession } from 'next-auth/react';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FarmerTable } from '@/app/admin/farmers/components/farmer-table'; // Reuse admin table
import { Skeleton } from '@/components/ui/skeleton';
import { Users, PlusCircle, Loader2, AlertCircle, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addFarmer } from '@/services/farmers';
import { useToast } from '@/hooks/use-toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
// getMayorById nu mai este necesar aici, satul și ID-ul vin din sesiune
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Culorile predefinite rămân la fel
const PREDEFINED_COLORS = [
  'hsl(217, 91%, 60%)', // Blue
  'hsl(122, 39%, 49%)', // Green
  'hsl(40, 90%, 60%)',  // Yellowish
  'hsl(0, 70%, 65%)',   // Reddish
  'hsl(260, 60%, 60%)', // Purplish
  'hsl(180, 50%, 50%)', // Teal
  'hsl(30, 90%, 55%)',  // Orange
  'hsl(320, 70%, 60%)', // Pink
  'hsl(240, 5%, 65%)',  // Gray
];

// --- ADAUGĂ ACEASTĂ FUNCȚIE ---
function FarmerTableSkeleton({ villageFilter = '' }: { villageFilter?: string }) {
  // Numărul de coloane (cells) ar trebui să corespundă cu numărul real din FarmerTable
  const numberOfColumns = 7; // Ajustează dacă FarmerTable are alt număr de coloane

  return (
    <div className="space-y-3">
      {/* Skeleton pentru controalele de sus (ex: filtru, buton adăugare) */}
      <div className="flex items-center justify-between py-4">
        <Skeleton className="h-10 w-full max-w-sm" /> {/* Skeleton pentru filtru */}
        <Skeleton className="h-10 w-28" /> {/* Skeleton pentru buton */}
      </div>
      {/* Skeleton pentru tabelă */}
      <div className="rounded-md border">
        <TableSkeleton rows={5} cells={numberOfColumns} /> {/* Folosește TableSkeleton existent */}
      </div>
      {/* Skeleton pentru controalele de jos (ex: paginare) */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-5 w-28 flex-1" /> {/* Text 'x din y selectate' */}
        <Skeleton className="h-10 w-16" /> {/* Buton Prev */}
        <Skeleton className="h-10 w-16" /> {/* Buton Next */}
      </div>
    </div>
  );
}
// --- SFÂRȘITUL FUNCȚIEI ADAUGATE ---

// Definiția existentă (asigură-te că e și ea aici)
function TableSkeleton({ rows = 5, cells = 5 }: { rows?: number, cells?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {[...Array(cells)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(rows)].map((_, i) => (
          <TableRow key={i}>
            {[...Array(cells)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function MayorFarmersPage() {
  const { data: session, status } = useSession(); // Obținem sesiunea și statusul

  // State-uri specifice paginii
  const [isAddFarmerOpen, setIsAddFarmerOpen] = useState(false);
  const [newFarmerName, setNewFarmerName] = useState('');
  const [newFarmerCode, setNewFarmerCode] = useState('');
  const [newFarmerEmail, setNewFarmerEmail] = useState('');
  const [newFarmerPhone, setNewFarmerPhone] = useState('');
  const [newFarmerPassword, setNewFarmerPassword] = useState('');
  const [newFarmerColor, setNewFarmerColor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tableKey, setTableKey] = useState(Date.now()); // Pentru refresh tabelă
  const { toast } = useToast();

  // Extragem datele necesare din sesiune odată ce e autentificată
  const actualMayorId = (session?.user as any)?.id;
  const mayorVillage = (session?.user as any)?.village;

  // Textele pot rămâne definite aici sau mutate într-un fișier de traduceri
  const t = {
    titleTemplate: "Gestionare Agricultori în {village}",
    description: "Adăugați, vizualizați, editați sau eliminați conturile agricultorilor înregistrați în satul dvs.",
    addFarmerButton: "Adaugă Agricultor",
    addFarmerDialogTitle: "Adaugă Agricultor Nou",
    addFarmerDialogDescriptionTemplate: "Introduceți detaliile pentru noul agricultor din {village}. Faceți clic pe salvare când ați terminat.",
    nameLabel: "Nume",
    codeLabel: "Cod Fiscal",
    emailLabel: "Email",
    phoneLabel: "Telefon",
    passwordLabel: "Parolă",
    colorLabel: "Culoare (Hartă)",
    passwordPlaceholder: "Introduceți parola inițială",
    cancelButton: "Anulează",
    saveButton: "Salvează Agricultor",
    savingButton: "Se salvează...",
    errorRequiredFields: "Numele, codul fiscal și parola agricultorului sunt obligatorii.",
    errorInvalidEmail: "Introduceți o adresă de email validă.",
    errorPasswordLength: "Parola trebuie să conțină cel puțin 8 caractere.",
    successAddFarmer: (name: string) => `Agricultorul '${name}' a fost adăugat cu succes.`,
    errorAddFarmerTitle: "Eroare la Adăugarea Agricultorului",
    errorAddFarmerDesc: (msg?: string) => msg || "Nu s-a putut adăuga agricultorul.",
    errorLoadingSessionTitle: "Eroare Sesiune",
    errorLoadingSessionDesc: "Nu s-au putut încărca datele utilizatorului.",
    unauthenticatedError: "Acces neautorizat. Vă rugăm să vă autentificați.",
    villageNotAvailable: "Satul nu a putut fi determinat din sesiune."
  };

  // useEffect nu mai este necesar pentru a lua satul, vine direct din sesiune
  // Putem elimina state-urile loadingMayor și mayorError dacă nu mai facem fetch aici

  const resetForm = () => {
    setNewFarmerName('');
    setNewFarmerCode('');
    setNewFarmerEmail('');
    setNewFarmerPhone('');
    setNewFarmerPassword('');
    setNewFarmerColor(null);
    setIsSaving(false);
  }

  const handleAddFarmer = async () => {
    // Verificăm dacă avem ID-ul și satul primarului din sesiune
    if (!actualMayorId || !mayorVillage) {
      toast({ variant: "destructive", title: t.errorLoadingSessionTitle, description: t.villageNotAvailable });
      return;
    }
    // Restul validărilor rămân la fel...
    if (!newFarmerName || !newFarmerCode || !newFarmerPassword) {
      toast({ variant: "destructive", title: "Eroare", description: t.errorRequiredFields });
      return;
    }
    if (newFarmerEmail && !/\S+@\S+\.\S+/.test(newFarmerEmail)) {
      toast({ variant: "destructive", title: "Eroare", description: t.errorInvalidEmail });
      return;
    }
    if (newFarmerPassword.length < 8) {
      toast({ variant: "destructive", title: "Eroare", description: t.errorPasswordLength });
      return;
    }

    setIsSaving(true);
    try {
      // Folosim satul și ID-ul primarului din sesiune
      const result = await addFarmer({
        name: newFarmerName,
        companyCode: newFarmerCode,
        village: mayorVillage, // <-- Folosim satul din sesiune
        email: newFarmerEmail || null,
        phone: newFarmerPhone || null,
        password: newFarmerPassword,
        color: newFarmerColor,
      }, actualMayorId); // <-- Folosim ID-ul primarului din sesiune

      if (result.success) {
        toast({ title: "Succes", description: t.successAddFarmer(newFarmerName) });
        setIsAddFarmerOpen(false);
        resetForm();
        setTableKey(Date.now()); // Reimprospătează tabela
      } else {
        throw new Error(result.error || t.errorAddFarmerDesc());
      }
    } catch (error) {
      console.error("Failed to add farmer:", error);
      toast({
        variant: "destructive",
        title: t.errorAddFarmerTitle,
        description: t.errorAddFarmerDesc(error instanceof Error ? error.message : undefined),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Afișăm starea de încărcare a sesiunii
  if (status === 'loading') {
    return (
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> <Skeleton className="h-6 w-56" /></CardTitle>
              <Skeleton className="h-4 w-72 mt-1" />
            </div>
            <Skeleton className="h-9 w-28" />
          </CardHeader>
          <CardContent>
            {/* Păstrăm scheletul tabelei */}
            <FarmerTableSkeleton villageFilter={''} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Afișăm eroare dacă nu e autentificat (deși middleware ar trebui să prevină)
  if (status === 'unauthenticated' || !actualMayorId || !mayorVillage) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t.errorLoadingSessionTitle}</AlertTitle>
          <AlertDescription>
            {t.unauthenticatedError} {(!actualMayorId || !mayorVillage) && t.villageNotAvailable}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Randarea principală odată ce sesiunea e încărcată ---

  // Creează titlul și descrierea dinamic
  const title = mayorVillage ? t.titleTemplate.replace('{village}', mayorVillage) : "Gestionare Agricultori";
  const addFarmerDialogDescription = mayorVillage ? t.addFarmerDialogDescriptionTemplate.replace('{village}', mayorVillage) : "Introduceți detaliile pentru noul agricultor.";


  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="mb-4"> {/* Adaugă un mic spațiu sub buton */}
                <BackButton />
            </div>
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> {title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={() => setIsAddFarmerOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {t.addFarmerButton}
            </span>
          </Button>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FarmerTableSkeleton villageFilter={mayorVillage ?? ''} />}>
            <FarmerTable
              villageFilter={mayorVillage ?? ''} // <-- Folosim satul din sesiune
              readOnly={false}
              actorId={actualMayorId ?? ''} // <-- Folosim ID-ul primarului din sesiune
              refreshKey={tableKey}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Add Farmer Dialog - Verifică prezența Title și Description */}
      <Dialog open={isAddFarmerOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsAddFarmerOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            {/* Title este prezent - OK */}
            <DialogTitle>{t.addFarmerDialogTitle}</DialogTitle>
            {/* Description este prezent - OK */}
            <DialogDescription>{addFarmerDialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* ... câmpurile formularului (Name, Code, Email, Phone, Password, Color) ... */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">{t.nameLabel} *</Label>
              <Input id="name" value={newFarmerName} onChange={(e) => setNewFarmerName(e.target.value)} className="col-span-3" disabled={isSaving} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">{t.codeLabel} *</Label>
              <Input id="code" value={newFarmerCode} onChange={(e) => setNewFarmerCode(e.target.value)} className="col-span-3" disabled={isSaving} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">{t.emailLabel}</Label>
              <Input id="email" type="email" value={newFarmerEmail} onChange={(e) => setNewFarmerEmail(e.target.value)} className="col-span-3" placeholder="(Opțional)" disabled={isSaving} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">{t.phoneLabel}</Label>
              <Input id="phone" value={newFarmerPhone} onChange={(e) => setNewFarmerPhone(e.target.value)} className="col-span-3" placeholder="(Opțional)" disabled={isSaving} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">{t.passwordLabel} *</Label>
              <Input
                id="password"
                type="password"
                value={newFarmerPassword}
                onChange={(e) => setNewFarmerPassword(e.target.value)}
                className="col-span-3"
                placeholder={t.passwordPlaceholder}
                disabled={isSaving}
                autoComplete="new-password" // Sugestie pt parole noi
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">{t.colorLabel}</Label>
              <div className="col-span-3 flex flex-wrap gap-2 items-center">
                {PREDEFINED_COLORS.map(color => (
                  <Button key={color} type="button" variant="outline" size="icon"
                    className={`h-8 w-8 rounded-full border-2 ${newFarmerColor === color ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFarmerColor(color)}
                    disabled={isSaving}
                    aria-label={`Select color ${color}`}
                  />
                ))}
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => setNewFarmerColor(null)}
                  disabled={isSaving || newFarmerColor === null}
                  className={newFarmerColor === null ? 'hidden' : ''}
                > Resetează </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddFarmerOpen(false)} disabled={isSaving}>{t.cancelButton}</Button>
            <Button type="button" onClick={handleAddFarmer} disabled={isSaving || !newFarmerName || !newFarmerCode || !newFarmerPassword}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? t.savingButton : t.saveButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

