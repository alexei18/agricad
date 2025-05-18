
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const renderLoadingSkeleton = () => (
    <div className="space-y-3 p-4">
        <div className="flex justify-between">
             <Skeleton className="h-8 w-40" /> {/* Filter skeleton */}
        </div>
        <div className="rounded-md border">
            <div className="divide-y divide-border">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-4 w-24" /> {/* Timestamp */}
                        </div>
                        <Skeleton className="h-4 w-40 hidden sm:block" /> {/* User */}
                        <Skeleton className="h-4 w-48 hidden md:block" /> {/* Action */}
                        <Skeleton className="h-4 w-16 hidden lg:block" /> {/* Details */}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
             <Skeleton className="h-6 w-32" />
          </CardTitle>
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="assignment">
                 <TabsList className="grid w-full grid-cols-2">
                     <TabsTrigger value="assignment"><Skeleton className="h-5 w-36"/></TabsTrigger>
                     <TabsTrigger value="userAction"><Skeleton className="h-5 w-32"/></TabsTrigger>
                 </TabsList>
                <TabsContent value="assignment" className="mt-4">
                    {renderLoadingSkeleton()}
                </TabsContent>
                <TabsContent value="userAction" className="mt-4">
                     {renderLoadingSkeleton()}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
