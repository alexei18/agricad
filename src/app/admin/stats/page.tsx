
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartHorizontal, AlertCircle, Loader2, PieChart, Users, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { getAllParcels, Parcel } from '@/services/parcels'; // Assuming a function to get ALL parcels exists
import { getAllFarmers, Farmer } from '@/services/farmers';
import { getAllMayors, Mayor } from '@/services/mayors';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, Cell, ResponsiveContainer } from 'recharts';

interface VillageStats {
  village: string;
  parcelCount: number;
  totalArea: number;
  farmerCount: number;
}

interface MayorStatusStats {
  status: Mayor['subscriptionStatus'];
  count: number;
}

const COLORS = {
  active: 'hsl(var(--chart-1))', // Green
  inactive: 'hsl(var(--chart-4))', // Reddish
  pending: 'hsl(var(--chart-3))', // Yellowish
};

export default function AdminStatsPage() {
  const [villageStats, setVillageStats] = React.useState<VillageStats[]>([]);
  const [mayorStatusStats, setMayorStatusStats] = React.useState<MayorStatusStats[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [parcelsData, farmersData, mayorsData] = await Promise.all([
          getAllParcels(), // Fetch all parcels
          getAllFarmers(), // Fetch all farmers
          getAllMayors(),  // Fetch all mayors
        ]);

        // --- Process Village Stats ---
        const villageMap = new Map<string, VillageStats>();

        parcelsData.forEach(parcel => {
          let stats = villageMap.get(parcel.village);
          if (!stats) {
            stats = { village: parcel.village, parcelCount: 0, totalArea: 0, farmerCount: 0 };
            villageMap.set(parcel.village, stats);
          }
          stats.parcelCount++;
          stats.totalArea += parcel.area;
        });

        farmersData.forEach(farmer => {
          let stats = villageMap.get(farmer.village);
          if (stats) { // Only count farmers if the village exists in parcel data
            stats.farmerCount++;
          }
        });

        setVillageStats(Array.from(villageMap.values()).sort((a, b) => a.village.localeCompare(b.village)));

        // --- Process Mayor Status Stats ---
        const statusMap = new Map<Mayor['subscriptionStatus'], number>();
        mayorsData.forEach(mayor => {
          statusMap.set(mayor.subscriptionStatus, (statusMap.get(mayor.subscriptionStatus) || 0) + 1);
        });

        const processedMayorStats = Array.from(statusMap.entries()).map(([status, count]) => ({
          status,
          count
        }));
        setMayorStatusStats(processedMayorStats);


      } catch (err) {
        console.error("Error fetching global statistics:", err);
        setError(err instanceof Error ? err.message : "Failed to load statistics.");
        setVillageStats([]);
        setMayorStatusStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderLoading = () => (
    <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
            <Card key={i}>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        ))}
    </div>
  );

  const renderError = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Loading Statistics</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  const chartConfig = {
    count: { label: "Count" },
    area: { label: "Area (ha)" },
    village: { label: "Village" },
    status: { label: "Status" },
    farmers: { label: "Farmers", color: "hsl(var(--chart-2))" },
    parcels: { label: "Parcels", color: "hsl(var(--chart-1))" },
    totalArea: { label: "Total Area (ha)", color: "hsl(var(--chart-3))" },
  };

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartHorizontal className="h-5 w-5" />
            Global Statistics
          </CardTitle>
          <CardDescription>
            Aggregated overview of land data, farmer distribution, and mayor status across all villages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? renderLoading() : error ? renderError() : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {/* Village Stats Chart (Example: Parcel Count) */}
              <Card>
                 <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-1"><MapPin className="h-4 w-4"/> Parcels per Village</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={villageStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" dataKey="parcelCount" />
                            <YAxis dataKey="village" type="category" width={80} tick={{ fontSize: 12 }} interval={0} />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Bar dataKey="parcelCount" fill="var(--color-parcels)" radius={4} barSize={20}>
                                {/* LabelList dataKey="parcelCount" position="right" offset={8} className="fill-foreground text-xs" /> */}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                 </CardContent>
              </Card>

               {/* Village Stats Chart (Example: Farmer Count) */}
              <Card>
                 <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-1"><Users className="h-4 w-4"/> Farmers per Village</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <ChartContainer config={chartConfig} className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={villageStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                             <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                             <XAxis type="number" dataKey="farmerCount" />
                             <YAxis dataKey="village" type="category" width={80} tick={{ fontSize: 12 }} interval={0} />
                             <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                             />
                              <Bar dataKey="farmerCount" fill="var(--color-farmers)" radius={4} barSize={20} />
                           </BarChart>
                         </ResponsiveContainer>
                      </ChartContainer>
                 </CardContent>
              </Card>

              {/* Village Stats Chart (Example: Total Area) */}
               <Card>
                 <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-1"><BarChartHorizontal className="h-4 w-4"/> Total Area per Village (ha)</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <ChartContainer config={chartConfig} className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={villageStats} layout="vertical" margin={{ left: 20, right: 20 }}>
                             <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                             <XAxis type="number" dataKey="totalArea" tickFormatter={(value) => value.toFixed(1)} />
                             <YAxis dataKey="village" type="category" width={80} tick={{ fontSize: 12 }} interval={0} />
                             <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                             />
                              <Bar dataKey="totalArea" fill="var(--color-totalArea)" radius={4} barSize={20} />
                           </BarChart>
                         </ResponsiveContainer>
                      </ChartContainer>
                 </CardContent>
              </Card>


              {/* Mayor Status Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-1"><PieChart className="h-4 w-4"/> Mayor Subscription Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                          <Pie
                            data={mayorStatusStats}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={60}
                            paddingAngle={5}
                            labelLine={false}
                            // label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => { ... }} // Optional labels
                          >
                            {mayorStatusStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || '#8884d8'} />
                            ))}
                          </Pie>
                           <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                       </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    