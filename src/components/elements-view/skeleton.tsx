import { cn, Skeleton } from "@leapwallet/ribbit-react";

export const ElementsViewSkeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "bg-background h-[32rem] w-full sm:w-[26rem] rounded-2xl border grid grid-rows-[auto_1fr_auto]",
        className
      )}
    >
      <div className="p-4 pb-0 text-md flex items-center gap-4">
        <h2 className="px-1 py-2 font-bold">Swaps</h2>
{/*         <h2 className="px-1 py-2 text-muted-foreground font-medium">Send</h2>
        <h2 className="px-1 py-2 text-muted-foreground font-medium">Buy</h2> */}
      </div>
      <div className="p-4">
        <Skeleton className="w-full h-[8.5rem] rounded-lg" />
        <Skeleton className="w-full h-[8.5rem] mt-2 rounded-lg" />
      </div>
      <div className="p-4">
        <Skeleton className="w-full h-10 rounded-full" />
      </div>
    </div>
  );
};
