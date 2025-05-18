
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link'; // Use standard Link
import { Users, Shield, Upload, BarChartHorizontal, Settings, History } from 'lucide-react';

export default function AdminDashboard() {
  // Hardcoded Romanian strings
  const manageMayors = "Gestionare Primari";
  const uploadParcels = "Încărcare Parcele";
  const viewFarmers = "Vizualizare Agricultori";
  const globalStats = "Statistici Globale";
  const settings = "Setări";
  const logs = "Jurnale";

  return (
    <div className="flex-1 p-4 sm:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{manageMayors}</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs mb-4">Creați, editați starea abonamentului sau eliminați conturi de primari.</CardDescription>
              <Link href="/admin/mayors" passHref>
                <Button className="w-full">Mergi la Gestionare Primari</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{uploadParcels}</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <CardDescription className="text-xs mb-4">Încărcați geometria de bază a parcelelor și datele de suprafață prin CSV.</CardDescription>
               <Link href="/admin/parcels" passHref>
                <Button className="w-full">Încarcă Parcele</Button>
               </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{viewFarmers}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs mb-4">Vizualizați conturile agricultorilor din toate satele. Filtrare disponibilă.</CardDescription>
              <Link href="/admin/farmers" passHref>
                <Button className="w-full" variant="secondary">Vezi Toți Agricultorii</Button>
              </Link>
            </CardContent>
          </Card>


           <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{globalStats}</CardTitle>
               <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               <CardDescription className="text-xs mb-4">Prezentare generală agregată a datelor funciare din toate satele.</CardDescription>
               <Link href="/admin/stats" passHref>
                <Button className="w-full" variant="secondary">Vezi Statistici Globale</Button>
               </Link>
            </CardContent>
          </Card>

           <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{settings}</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
               <CardDescription className="text-xs mb-4">Configurați setările aplicației, rolurile și permisiunile.</CardDescription>
               <Link href="/admin/settings" passHref>
                 <Button className="w-full" variant="outline">Configurează Setări</Button>
               </Link>
            </CardContent>
          </Card>
           <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{logs}</CardTitle>
                   <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                   <CardDescription className="text-xs mb-4">Vizualizați jurnalele de sistem și acțiunile utilizatorilor.</CardDescription>
                   <Link href="/admin/logs" passHref>
                    <Button className="w-full" variant="secondary">Vezi Jurnale</Button>
                   </Link>
                </CardContent>
              </Card>

        </div>
      </div>
  );
}
