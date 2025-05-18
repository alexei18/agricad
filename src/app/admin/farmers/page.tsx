
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FarmerTable } from './components/farmer-table'; // Use the localized table
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'; // Import table components for skeleton

export default function AdminFarmersPage() {
  // Hardcoded Romanian strings
  const cardTitle = "Vizualizare Agricultori";
  const cardDescription = "Răsfoiți conturile agricultorilor din toate satele. Utilizați filtrele din tabel pentru a restrânge rezultatele.";

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
             <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> {cardTitle}</CardTitle>
            <CardDescription>
              {cardDescription}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
           <Suspense fallback={<FarmerTableSkeleton readOnly={true} />}>
             {/* FarmerTable will fetch data internally, pass readOnly */}
             <FarmerTable readOnly={true} />
           </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton remains the same
function FarmerTableSkeleton({ readOnly = false, villageFilter = '' }) {
    return (
        <div className="space-y-3">
             <div className="flex items-center py-4">
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <div className="ml-auto flex items-center gap-2">
                  </div>
             </div>
             <div className="rounded-md border">
                 <TableSkeleton />
             </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                 {readOnly && <div className="flex-1"></div>}
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-16" />
                 <Skeleton className="h-10 w-16" />
             </div>
        </div>
    );
}

function TableSkeleton({ rows = 5, cells = 7 }) { // Adjusted default cells
    return (
        <Table>
            <TableHeader>
                <TableRow>
                   {[...Array(cells)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full"/></TableHead>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(rows)].map((_, i) => (
                    <TableRow key={i}>
                        {[...Array(cells)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full"/></TableCell>)}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
