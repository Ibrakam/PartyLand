import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <Card className="bg-white rounded-3xl border-2 border-sweet-pink overflow-hidden">
      {/* Image Skeleton */}
      <div className="relative w-full h-64 bg-gradient-to-br from-sweet-pink-light to-white p-6">
        <Skeleton className="w-full h-full rounded-2xl" />
      </div>

      {/* Content Skeleton */}
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </Card>
  );
}

