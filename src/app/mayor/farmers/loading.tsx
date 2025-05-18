
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

// Generic Table Skeleton
function TableSkeleton({ rows = 5, cells = 7 }) {
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

function FarmerTableSkeleton() {
    return (
        <div className="space-y-3">
             <div className="flex items-center py-4">
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <div className="ml-auto flex items-center gap-2">
                      <Skeleton className="h-10 w-24" /> {/* Columns button */}
                  </div>
             </div>
             <div className="rounded-md border">
                 <TableSkeleton rows={5} cells={7}/> {/* Assuming 7 columns */}
             </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                 <Skeleton className="h-5 w-28 flex-1" /> {/* Selection text */}
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-16" />
                 <Skeleton className="h-10 w-16" />
             </div>
        </div>
    );
}


export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> <Skeleton className="h-6 w-56"/></CardTitle>
            <Skeleton className="h-4 w-72 mt-1"/>
           </div>
           <Skeleton className="h-9 w-28" /> {/* Add Farmer Button Skeleton */}
        </CardHeader>
        <CardContent>
           <FarmerTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
