
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParcelUploadForm } from './components/parcel-upload-form'; // Ensure this is localized if needed
import { Upload } from 'lucide-react';

export default function AdminParcelsPage() {
  // Hardcoded Romanian strings
  const title = "Încărcare Date Parcele";
  // Updated description to mention 'projected_polygon'
  const description = "Încărcați datele cadastrale de bază prin CSV. Fișierul trebuie să includă coloanele: `parcel_id` (text), `area_hectares` (număr), `projected_polygon` (text de forma \"POLYGON((X Y, ...))\" folosind sistemul local de proiecție) și `village` (text). Sistemul va încerca să transforme coordonatele `projected_polygon` în WGS84 (Latitudine, Longitudine) pentru afișare. Parcelele existente cu același `parcel_id` vor fi actualizate. Atribuirile Proprietar/Cultivator sunt gestionate de Primari.";

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5"/> {title}</CardTitle>
          <CardDescription>
            {description} {/* Description updated */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParcelUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
