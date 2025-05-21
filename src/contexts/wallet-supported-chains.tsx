import { useChains } from "@/hooks/use-chains";
import { cosmoshubChainId } from "@/lib/constants";
import type { ChainInfo } from "@keplr-wallet/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAccount, WalletType } from "graz";
import { mainnetChainsArray } from "graz/chains";
import { createContext, useContext } from "react";

const WalletSupportedChainsContext = createContext<ChainInfo[] | null>(null);

let leapP: Promise<string[]> | undefined;
let keplrP: Promise<{ chainId: string }[]> | undefined;

const getChainIDs = async (
  walletType: WalletType,
  chainsData: {
    key: string;
    chainId: string;
    chainName: string;
    chainRegistryPath: string;
  }[]
) => {
  switch (walletType) {
    case WalletType.LEAP: {
      if (!leapP) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        leapP = window.leap.getSupportedChains();
      }
      const leapSupportedChains = await leapP;
      return chainsData
        .filter((c) => leapSupportedChains?.includes(c.chainRegistryPath))
        .map((c) => c.chainId);
    }
    case WalletType.KEPLR: {
      if (!keplrP) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        keplrP = window.keplr?.getChainInfosWithoutEndpoints();
      }
      const keplrSupportedChains = await keplrP;
      return chainsData
        .filter((chain) => {
          const chainData = keplrSupportedChains?.find(
            (c: { chainId: string }) => c.chainId === chain.chainId
          );
          return chainData !== undefined;
        })
        .map((c) => c.chainId);
    }
    case WalletType.COMPASS:
      return ["pacific-1", "atlantic-2"];
    default:
      return [];
  }
};

export const WalletSupportedChainsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: chains } = useChains();

  const { walletType } = useAccount({
    chainId: cosmoshubChainId,
  });

  const { data: walletSupportedChains } = useQuery({
    queryKey: ["chains", walletType],
    queryFn: async () => {
      const chainIds = await getChainIDs(walletType!, chains!);
      return mainnetChainsArray.filter((c) => chainIds.includes(c.chainId));
    },
    initialData: [],
    placeholderData: keepPreviousData,
    enabled: !!walletType && !!chains,
  });

  return (
    <WalletSupportedChainsContext.Provider value={walletSupportedChains}>
      {children}
    </WalletSupportedChainsContext.Provider>
  );
};

export const useWalletSupportedChains = () => {
  const value = useContext(WalletSupportedChainsContext);
  if (!value) {
    throw new Error(
      "useWalletSupportedChains must be used within a ChainsProvider"
    );
  }
  return value;
};
