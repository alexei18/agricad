
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5"/> <Skeleton className="h-6 w-48"/></CardTitle>
           <div className="space-y-1">
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
           </div>
        </CardHeader>
        <CardContent className="space-y-6">
             <Skeleton className="h-4 w-32" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-4 w-64" />
             <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
    </div>
  );
}
