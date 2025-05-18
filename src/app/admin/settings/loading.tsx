
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Separator } from 'lucide-react'; // Use Lucide Separator if available, else use component

export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
               <Skeleton className="h-6 w-32" />
            </CardTitle>
             <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-8">

            {/* General Settings Skeleton */}
            <section className="space-y-4">
               <Skeleton className="h-6 w-36" />
               <Skeleton className="h-px w-full bg-muted" /> {/* Separator */}
                <div className="space-y-2 max-w-sm">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-9 w-28" />
                </div>
            </section>

             {/* Role Management Skeleton */}
            <section className="space-y-4">
              <Skeleton className="h-6 w-40" />
               <Skeleton className="h-px w-full bg-muted" /> {/* Separator */}
              <Skeleton className="h-4 w-full max-w-md" />
               <div className="space-y-2">
                   <Skeleton className="h-16 w-full border rounded-md p-2"/>
                   <Skeleton className="h-16 w-full border rounded-md p-2"/>
                   <Skeleton className="h-16 w-full border rounded-md p-2"/>
               </div>
                <Skeleton className="h-9 w-48" />
                {/* Simulation Skeleton */}
                 <div className="space-y-2 pt-4">
                     <Skeleton className="h-4 w-24" />
                     <Skeleton className="h-4 w-64" />
                     <div className="flex items-center gap-2">
                         <Skeleton className="h-10 w-48" />
                         <Skeleton className="h-10 w-24" />
                     </div>
                 </div>
            </section>

            {/* Data Management Skeleton */}
            <section className="space-y-4">
              <Skeleton className="h-6 w-44" />
               <Skeleton className="h-px w-full bg-muted" /> {/* Separator */}
               <Skeleton className="h-4 w-full max-w-lg" />
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <Skeleton className="h-10 w-44" />
                  <Skeleton className="h-10 w-52" />
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-10 w-32" />
              </div>
            </section>

             {/* Tutorial Skeleton */}
             <section className="space-y-4">
                 <Skeleton className="h-6 w-20" />
                 <Skeleton className="h-px w-full bg-muted" /> {/* Separator */}
                 <Skeleton className="h-4 w-48" />
                 <Skeleton className="h-10 w-36" />
             </section>

          </CardContent>
        </Card>
    </div>
  );
}
