
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> <Skeleton className="h-6 w-36" /></CardTitle>
          <Skeleton className="h-4 w-64 mt-1"/>
        </CardHeader>
        <CardContent className="space-y-4">
             <Tabs defaultValue="owned" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="owned"><Skeleton className="h-5 w-28" /></TabsTrigger>
                    <TabsTrigger value="cultivated"><Skeleton className="h-5 w-32" /></TabsTrigger>
                </TabsList>
                 <div className="border rounded-md h-[600px] overflow-hidden relative bg-muted/10 mt-4">
                     <Skeleton className="h-full w-full" />
                 </div>
             </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
