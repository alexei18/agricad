'use client';

import React, { useState, useEffect } from 'react';
import { PlayCircle, Mail, MapPin, Users, FileText, Share2, TrendingUp, AlignEndHorizontal, BarChart, CheckCircle, Shield, Target, Clock, Settings, Zap, Lightbulb, HelpCircle, MessageSquarePlus, Send } from 'lucide-react'; // Adăugat Send pentru noul buton
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Vom folosi DialogTrigger pentru buton
  DialogClose, // Opțional, pentru un buton de închidere explicit
} from "@/components/ui/dialog";
// Interfețe pentru datele demo (neschimbate)
interface DemoPlot {
  id: string;
  cadastralCode: string;
  area: number;
  crop: string;
  owner: string;
  location: string;
}

interface DemoFarmer {
  id: string;
  name: string;
  plotsManaged: number;
  contact: string;
}

interface DemoMayorDashboardData {
  totalPlots: number;
  totalArea: number;
  farmersRegistered: number;
  recentActivity: string[];
}

const LandingPage: React.FC = () => {
  const [mayorDemoData, setMayorDemoData] = useState<DemoMayorDashboardData | null>(null);
  const [farmerDemoPlots, setFarmerDemoPlots] = useState<DemoPlot[]>([]);
  const [userIdea, setUserIdea] = useState(''); // Stare pentru textul din textarea
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  useEffect(() => {
    setMayorDemoData({
      totalPlots: 1250,
      totalArea: 875.5,
      farmersRegistered: 78,
      recentActivity: [
        "Cerere nouă de la G. Andron pentru parcela 7521X",
        "Actualizare status parcela 3012Z - Cultură recoltată",
        "Raport generat: Situația terenurilor necultivate",
      ],
    });

    setFarmerDemoPlots([
      { id: 'p1', cadastralCode: '7521X01', area: 5.2, crop: 'Grâu', owner: 'Ion Creangă', location: 'Valea Seacă' },
      { id: 'p2', cadastralCode: '7521X02', area: 12.0, crop: 'Porumb', owner: 'Mihai Eminescu', location: 'Dealul Frumos' },
      { id: 'p3', cadastralCode: '7528Y05', area: 3.5, crop: 'Floarea Soarelui', owner: 'Vasile Alecsandri', location: 'Lunca Mare' },
    ]);
  }, []);

  const colors = {
    background: '#f3f4f6', // gray-100
    surface: '#ffffff',    // white
    primaryAccent: '#4cae4f',
    primaryAccentDarker: '#3e8e41', // O nuanță mai închisă pentru hover/active
    textPrimary: '#1f2937', // gray-800
    textSecondary: '#4b5563', // gray-600
    lightBorder: '#e5e7eb', // gray-200
  };

  const FeatureCard = ({ icon, title, description, size = 'normal' }: { icon: React.ReactNode, title: string, description: string, size?: 'normal' | 'large' | 'xlarge' }) => (
    <div
      className={`
        bg-[${colors.surface}] group
        p-6 rounded-xl shadow-lg border border-[${colors.lightBorder}]
        transition-all duration-300 ease-in-out
        hover:shadow-[0_10px_30px_-10px_rgba(76,174,79,0.3)] hover:border-[${colors.primaryAccent}] hover:-translate-y-1
        ${size === 'large' ? 'md:col-span-2' : ''}
        ${size === 'xlarge' ? 'md:col-span-3 h-full flex flex-col justify-center' : ''}
      `}
    >
      <div className="flex items-center mb-4">
        <div className={`bg-[${colors.primaryAccent}]/10 p-3 rounded-lg mr-4 text-[${colors.primaryAccent}] transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <h3 className={`text-xl md:text-2xl font-bold text-[${colors.textPrimary}]`}>{title}</h3>
      </div>
      <p className={`text-[${colors.textSecondary}] text-sm leading-relaxed`}>{description}</p>
    </div>
  );

  const BentoItemHero = ({ title, children, className = "", rotation = 0 }: { title: string, children: React.ReactNode, className?: string, rotation?: number }) => (
    <div
      className={`bg-[${colors.surface}]/80 backdrop-blur-sm p-3 md:p-4 rounded-lg shadow-md border border-[${colors.lightBorder}] hover:shadow-xl transition-all duration-300 hover:scale-[1.03] ${className}`} // Redus padding pentru 3x3
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <h3 className={`text-xs md:text-sm font-semibold text-[${colors.primaryAccent}] mb-1 md:mb-2`}>{title}</h3>
      <div className={`text-[${colors.textSecondary}] text-[0.7rem] md:text-xs`}> {/* Font mai mic pentru 3x3 */}
        {children}
      </div>
    </div>
  );

  const handleIdeaSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Aici s-ar adăuga logica de trimitere a datelor către un backend sau API
    alert(`Ideea dumneavoastră: "${userIdea}"\n\n(Aceasta este o simulare. Într-o aplicație reală, datele ar fi trimise.)`);
    setUserIdea(''); // Golește textarea după trimitere
  };

  return (
    <div className={`bg-[${colors.background}] text-[${colors.textPrimary}] min-h-screen font-sans`}>
      {/* Hero Section */}
      <section className="relative w-full min-h-[800px] md:min-h-screen flex items-center justify-center overflow-hidden p-4 md:p-8"> {/* Ajustat min-h */}
        <div className="absolute inset-0 opacity-50">
          <div className={`absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-[${colors.primaryAccent}]/10 to-transparent rounded-full filter blur-3xl`}></div>
          <div className={`absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[${colors.primaryAccent}]/5 to-transparent rounded-full filter blur-3xl animation-delay-2000`}></div>
        </div>

        <div className="container mx-auto grid lg:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
          {/* Modificat ordinea pentru mobil: textul este primul (order-1), imaginile sunt a doua (order-2) */}
          <div className="text-center lg:text-left order-1"> {/* Schimbat order-2 lg:order-1 în order-1 */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6">
              <span className={`bg-clip-text  bg-gradient-to-r from-[${colors.primaryAccent}] via-green-600 to-emerald-600`}>
                AgriCad Moldova
              </span>
            </h1>
            <p className={`text-lg md:text-xl text-[${colors.textSecondary}] mb-10 max-w-xl mx-auto lg:mx-0`}>
              Revoluționăm administrația agricolă. Conectăm primăriile și fermierii prin date precise și accesibile.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
              <a
                href="/" // Acesta rămâne link către pagina de login
                className={`bg-[${colors.primaryAccent}] font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-[${colors.primaryAccentDarker}] hover:bg-green-700 active:scale-95 transition-all duration-200 transform hover:scale-105 text-base md:text-lg inline-flex items-center justify-center`}
              >
                <Users className="mr-2 h-5 w-5" /> Conectează-te
              </a>

              {/* --- BUTONUL MODIFICAT PENTRU VIDEO --- */}
              <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                <DialogTrigger asChild>
                  <button
                    className={`bg-[${colors.surface}] text-[${colors.primaryAccent}] border border-[${colors.primaryAccent}] font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-[${colors.primaryAccentDarker}]/10 active:bg-[${colors.primaryAccent}]/20 active:scale-95 transition-all duration-200 transform hover:scale-105 text-base md:text-lg inline-flex items-center justify-center`}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" /> {/* Iconiță actualizată */}
                    Videoclip demo
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[50vw] p-0 overflow-hidden aspect-video"> {/* Am adăugat aspect-video și am ajustat max-w */}
                  {/* Am eliminat DialogHeader și DialogTitle pentru a lăsa videoclipul să ocupe tot spațiul.
                    Poți să le adaugi înapoi dacă dorești un titlu pentru modal.
                  */}
                  
                  {/* --- AICI INTRODUCEM CODUL DE EMBED DE LA VIMEO --- */}
                  <div style={{padding:"56.25% 0 0 0", position:"relative"}}> {/* 56.25% este pentru un aspect ratio 16:9 */}
                      <iframe 
                          src="https://player.vimeo.com/video/1086287591?h=363350e1f6&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=1" // Am adăugat &autoplay=1
                          frameBorder="0" 
                          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" 
                          style={{position:"absolute",top:0,left:0,width:"100%",height:"100%"}} 
                          title="Prezentare AgriCad">
                      </iframe>
                  </div>
                  {/* --- SFÂRȘIT COD EMBED VIMEO --- */}

                  {/* Scriptul <script src="https://player.vimeo.com/api/player.js"></script>
                    este pentru API-ul playerului Vimeo. Pentru simpla redare, iframe-ul este suficient.
                    Dacă ai nevoie de control avansat asupra playerului (ex: din codul tău JavaScript),
                    va trebui să încarci acest script folosind componenta <Script> de la Next.js:
                    import Script from 'next/script';
                    ...
                    <Script src="https://player.vimeo.com/api/player.js" strategy="lazyOnload" />
                    Dar pentru început, încearcă fără el.
                  */}
                </DialogContent>
              </Dialog>
              {/* --- SFÂRȘIT BUTON MODIFICAT ȘI DIALOG --- */}
            </div>
          </div>

          {/* Schimbat order-1 lg:order-2 în order-2 */}
          <div className="order-2 grid grid-cols-3 grid-rows-3 gap-2 md:gap-3 h-[320px] sm:h-[380px] md:h-[420px] lg:h-[450px] w-full max-w-xl mx-auto"> {/* Grid 3x3, ajustat h și max-w */}
            {/* Harta ocupă col-span-2 row-span-2 sau col-span-3 row-span-2 */}
            <div className={`col-span-3 row-span-2 md:col-span-2 md:row-span-3 bg-[${colors.surface}]/70 backdrop-blur-sm rounded-xl shadow-xl border border-[${colors.lightBorder}] overflow-hidden flex items-center justify-center p-1 md:p-2 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]`}>
              <img src="./img/Screenshot 2025-05-15 184824.png" alt="Previzualizare Hartă Interactivă AgriCad" className="object-contain w-full rounded-md" />
            </div>
            {/* Ajustat plasarea pentru 3x3 grid */}
            <BentoItemHero title="Rapoarte locale" className="md:col-start-3 md:row-start-1" rotation={-2}> {/* Rapoarte Locale -> Rapoarte */}
              <FileText className={`w-5 h-5 md:w-6 md:h-6 mb-1 text-[${colors.primaryAccent}]/80`} />
              <p className="text-xs">Generare rapidă.</p>
            </BentoItemHero>
            <BentoItemHero title="Management fermieri" className="md:col-start-3 md:row-start-2" rotation={3}> {/* Management Fermieri -> Fermieri */}
              <Users className={`w-5 h-5 md:w-6 md:h-6 mb-1 text-[${colors.primaryAccent}]/80`} />
              <p className="text-xs">Asociere și comunicare.</p>
            </BentoItemHero>
            <BentoItemHero title="Notificări inteligente" className="md:col-start-3 md:row-start-3" rotation={1}> {/* Notificări Inteligente -> Notificări */}
              <Zap className={`w-5 h-5 md:w-6 md:h-6 mb-1 text-[${colors.primaryAccent}]/80`} />
              <p className="text-xs">Alerte în timp real.</p>
            </BentoItemHero>
          </div>
        </div>
      </section>

      {/* Secțiunea Funcționalități Principale - Cu Imagini Statice */}
      <section className="py-16 md:py-24 px-4 md:px-8" id="functionalitati">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className={`text-3xl md:text-4xl font-extrabold mb-5 text-[${colors.textPrimary}]`}>
            Funcționalități <span className={`text-[${colors.primaryAccent}]`}>principale</span>
          </h2>
          <p className={`text-base md:text-lg text-[${colors.textSecondary}] mb-12 md:mb-16 max-w-3xl mx-auto`}>
            Descoperiți cum AgriCad transformă gestionarea terenurilor agricole, oferind transparență și eficiență.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                title: "Hartă interactivă detaliată",
                description: "Navigați, identificați și gestionați parcelele cu precizie cadastrală. Suprapuneți straturi de informații și accesați detalii complete.",
                icon: <MapPin className={`w-10 h-10 mb-3 text-[${colors.primaryAccent}]`} />,
                image: "./img/Screenshot 2025-05-15 184744.png", 
                size: "sm:col-span-1 lg:col-span-2" // Modificat size pentru a se potrivi mai bine
              },
              {
                title: "Măsurători precise",
                description: "Aplicatia noastră permite măsurători precise ale parcelelor conform titlurilor de proprietate.",
                icon: <FileText className={`w-8 h-8 md:w-10 md:h-10 mb-3 text-[${colors.primaryAccent}]`} />,
                image: "./img/masurare1.png",
                size: ""
              },
              {
                title: "Vizualizare detaliată a parcelelor",
                description: "Fiecare fermier poate vizualiza parcelele sale, deținute, arendate și parcelele vecinilor.",
                icon: <Users className={`w-8 h-8 md:w-10 md:h-10 mb-3 text-[${colors.primaryAccent}]`} />,
                image: "./img/parceleagricultor.png",
                size: ""
              },
              {
                title: "Statistici globale și individuale",
                description: "Primăria și agricultorii pot vizualiza statistici pentru tot satul și individuale.",
                icon: <AlignEndHorizontal className={`w-8 h-8 md:w-10 md:h-10 mb-3 text-[${colors.primaryAccent}]`} />,
                image: "./img/Statistici1.png",
                size: "sm:col-span-1 lg:col-span-2" // Modificat size
              },
              // Am eliminat un card pentru a se potrivi mai bine într-un layout par, sau ajustează `size` pentru 5 elemente.
              // {
              //   title: "Acces Rapid la Date și Istoric",
              //   description: "Agricultorii își pot vizualiza parcelele și istoricul informațiilor, iar primăriile accesează date agregate pentru decizii informate.",
              //   icon: <TrendingUp className={`w-8 h-8 md:w-10 md:h-10 mb-3 text-[${colors.primaryAccent}]`} />,
              //   image: "https://via.placeholder.com/600x200/f3f4f6/4CAE4F?text=Imagine+Acces+Date",
              //   size: "sm:col-span-1 lg:col-span-2" // Asigură-te că totalul de span-uri se potrivește grid-ului
              // }
            ].map((item, index) => (
              <div key={index} className={`group bg-[${colors.surface}] rounded-xl shadow-lg overflow-hidden border border-[${colors.lightBorder}] transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(76,174,79,0.3)] hover:border-[${colors.primaryAccent}] hover:-translate-y-1.5 ${item.size}`}>
                <div className="w-full h-40 sm:h-48 md:h-56 overflow-hidden">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="p-5 md:p-6">
                  <div className="flex items-start mb-2 md:mb-3"> {/* Schimbat items-center in items-start */}
                    <div className="flex-shrink-0"> {/* Adăugat div pentru iconiță */}
                        {React.cloneElement(item.icon, { className: `transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-110 ${item.icon.props.className}` })}
                    </div>
                    <h3 className={`text-lg md:text-xl font-bold text-[${colors.textPrimary}] ml-3`}>{item.title}</h3> {/* Adăugat ml-3 la titlu */}
                  </div>
                  <p className={`text-[${colors.textSecondary}] text-xs md:text-sm`}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secțiunea Ce Ne Diferențiază? */}
      <section className={`py-16 md:py-24 px-4 md:px-8 bg-[${colors.surface}]`} id="diferentiatori">
         <div className="max-w-6xl mx-auto text-center">
          <h2 className={`text-3xl md:text-4xl font-extrabold mb-5 text-[${colors.textPrimary}]`}>
            Ce ne <span className={`text-[${colors.primaryAccent}]`}>diferențiază?</span>
          </h2>
          <p className={`text-base md:text-lg text-[${colors.textSecondary}] mb-12 md:mb-16 max-w-3xl mx-auto`}>
            AgriCad nu este doar o altă platformă. Este soluția gândită specific pentru contextul agricol și administrativ din Moldova.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard icon={<Shield size={28} />} title="Date oficiale și precise" description="Utilizăm date direct din Fondul Funciar (Cadastru.md), asigurând acuratețe și actualizări constante. Transparență pentru decizii fundamentate."/>
            <FeatureCard icon={<Target size={28} />} title="Interfață intuitivă" description="Platformă ușor de utilizat, chiar și pentru persoanele mai puțin tehnice. Design modern și accesibil de pe orice dispozitiv."/>
            <FeatureCard icon={<CheckCircle size={28} />} title="Accesibilitate garantată" description="Datele sunt deschise și accesibile pentru utilizatorii autorizați – primării și agricultori. Informație relevantă la îndemână."/>
            <FeatureCard icon={<Clock size={28} />} title="Eficiență și reducerea birocrației" description="Digitalizăm procesele, eliminăm erorile și reducem timpul pentru gestionarea informațiilor funciare. Mai mult timp pentru strategie."/>
            <FeatureCard icon={<Settings size={28} />} title="Adaptabilitate locală" description="Construit cu specificitățile și nevoile administrației locale și ale fermierilor din Moldova. Suport dedicat și dezvoltare continuă."/>
            <FeatureCard icon={<Zap size={28} />} title="Inovație continuă" description="Ne angajăm să aducem constant îmbunătățiri și noi funcționalități pentru a fi partenerul tehnologic de încredere în agricultura modernă."/>
          </div>
        </div>
      </section>

      {/* Secțiunea Privim Spre Viitor - Cu Formular de Idei */}
      <section className={`py-16 md:py-24 px-4 md:px-8 bg-[${colors.background}]`} id="viitor">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className={`text-3xl md:text-4xl font-extrabold mb-5 text-[${colors.textPrimary}]`}>
            Privim spre <span className={`text-[${colors.primaryAccent}]`}>viitor</span>
          </h2>
          <p className={`text-base md:text-lg text-[${colors.textSecondary}] mb-10 max-w-3xl mx-auto`}>
            Angajamentul nostru este dezvoltarea continuă. Iată ce funcționalități majore pregătim:
          </p>
          <div className="space-y-6 md:space-y-8 mb-16">
            {[
              { icon: <FileText size={26} />, title: "Export avansat de date", description: "Exportați date în formate flexibile (Excel, Word), alegând câmpurile și structura necesară pentru rapoarte sau integrări." },
              { icon: <CheckCircle size={26} />, title: "Automatizarea completării contractelor", description: "Implementarea unui modul pentru generarea automată a contractelor (arendă etc.) pe baza șabloanelor și datelor din platformă." },
              { icon: <MapPin size={26} />, title: "Măsurători și delimitări personalizate", description: "Instrumente pentru măsurarea precisă a ariilor și lungimilor pe hartă. Definirea parcelelor, chiar și fără cod cadastral inițial." },
              { icon: <Share2 size={26} />, title: "Integrare extinsă", description: "Conectarea cu alte sisteme guvernamentale relevante pentru un flux de date unitar, reducând redundanța și efortul manual." },
              { icon: <BarChart size={26} />, title: "Analize și raportare îmbunătățite", description: "Funcționalități avansate de analiză pentru identificarea tendințelor, optimizarea resurselor și sprijinirea deciziilor strategice." },
              { icon: <HelpCircle size={26} />, title: "Aplicație accesibilă pe smartphone", description: "Acces la platformă și funcționalități cheie direct de pe dispozitive mobile, pentru flexibilitate și productivitate pe teren." }
            ].map((item, index) => (
              <div key={index} className={`group bg-[${colors.surface}] p-6 md:p-8 rounded-xl shadow-lg border border-[${colors.lightBorder}] hover:border-[${colors.primaryAccent}] hover:-translate-y-1.5 transition-all duration-300 flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 text-left`}>
                <div className={`flex-shrink-0 bg-[${colors.primaryAccent}]/10 p-3 sm:p-4 rounded-lg text-[${colors.primaryAccent}] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  {React.cloneElement(item.icon, { className: 'w-6 h-6 sm:w-7 sm:h-7' })}
                </div>
                <div>
                  <h3 className={`text-xl font-bold text-[${colors.textPrimary}] mb-2`}>{item.title}</h3>
                  <p className={`text-[${colors.textSecondary}] leading-relaxed text-sm md:text-base`}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Secțiune Nouă pentru Idei Utilizatori cu Textarea */}
          <div className={`bg-[${colors.surface}] p-8 md:p-10 rounded-xl shadow-xl border border-[${colors.primaryAccent}]/30 text-center`}>
            <MessageSquarePlus className={`w-12 h-12 mx-auto mb-4 text-[${colors.primaryAccent}]`} />
            <h3 className={`text-2xl font-bold text-[${colors.textPrimary}] mb-3`}>Aveți o idee?</h3>
            <p className={`text-[${colors.textSecondary}] mb-6 max-w-xl mx-auto`}>
              Feedback-ul și ideile dumneavoastră sunt valoroase! Dacă aveți sugestii pentru noi funcționalități sau îmbunătățiri, apăsați butonul de mai jos:
            </p>
            <a
              href="mailto:agricad.suport@gmail.com"
              className={`inline-flex items-center justify-center bg-[${colors.primaryAccent}]  font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-[${colors.primaryAccentDarker}] active:bg-green-700 active:scale-95 transition-all duration-200 transform hover:scale-105`}
            >
              <Send className="mr-2 h-5 w-5" /> Scrie un email
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={`py-16 md:py-24 px-4 md:px-8 bg-[${colors.surface}]`} id="contact">
         <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-3xl md:text-4xl font-extrabold mb-5 text-[${colors.textPrimary}]`}>
             Contactați-<span className={`text-[${colors.primaryAccent}]`}>ne</span>
          </h2>
          <p className={`text-base md:text-lg text-[${colors.textSecondary}] mb-10`}>
            Sunteți gata să transformați modul în care gestionați agricultura? Aveți întrebări sau doriți un demo personalizat?
          </p>
          <div className={`bg-[${colors.background}] p-8 md:p-12 rounded-xl shadow-lg border border-[${colors.lightBorder}] inline-block hover:shadow-xl transition-shadow duration-300`}>
            <p className={`text-xl md:text-2xl font-semibold text-[${colors.textPrimary}] mb-6`}>Suntem aici pentru dumneavoastră:</p>
            <p className={`text-[${colors.textSecondary}] text-base md:text-lg mb-3`}>Email: <a href="mailto:agricad.md@gmail.com" className={`text-[${colors.primaryAccent}] hover:underline hover:text-[${colors.primaryAccentDarker}]`}>agricad.md@gmail.com</a></p>
            <p className={`text-[${colors.textSecondary}] text-base md:text-lg`}>Telefon: <a href="tel:+37368512814" className={`text-[${colors.primaryAccent}] hover:underline hover:text-[${colors.primaryAccentDarker}]`}>+373-685-12-814</a></p>
          </div>
        </div>
      </section>

      {/* Alpha Version Note */}
      <section className={`bg-yellow-400/10 py-10 md:py-12 px-4 md:px-8 text-center border-t border-b border-yellow-500/20`}>
        <div className="max-w-4xl mx-auto">
          <Lightbulb className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-yellow-500 animate-pulse" />
          <h3 className="text-xl md:text-2xl font-semibold mb-4 text-yellow-700">Notă importantă: Versiune Alpha</h3>
          <p className="text-base md:text-lg leading-relaxed text-yellow-600">
            Platforma <strong>AgriCad</strong> este în stadiul <strong>Alpha</strong>. O oferim gratuit pentru testare, iar feedback-ul dumneavoastră este esențial. Contribuția dumneavoastră ne va ajuta să modelăm viitorul acestei soluții. Vă mulțumim!
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`bg-[${colors.surface}] text-[${colors.textSecondary}] py-10 md:py-12 text-center border-t border-[${colors.lightBorder}]`}>
        <p className="text-sm">&copy; {new Date().getFullYear()} AgriCad Moldova. Toate drepturile rezervate.</p>
        <p className="text-xs mt-2">Dezvoltat cu pasiune pentru agricultura viitorului.</p>
      </footer>
    </div>
  );
};

export default LandingPage;