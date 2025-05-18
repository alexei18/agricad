
import { Step } from 'react-joyride';

// Hardcoded Romanian strings for steps
export const adminSteps: Step[] = [
  {
    target: 'body',
    content: 'Acesta este panoul central de control. Haideți să facem un tur rapid.',
    title: 'Bun venit în Panoul Administratorului!',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-sidebar="sidebar"]', // Target the sidebar div
    content: 'Utilizați această bară laterală pentru a naviga între diferitele secțiuni de management precum Agricultori, Primari, Parcele, Statistici, Jurnale și Setări.',
    title: 'Bara Laterală de Navigare',
    placement: 'right',
  },
  {
    target: 'a[href$="/admin/mayors"]', // Link to manage mayors
    content: 'Aici puteți adăuga primari noi, vizualiza pe cei existenți, gestiona starea abonamentului lor și edita detaliile lor.',
    title: 'Gestionare Primari',
    placement: 'right',
  },
   {
    target: 'a[href$="/admin/parcels"]', // Link to upload parcels
    content: 'Încărcați datele cadastrale de bază pentru toate satele folosind un fișier CSV. Asigurați-vă că formatul fișierului corespunde descrierii.',
    title: 'Încărcare Parcele',
    placement: 'right',
  },
   {
    target: 'a[href$="/admin/settings"]', // Link to settings
    content: 'Configurați setările site-ului, simulați roluri pentru testare și gestionați datele sistemului (backup-uri, ștergere date). Aveți grijă la acțiunile de gestionare a datelor!',
    title: 'Setări Sistem',
    placement: 'right',
  },
   {
    target: 'a[href$="/admin/logs"]', // Link to logs
    content: 'Urmăriți aici evenimentele importante ale sistemului, acțiunile utilizatorilor și atribuirile de parcele.',
    title: 'Jurnale Sistem',
    placement: 'right',
  },
  {
    target: 'body',
    content: 'Acum puteți explora Panoul Administratorului. Puteți reveni la acest tur oricând prin pagina Setări (funcționalitate în curând).',
    title: 'Tur Complet!',
    placement: 'center',
  }
];

// The helper function is no longer needed as strings are hardcoded
// export const getTranslatedAdminSteps = (): Step[] => { ... };
