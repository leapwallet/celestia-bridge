import { type CosmosChainData, getChains } from "@leapwallet/elements-core";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";

export default function useElementsChains(): UseQueryResult<
  Omit<CosmosChainData, "chainType">[] | undefined
> {
  return useQuery({
    queryKey: ["elements-chains"],
    queryFn: async () => {
      try {
        const res = await getChains();

        return res;
      } catch (error) {
        console.error(error);
        return undefined;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
