import { AllowedChainConfig } from "@leapwallet/elements";

export type EmbedType = "swaps" | "buy" | "send" | "multiview";

export type TransactionType = {
  sourceAssetAmount: string;
  destAssetAmount: string;
  txHash?: string;
  explorerLink?: string;
  destAddress?: string;
};

export type AggregatedSwapsViewProps = {
  allowedChainsAndAssets?: AllowedChainConfig;
  allowedSourceChains?: AllowedChainConfig;
};

export type ChainDefaultsConfig = {
  chainId: string | undefined;
  defaultAssetDenom: string | undefined;
  allowedChainConfig: AllowedChainConfig | undefined;
}
