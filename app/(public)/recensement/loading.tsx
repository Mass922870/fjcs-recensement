import { Skeleton } from "@/components/ui/skeleton";

export default function CensusLoading() {
  return (
    <main className="bg-muted/30">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6 sm:py-14" aria-busy>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    </main>
  );
}
