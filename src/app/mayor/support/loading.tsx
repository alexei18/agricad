
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* FAQ Section Skeleton */}
          <div className="space-y-4 border-b pb-4">
             <Skeleton className="h-5 w-52" />
             <Skeleton className="h-4 w-full max-w-md" />
            <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><Skeleton className="h-4 w-40" /></li>
                <li><Skeleton className="h-4 w-56" /></li>
                <li><Skeleton className="h-4 w-64" /></li>
                <li><Skeleton className="h-4 w-44" /></li>
            </ul>
             <Skeleton className="h-9 w-44" />
          </div>

          {/* Contact Information Skeleton */}
          <div className="space-y-4">
             <Skeleton className="h-5 w-36" />
             <Skeleton className="h-4 w-full max-w-lg" />
            <div className="flex flex-col sm:flex-row gap-4">
                 <Skeleton className="h-10 w-36" />
                 <Skeleton className="h-10 w-44" />
            </div>
             <Skeleton className="h-3 w-56" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
