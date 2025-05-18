
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Loading() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Farmer Summary Skeleton */}
      <Card className="shadow-md">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-24 mt-1" />
          </div>
          <div>
            <Skeleton className="h-4 w-28" />
             <Skeleton className="h-8 w-24 mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Parcel Information Skeleton */}
      <Card className="shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
           <Tabs defaultValue="owned" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="owned"><Skeleton className="h-5 w-24"/></TabsTrigger>
              <TabsTrigger value="cultivated"><Skeleton className="h-5 w-28"/></TabsTrigger>
            </TabsList>
            <TabsContent value="owned">
              <ScrollArea className="h-[250px] rounded-md border mt-4">
                   <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                         <TableHead><Skeleton className="h-5 w-32"/></TableHead>
                         <TableHead className="text-right"><Skeleton className="h-5 w-20"/></TableHead>
                         <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                           <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                           <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                           <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="cultivated">
               <ScrollArea className="h-[250px] rounded-md border mt-4">
                 <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                         <TableHead><Skeleton className="h-5 w-32"/></TableHead>
                         <TableHead className="text-right"><Skeleton className="h-5 w-20"/></TableHead>
                         <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                         <TableHead><Skeleton className="h-5 w-20"/></TableHead>
                      </TableRow>
                    </TableHeader>
                     <TableBody>
                      {[...Array(3)].map((_, i) => (
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

       {/* Village Information Skeleton */}
       <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-1" />
              </div>
               <Skeleton className="h-10 w-44" />
          </div>
        </CardHeader>
         <CardContent>
           <Tabs defaultValue="villageOwnedStats" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="villageOwnedStats"><Skeleton className="h-5 w-36"/></TabsTrigger>
                  <TabsTrigger value="villageCultivatedStats"><Skeleton className="h-5 w-40"/></TabsTrigger>
              </TabsList>
              <TabsContent value="villageOwnedStats">
                  <Skeleton className="h-5 w-56 mb-2" />
                  <ScrollArea className="h-[200px] rounded-md border">
                       <Table>
                          <TableHeader className="sticky top-0 bg-background">
                              <TableRow>
                                <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-28"/></TableHead>
                                <TableHead className="w-[20px]"><Skeleton className="h-5 w-5"/></TableHead>
                              </TableRow>
                          </TableHeader>
                           <TableBody>
                              {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                   <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                   <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                   <TableCell><Skeleton className="h-3 w-3 rounded-full"/></TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </ScrollArea>
              </TabsContent>
               <TabsContent value="villageCultivatedStats">
                   <Skeleton className="h-5 w-60 mb-2" />
                   <ScrollArea className="h-[200px] rounded-md border">
                       <Table>
                          <TableHeader className="sticky top-0 bg-background">
                              <TableRow>
                                <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-32"/></TableHead>
                                <TableHead className="w-[20px]"><Skeleton className="h-5 w-5"/></TableHead>
                              </TableRow>
                          </TableHeader>
                           <TableBody>
                              {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                   <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                   <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                   <TableCell><Skeleton className="h-3 w-3 rounded-full"/></TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                   </ScrollArea>
              </TabsContent>
           </Tabs>
            <div className="mt-4 text-center">
                 <Skeleton className="h-10 w-40" />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
