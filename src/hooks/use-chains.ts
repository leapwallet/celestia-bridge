import { keepPreviousData, useQuery } from "@tanstack/react-query";

/**
 * Get the list of chains with metadata supported by Elements
 */
export const useChains = () => {
  return useQuery({
    queryKey: ["chains"],
    queryFn: async () => {
      const chains = await fetch(
        "https://assets.leapwallet.io/cosmos-registry/v1/elements-data/chains.json"
      ).then((res) => res.json());

      return chains as {
        chainId: string;
        chainName: string;
        key: string;
        chainRegistryPath: string;
      }[];
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    initialData: [],
  });
};
