
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, BarChartHorizontal, Edit3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const renderLoadingList = (count = 5) => (
    Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex justify-between items-center p-2 animate-pulse">
            <div className="flex-1 space-y-1 pr-4">
                 <Skeleton className="h-4 w-2/3" />
                 <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-1/4" />
        </div>
     ))
  );

export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Village Summary Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <Skeleton className="h-5 w-24" />
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mt-1" />
            <Skeleton className="h-3 w-32 mt-1" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <Skeleton className="h-5 w-36" />
             <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mt-1" />
             <Skeleton className="h-3 w-36 mt-1" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <Skeleton className="h-5 w-32" />
             <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <Skeleton className="h-8 w-12 mt-1" />
             <Skeleton className="h-3 w-32 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Skeleton */}
       <Card className="shadow-md">
            <CardHeader>
                 <Skeleton className="h-6 w-36" />
                 <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
            </CardContent>
       </Card>

       {/* Recent Activity Skeleton */}
       <Card className="shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent>
           <ScrollArea className="h-[250px] rounded-md border">
               <div className="p-4 space-y-2">{renderLoadingList(5)}</div>
           </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
