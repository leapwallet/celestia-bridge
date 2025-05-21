import { cn } from "@leapwallet/ribbit-react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";

import { ElementsViewSkeleton } from "@/components/elements-view/skeleton";
import { useIsMobileView } from "@/hooks/use-is-mobile-view";
import type { AllowedChainConfig } from "@leapwallet/elements";

const ElementsViewLazy = dynamic(() => import("@/components/elements-view"), {
  loading: () => <ElementsViewSkeleton />,
  ssr: false,
});

interface ElementsContainerProps {
  allowedChainsAndAssets?: AllowedChainConfig;
  allowedSourceChains?: AllowedChainConfig;
}

export function ElementsContainer({
  allowedChainsAndAssets,
  allowedSourceChains,
}: ElementsContainerProps) {
  const { isMobile } = useIsMobileView();

  return (
    <motion.div
      layout
      key="main-view"
      className={cn(
        "max-md:w-full max-md:max-w-[26rem] max-md:px-4 relative flex flex-col justify-end items-stretch md:flex-row md:justify-center md:items-stretch z-[0] duration-300 transition-transform",
        { "celestia-bridge-panel-sizing": !isMobile }
      )}
    >
      <AnimatePresence initial={false}>
        <ElementsViewLazy
          key="elements-view"
          allowedSourceChains={allowedSourceChains}
          allowedChainsAndAssets={allowedChainsAndAssets}
        />
      </AnimatePresence>
    </motion.div>
  );
}
