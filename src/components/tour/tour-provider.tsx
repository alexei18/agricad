'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
// Importăm componentele și hook-urile din @reactour/tour
import { TourProvider as ReactourProvider, useTour as useReactour, type StepType } from '@reactour/tour';
// Importăm definițiile pașilor (presupunând că le vei adapta la formatul StepType)
import { adminSteps } from './admin-steps';
import { getMayorSteps } from './mayor-steps';
import { farmerSteps } from './farmer-steps';
// Importăm useSession pentru a obține datele utilizatorului curent
import { useSession } from 'next-auth/react';
// getMayorById nu mai e necesar aici, folosim sesiunea

// Tipul pentru contextul nostru customizat (dacă mai e necesar)
// Acum expunem direct controalele de la useReactour, dar păstrăm startTour custom
interface TourContextType {
  startTour: (role: 'admin' | 'mayor' | 'farmer') => void; // Funcția noastră de pornire
  // Putem expune și alte controale dacă e nevoie, ex:
  // setIsOpen: (isOpen: boolean) => void;
  // setSteps: (steps: StepType[]) => void;
  isOpen: boolean; // Expunem starea curentă
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface CustomTourProviderProps {
  children: ReactNode;
}

// Textele pentru butoanele turului (compatibile cu @reactour/tour)
const defaultLocale = {
  back: "Înapoi",
  close: "Închide",
  last: "Termină",
  next: "Următorul",
  skip: "Omite",
  // Alte texte posibile...
};

// Aceasta este componenta noastră Provider care va înveli TourProvider-ul din bibliotecă
export default function CustomTourProvider({ children }: CustomTourProviderProps) {
  const { data: session, status } = useSession(); // Obținem sesiunea

  // Folosim hook-ul intern al bibliotecii @reactour/tour
  const { setIsOpen, setSteps, isOpen } = useReactour();

  // Definim pașii inițiali ca fiind goi
  // setSteps va fi apelat din startTour pentru a încărca pașii corecți
  const [initialSteps] = useState<StepType[]>([]);

  const startTour = useCallback(async (role: 'admin' | 'mayor' | 'farmer') => {
    if (status !== 'authenticated') {
      console.warn("Încercare pornire tur fără autentificare.");
      return;
    }
    console.log(`Starting tour for role: ${role}`);

    let roleSteps: StepType[] = [];
    try {
      switch (role) {
        case 'admin':
          roleSteps = adminSteps; // Presupunând că adminSteps e deja în format StepType[]
          break;
        case 'mayor':
          // Obținem satul din sesiune!
          const villageName = (session?.user as any)?.village || "Satul Meu"; // Folosim fallback
          if (!villageName) {
            console.error("Nu s-a putut obține satul primarului din sesiune pentru tur.");
            return; // Nu pornim turul fără sat
          }
          roleSteps = getMayorSteps(villageName); // Presupunând că getMayorSteps returnează StepType[]
          break;
        case 'farmer':
          roleSteps = farmerSteps; // Presupunând că farmerSteps e deja în format StepType[]
          break;
      }

      console.log("Setting steps:", roleSteps);
      setSteps(roleSteps); // Setăm pașii în providerul @reactour/tour
      setIsOpen(true); // Pornim turul folosind funcția din @reactour/tour
    } catch (error) {
      console.error(`Eroare la pregătirea pașilor pentru rolul ${role}:`, error);
    }

  }, [status, session, setSteps, setIsOpen]); // Adăugăm dependențele corecte

  // Funcția stopTour nu mai e necesară explicit aici,
  // @reactour/tour gestionează închiderea prin butoanele sale sau setIsOpen(false)

  // Logica de auto-start poate fi readăugată ulterior, adaptată la setIsOpen
  /*
  useEffect(() => {
      // ... logica adaptată pentru a apela startTour dacă e prima vizită ...
  }, [pathname, isOpen, startTour]); // Atenție la dependențe
  */

  // Valoarea contextului pe care o oferim componentelor copil
  const contextValue: TourContextType = {
    startTour,
    isOpen, // Oferim starea curentă
    // Putem adăuga și setIsOpen, setSteps dacă vrem control total din componente
    // setIsOpen,
    // setSteps
  };

  return (
    // Oferim contextul nostru customizat
    <TourContext.Provider value={contextValue}>
      {/*
         * Învelim copiii în providerul REAL din @reactour/tour.
         * Acesta trebuie să fie randat necondiționat pentru ca hook-ul useReactour
         * să funcționeze corect în componentele care îl folosesc (precum acesta!).
         * Setăm pașii inițiali ca fiind goi; ei vor fi actualizați prin setSteps.
        */}
      <ReactourProvider
        steps={initialSteps}
        texts={defaultLocale} // Setăm textele butoanelor
        styles={{ /* ... stilurile tale custom ... */ }}
      // Alte opțiuni de configurare...
      // Exemplu:
      // disableInteraction={true}
      // showNavigation={false}
      // showBadge={false}
      >
        {children}
      </ReactourProvider>
    </TourContext.Provider>
  );
}

// Hook-ul customizat pentru a accesa funcția noastră startTour și starea isOpen
export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a CustomTourProvider');
  }
  return context;
};