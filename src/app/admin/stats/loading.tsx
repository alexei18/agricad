
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChartHorizontal } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartHorizontal className="h-5 w-5" />
            <Skeleton className="h-6 w-40"/>
          </CardTitle>
           <Skeleton className="h-4 w-72 mt-1"/>
        </CardHeader>
        <CardContent>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-1" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-48 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
