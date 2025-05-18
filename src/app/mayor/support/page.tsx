'use client'; // Este deja marcat corect

import React from 'react'; // useState și useEffect nu mai sunt necesare aici
import { useSession } from 'next-auth/react'; // <-- Importăm useSession
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Mail, Phone, HelpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button'; 
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// AlertIcon deja importat corect ca AlertCircle

// Eliminăm ID-ul hardcodat
// const currentMayorId = 'mayor1';

export default function MayorSupportPage() {
  const { data: session, status } = useSession(); // <-- Obținem sesiunea și statusul

  // Extragem satul direct din sesiune odată ce e disponibilă
  // Folosim un nume default dacă sesiunea nu e gata sau nu conține satul
  const villageName = (session?.user as any)?.village || 'Satul Dvs.';
  const defaultVillageNameOnError = "acest sat"; // Folosit în caz de eroare

  // Afișăm starea de încărcare a sesiunii
  if (status === 'loading') {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              <Skeleton className="h-6 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-64 mt-1" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Poți adăuga și un skeleton pentru conținut dacă dorești */}
            <div className="space-y-4 border-b pb-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-36" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Afișăm eroare dacă nu e autentificat
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

  // --- Randarea principală odată ce sesiunea e încărcată și autentificată ---
  return (
    <div className="flex-1 p-4 sm:p-6">
            <div className="mb-4"> {/* Adaugă un mic spațiu sub buton */}
                <BackButton />
            </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {/* Folosim villageName direct din sesiune (cu fallback) */}
            Suport pentru {villageName}
          </CardTitle>
          <CardDescription>
            Găsiți ajutor și resurse sau contactați suportul pentru asistență.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* FAQ Section Placeholder */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-medium flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Întrebări Frecvente</h3>
            <p className="text-sm text-muted-foreground">
              Întrebări și răspunsuri comune despre utilizarea platformei AgriCad vor fi listate aici. (În curând)
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Cum adaug un agricultor nou?</li>
              <li>Cum atribui parcele folosind coduri cadastrale?</li>
              <li>Ce înseamnă diferitele culori ale parcelelor pe hartă?</li>
              <li>Cum este gestionat abonamentul meu?</li>
            </ul>
            <Button variant="outline" disabled size="sm">Vezi Toate Întrebările (Neimplementat)</Button>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Contact Suport</h3>
            <p className="text-sm text-muted-foreground">
              Dacă aveți nevoie de asistență suplimentară, vă rugăm să contactați echipa noastră de suport:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* TODO: Update email */}
              <Button variant="secondary" onClick={() => window.location.href = 'mailto:support@AgriCad.example.com'}>
                <Mail className="mr-2 h-4 w-4" /> Email Suport
              </Button>
              <Button variant="secondary" disabled> {/* Add phone number if available */}
                <Phone className="mr-2 h-4 w-4" /> Apel Suport (Indisponibil)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ore de suport: Luni - Vineri, 9:00 - 17:00.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}