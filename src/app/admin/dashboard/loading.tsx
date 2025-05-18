
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shadow-md rounded-lg border bg-card p-6 space-y-3">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <Skeleton className="h-5 w-3/4" />
                     <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
}
