
import { Step } from 'react-joyride';

// TODO: Consider fetching village name dynamically if needed for content
const placeholderVillage = "Satul Meu"; // Placeholder

// Function to generate steps with potentially dynamic village name
export const getMayorSteps = (villageName?: string): Step[] => {
  const currentVillage = villageName || placeholderVillage;

  return [
   {
    target: 'body',
    content: `Aici gestionați agricultorii și parcelele pentru ${currentVillage}. Să aruncăm o privire.`,
    title: `Bun venit în Panoul Primarului pentru ${currentVillage}!`,
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-sidebar="sidebar"]',
    content: 'Navigați între panoul principal, gestionarea agricultorilor, atribuirea parcelelor, statisticile satului, setările contului și suport.',
    title: 'Bara Laterală de Navigare',
    placement: 'right',
  },
   {
    target: 'a[href$="/mayor/farmers"]',
    content: `Adăugați agricultori noi pentru ${currentVillage}, vizualizați detaliile lor, editați informațiile sau eliminați conturi.`,
    title: 'Gestionare Agricultori',
    placement: 'right',
  },
   {
    target: 'a[href$="/mayor/parcels"]',
    content: 'Atribuiți parcele agricultorilor introducând liste de coduri cadastrale pentru terenurile deținute și cultivate. Vizualizați atribuirile pe hartă și în listă.',
    title: 'Gestionare Parcele',
    placement: 'right',
  },
   {
    target: 'a[href$="/mayor/stats"]',
    content: `Vedeți cum este distribuit terenul între agricultorii din ${currentVillage} și vizualizați statisticile privind dimensiunea parcelelor.`,
    title: 'Statistici Sat',
    placement: 'right',
  },
   {
    target: 'a[href$="/mayor/account"]',
    content: 'Vizualizați detaliile contului dvs. și starea abonamentului.',
    title: 'Contul Meu',
    placement: 'right',
  },
   {
    target: 'body',
    content: 'Explorați panoul dvs. și gestionați datele satului. Aveți nevoie de ajutor? Consultați secțiunea Suport.',
    title: 'Tur Complet!',
    placement: 'center',
  }
];
}

// Export default steps with placeholder village for simplicity if needed elsewhere
export const mayorSteps = getMayorSteps();

// Helper function for translation is removed
// export const getTranslatedMayorSteps = (villageName?: string): Step[] => { ... };
