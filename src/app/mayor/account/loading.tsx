
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex-1 p-4 sm:p-6">
            <Card className="shadow-md">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" /> <Skeleton className="h-6 w-32"/>
                    </CardTitle>
                    <Skeleton className="h-4 w-64 mt-1"/>
                </CardHeader>
                <CardContent className="space-y-6">
                     {/* Account Details Skeleton */}
                    <div className="space-y-4 border-b pb-4">
                         <Skeleton className="h-5 w-40" />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                 <Skeleton className="h-4 w-16 mb-1" />
                                 <Skeleton className="h-10 w-full" />
                            </div>
                            <div>
                                 <Skeleton className="h-4 w-16 mb-1" />
                                 <Skeleton className="h-10 w-full" />
                            </div>
                             <div>
                                 <Skeleton className="h-4 w-16 mb-1" />
                                 <Skeleton className="h-10 w-full" />
                            </div>
                         </div>
                          <Skeleton className="h-9 w-40" />
                    </div>

                    {/* Subscription Status Skeleton */}
                     <div className="space-y-4">
                         <Skeleton className="h-5 w-44" />
                        <div className="flex items-center gap-2">
                             <Skeleton className="h-8 w-24 rounded-full" />
                         </div>
                          <div className="flex items-center gap-2 text-sm">
                             <Skeleton className="h-4 w-4"/>
                             <Skeleton className="h-4 w-48" />
                        </div>
                         <Skeleton className="h-3 w-5/6" />
                          <Skeleton className="h-9 w-36" />
                     </div>
                </CardContent>
            </Card>
        </div>
    );
}
