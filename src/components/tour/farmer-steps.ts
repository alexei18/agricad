
import { Step } from 'react-joyride';

// Hardcoded Romanian strings for steps
export const farmerSteps: Step[] = [
  {
    target: 'body',
    content: 'Aici puteți vizualiza parcelele atribuite și statisticile satului.',
    title: 'Bun venit în Panoul Agricultorului!',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-sidebar="sidebar"]',
    content: 'Comutați între prezentarea generală din panoul principal, harta parcelelor și statisticile satului.',
    title: 'Bara Laterală de Navigare',
    placement: 'right',
  },
  {
    target: '[data-radix-value="owned"]', // Target the "Owned" tab trigger
    content: 'Vedeți listele parcelelor pe care le dețineți și le cultivați.',
    title: 'Parcelele Mele',
    placement: 'bottom',
  },
   {
    target: 'a[href$="/farmer/map"]',
    content: 'Explorați vizual parcelele deținute și cultivate pe hartă.',
    title: 'Harta Parcelelor',
    placement: 'right',
  },
   {
    target: 'a[href$="/farmer/stats"]',
    content: 'Comparați proprietățile dvs. de teren cu media satului și vedeți distribuția generală a terenurilor.',
    title: 'Statistici Sat',
    placement: 'right',
  },
  {
    target: 'body',
    content: 'Sunteți gata să utilizați Panoul Agricultorului.',
    title: 'Tur Complet!',
    placement: 'center',
  }
];

// The helper function is no longer needed
// export const getTranslatedFarmerSteps = (): Step[] => { ... };
