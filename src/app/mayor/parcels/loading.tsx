
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit3, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Edit3 className="h-5 w-5"/> <Skeleton className="h-6 w-64"/></CardTitle>
           <Skeleton className="h-4 w-full max-w-xl mt-1"/>
           <Skeleton className="h-4 w-3/4 mt-1"/>
        </CardHeader>
         <CardContent className="space-y-6">
            {/* Assignment Form Skeleton */}
             <Card className="bg-muted/30">
                 <CardHeader>
                      <Skeleton className="h-6 w-48" />
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="space-y-2">
                         <Skeleton className="h-4 w-24" />
                         <Skeleton className="h-10 w-full max-w-sm" />
                    </div>

                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                             <Skeleton className="h-4 w-36" />
                             <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-3 w-52" />
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                             <Skeleton className="h-6 w-10 rounded-full" />
                             <Skeleton className="h-4 w-48" />
                        </div>
                     </div>
                      <Skeleton className="h-10 w-32" />
                 </CardContent>
             </Card>

             {/* Map View Skeleton */}
            <Card>
                 <CardHeader>
                     <Skeleton className="h-6 w-52" />
                 </CardHeader>
                 <CardContent>
                     <div className="border rounded-md h-[500px] overflow-hidden relative bg-muted/10">
                         <Skeleton className="h-full w-full" />
                     </div>
                 </CardContent>
            </Card>

            {/* Parcel List View Skeleton */}
            <Card>
                <CardHeader>
                     <Skeleton className="h-6 w-28" />
                     <Skeleton className="h-4 w-64 mt-1" />
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead><Skeleton className="h-5 w-32"/></TableHead>
                                    <TableHead className="text-right"><Skeleton className="h-5 w-20"/></TableHead>
                                    <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                                    <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({length: 10}).map((_, i) => (
                                    <TableRow key={i}>
                                         <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                         <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                         <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                         <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}
