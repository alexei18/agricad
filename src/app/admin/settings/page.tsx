
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, RotateCcw, Trash2, DatabaseBackup, ShieldCheck, UserCog, Tractor, AlertTriangle, History, Users } from 'lucide-react'; // Added UserSwitch
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSiteName, triggerBackup, triggerClearApplicationData, triggerClearLogs } from './actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select for Role Simulation
import { useTour } from '@/components/tour/tour-provider'; // Import useTour hook

// TODO: Define a placeholder for the current admin user's ID
const currentAdminId = "Admin_System";

// Enum to represent roles for simulation
enum SimulateRole {
    Mayor = 'mayor',
    Farmer = 'farmer',
}

export default function AdminSettingsPage() {
  // Hardcoded Romanian strings
   const t = {
       title: "Setări Sistem",
       description: "Configurați setările aplicației, rolurile utilizatorilor și gestionați datele sistemului.",
       generalSettings: "Setări Generale",
       siteNameLabel: "Nume Site",
       siteNameDescription: "Acest nume poate fi folosit în titluri sau branding.",
       saveNameButton: "Salvează Numele",
       savingNameButton: "Se salvează...",
       roleManagement: "Gestionare Roluri",
       roleManagementDescription: "Prezentare generală a rolurilor și permisiunilor utilizatorilor.",
       administratorRole: "Administrator",
       administratorDescription: "Acces complet la sistem, gestionează primarii și setările.",
       mayorRole: "Primar",
       mayorDescription: "Gestionează agricultorii și parcelele din satul alocat.",
       farmerRole: "Agricultor",
       farmerDescription: "Vizualizează parcelele alocate și statisticile satului.",
       modifyPermissionsButton: "Modifică Permisiuni (Indisponibil)",
       simulateRole: "Simulare Rol",
       simulateRoleDescription: "Vizualizați temporar aplicația ca un alt rol.",
       selectRoleLabel: "Selectați Rolul de Simulat",
       selectRolePlaceholder: "Selectați un rol...",
       simulateButton: "Simulează",
       stopSimulationButton: "Oprește Simularea",
       dataManagement: "Gestionare Date",
       dataManagementDescription: "Efectuați operațiuni asupra datelor sistemului. Utilizați cu prudență.",
       triggerBackupButton: "Declanșează Backup",
       backingUpButton: "Se face backup...",
       restoreBackupButton: "Restaurare din Backup (Neimplementat)",
       clearAppDataButton: "Șterge Datele Aplicației",
       clearLogsButton: "Șterge Jurnalele",
       clearAppDataDialogTitle: "Ștergeți Datele Aplicației?",
       clearAppDataDialogDescription: "Această acțiune nu poate fi anulată. Va șterge permanent TOATE datele agricultorilor, primarilor și parcelelor din baza de date. Jurnalele NU vor fi afectate. Sunteți sigur?",
       clearLogsDialogTitle: "Ștergeți Jurnalele?",
       clearLogsDialogDescription: "Această acțiune nu poate fi anulată. Va șterge permanent TOATE jurnalele de sistem și acțiunile utilizatorilor din baza de date. Datele aplicației (agricultori, primari, parcele) NU vor fi afectate. Sunteți sigur?",
       confirmClearDataButton: "Da, Șterge Datele",
       clearingDataButton: "Se șterg datele...",
       confirmClearLogsButton: "Da, Șterge Jurnalele",
       clearingLogsButton: "Se șterg jurnalele...",
       errorLoadingSettings: "Eroare la încărcarea setărilor",
       couldNotFetchSettings: "Nu s-au putut prelua setările.",
       errorEmptySiteName: "Numele site-ului nu poate fi gol.",
       successUpdateSiteName: "Numele site-ului a fost actualizat cu succes.",
       errorSavingSettings: "Eroare la salvarea setărilor",
       couldNotSaveSiteName: "Nu s-a putut salva numele site-ului.",
       backupStarted: "Backup început",
       backupError: "Eroare Backup",
       couldNotStartBackup: "Nu s-a putut porni procesul de backup.",
       appDataCleared: "Datele Aplicației Șterse",
       clearDataError: "Eroare la Ștergerea Datelor",
       couldNotClearAppData: "Nu s-au putut șterge datele aplicației.",
       logsCleared: "Jurnale Șterse",
       clearLogsError: "Eroare la Ștergerea Jurnalelor",
       couldNotClearLogs: "Nu s-au putut șterge jurnalele.",
       selectRoleError: "Vă rugăm să selectați un rol de simulat.",
       simulationActiveTitle: "Simulare Rol Activă",
       simulationActiveDescription: (role: string) => `Vizualizați în prezent aplicația ca <strong>${role}</strong>. Funcționalitatea poate fi limitată.`,
       cancelButton: "Anulează",
       tutorialTitle: "Tutorial",
       tutorialDescription: "Re-rulați turul introductiv.",
       startAdminTourButton: "Pornește Turul Admin"
   };

  const { startTour } = useTour();
  const [siteName, setSiteName] = React.useState('');
  const [initialSiteName, setInitialSiteName] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isClearingData, setIsClearingData] = React.useState(false);
  const [isClearingLogs, setIsClearingLogs] = React.useState(false);
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = React.useState(false);
  const [isClearLogsDialogOpen, setIsClearLogsDialogOpen] = React.useState(false);
  const [simulatingRole, setSimulatingRole] = React.useState<SimulateRole | null>(null);
  const [selectedRoleToSimulate, setSelectedRoleToSimulate] = React.useState<string>('');
    const { toast } = useToast();

  React.useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const settings = await getSettings();
        setSiteName(settings.siteName);
        setInitialSiteName(settings.siteName);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: t.errorLoadingSettings,
          description: error instanceof Error ? error.message : t.couldNotFetchSettings,
        });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
    // Check local storage for simulation state on mount
    const storedSimRole = localStorage.getItem('simulatingRole') as SimulateRole | null;
    if (storedSimRole) {
        setSimulatingRole(storedSimRole);
    }
  }, []); // Added t to dependencies

  const handleSaveSiteName = async () => {
    if (!siteName.trim()) {
      toast({ variant: 'destructive', title: 'Eroare', description: t.errorEmptySiteName });
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateSiteName(siteName, currentAdminId);
      if (result.success) {
        setInitialSiteName(siteName);
        toast({ title: 'Succes', description: t.successUpdateSiteName });
      } else {
        throw new Error(result.error || 'Failed to update site name.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t.errorSavingSettings,
        description: error instanceof Error ? error.message : t.couldNotSaveSiteName,
      });
       setSiteName(initialSiteName);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
     setIsBackingUp(true);
     try {
         const result = await triggerBackup(currentAdminId);
         if(result.success) {
            toast({ title: t.backupStarted, description: result.message });
         } else {
             throw new Error(result.error || 'Failed to start backup.');
         }
     } catch (error) {
         toast({
             variant: 'destructive',
             title: t.backupError,
             description: error instanceof Error ? error.message : t.couldNotStartBackup,
         });
     } finally {
         setIsBackingUp(false);
     }
  };

  const handleClearAppData = async () => {
     setIsClearingData(true);
     try {
         const result = await triggerClearApplicationData(currentAdminId);
          if(result.success) {
            toast({ title: t.appDataCleared, description: result.message, variant: 'destructive', duration: 10000 });
            setTimeout(() => window.location.reload(), 2000);
         } else {
             throw new Error(result.error || 'Failed to clear application data.');
         }
     } catch (error) {
         toast({
             variant: 'destructive',
             title: t.clearDataError,
             description: error instanceof Error ? error.message : t.couldNotClearAppData,
         });
     } finally {
         setIsClearingData(false);
         setIsClearDataDialogOpen(false);
     }
  };

   const handleClearLogs = async () => {
     setIsClearingLogs(true);
     try {
         const result = await triggerClearLogs(currentAdminId);
          if(result.success) {
            toast({ title: t.logsCleared, description: result.message, variant: 'default', duration: 5000 });
         } else {
             throw new Error(result.error || 'Failed to clear logs.');
         }
     } catch (error) {
         toast({
             variant: 'destructive',
             title: t.clearLogsError,
             description: error instanceof Error ? error.message : t.couldNotClearLogs,
         });
     } finally {
         setIsClearingLogs(false);
         setIsClearLogsDialogOpen(false);
     }
  };

   const handleStartSimulation = () => {
       const role = selectedRoleToSimulate as SimulateRole;
        if (!role) {
             toast({ variant: 'destructive', title: 'Eroare', description: t.selectRoleError });
             return;
        }
        setSimulatingRole(role);
        localStorage.setItem('simulatingRole', role);
        if (role === SimulateRole.Mayor) {
            window.location.href = '/mayor/dashboard';
        } else if (role === SimulateRole.Farmer) {
            window.location.href = '/farmer/dashboard';
        }
    };

    const handleStopSimulation = () => {
        setSimulatingRole(null);
        localStorage.removeItem('simulatingRole');
        window.location.href = '/admin/dashboard';
    };

     if (simulatingRole) {
        return (
             <div className="flex-1 p-4 sm:p-6">
                <Card className="shadow-md bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                            <Users className="h-4 w-4"/> {t.simulationActiveTitle}
                        </CardTitle>
                        <CardDescription className="text-yellow-700 dark:text-yellow-300" dangerouslySetInnerHTML={{ __html: t.simulationActiveDescription(simulatingRole) }}/>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={handleStopSimulation} variant="destructive">
                            {t.stopSimulationButton}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
     }


  return (
    <div className="flex-1 p-4 sm:p-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <CardDescription>
              {t.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* General Settings */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium">{t.generalSettings}</h3>
              <Separator />
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <Skeleton className="h-10 w-24" />
                </div>
              ) : (
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="siteName">{t.siteNameLabel}</Label>
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="ex: Platforma AgriCad"
                    disabled={isSaving}
                  />
                   <p className="text-xs text-muted-foreground">
                       {t.siteNameDescription}
                   </p>
                  <Button
                    onClick={handleSaveSiteName}
                    disabled={isSaving || siteName === initialSiteName || !siteName.trim()}
                    size="sm"
                  >
                    {isSaving ? <RotateCcw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? t.savingNameButton : t.saveNameButton}
                  </Button>
                </div>
              )}
            </section>

            {/* Role Management */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium">{t.roleManagement}</h3>
              <Separator />
              <p className="text-sm text-muted-foreground">
                {t.roleManagementDescription}
              </p>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <div>
                          <p className="font-medium">{t.administratorRole}</p>
                          <p className="text-xs text-muted-foreground">{t.administratorDescription}</p>
                      </div>
                  </div>
                   <div className="flex items-center gap-2 p-2 border rounded-md">
                      <UserCog className="h-5 w-5 text-blue-600" />
                      <div>
                          <p className="font-medium">{t.mayorRole}</p>
                          <p className="text-xs text-muted-foreground">{t.mayorDescription}</p>
                      </div>
                  </div>
                   <div className="flex items-center gap-2 p-2 border rounded-md">
                      <Tractor className="h-5 w-5 text-green-600" />
                      <div>
                          <p className="font-medium">{t.farmerRole}</p>
                          <p className="text-xs text-muted-foreground">{t.farmerDescription}</p>
                      </div>
                  </div>
              </div>
               <Button variant="outline" disabled size="sm">{t.modifyPermissionsButton}</Button>
               {/* Role Simulation Section */}
                <div className="space-y-2 pt-4">
                    <Label htmlFor="simulate-role-select" className="flex items-center gap-1"><Users className="h-4 w-4"/> {t.simulateRole}</Label>
                    <p className="text-xs text-muted-foreground">{t.simulateRoleDescription}</p>
                    <div className="flex items-center gap-2">
                        <Select value={selectedRoleToSimulate} onValueChange={setSelectedRoleToSimulate}>
                            <SelectTrigger id="simulate-role-select" className="w-full max-w-[200px]">
                                <SelectValue placeholder={t.selectRolePlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SimulateRole.Mayor}>{t.mayorRole}</SelectItem>
                                <SelectItem value={SimulateRole.Farmer}>{t.farmerRole}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleStartSimulation} disabled={!selectedRoleToSimulate}>
                            {t.simulateButton}
                        </Button>
                    </div>
                </div>
            </section>

            {/* Data Management */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium">{t.dataManagement}</h3>
              <Separator />
               <p className="text-sm text-muted-foreground">
                  {t.dataManagementDescription}
               </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <Button variant="outline" onClick={handleBackup} disabled={isBackingUp}>
                   {isBackingUp ? <RotateCcw className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseBackup className="mr-2 h-4 w-4" />}
                  {isBackingUp ? t.backingUpButton : t.triggerBackupButton}
                </Button>
                 <Button variant="outline" disabled>
                  {t.restoreBackupButton}
                 </Button>

                 <AlertDialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isClearingData || isClearingLogs}>
                             <AlertTriangle className="mr-2 h-4 w-4" />
                             {t.clearAppDataButton}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                         <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive"/> {t.clearAppDataDialogTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.clearAppDataDialogDescription}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isClearingData}>{t.cancelButton}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearAppData}
                          disabled={isClearingData}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          {isClearingData ? <RotateCcw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          {isClearingData ? t.clearingDataButton : t.confirmClearDataButton}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={isClearLogsDialogOpen} onOpenChange={setIsClearLogsDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isClearingData || isClearingLogs}>
                             <History className="mr-2 h-4 w-4" />
                             {t.clearLogsButton}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                         <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive"/> {t.clearLogsDialogTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                           {t.clearLogsDialogDescription}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isClearingLogs}>{t.cancelButton}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearLogs}
                          disabled={isClearingLogs}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          {isClearingLogs ? <RotateCcw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          {isClearingLogs ? t.clearingLogsButton : t.confirmClearLogsButton}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
            </section>

             {/* Tutorial Section (Optional) */}
             <section className="space-y-4">
                 <h3 className="text-lg font-medium">{t.tutorialTitle}</h3>
                 <Separator />
                 <p className="text-sm text-muted-foreground">{t.tutorialDescription}</p>
                 <Button variant="outline" onClick={() => startTour('admin')}>
                     {t.startAdminTourButton}
                 </Button>
             </section>

          </CardContent>
        </Card>
    </div>
  );
}
