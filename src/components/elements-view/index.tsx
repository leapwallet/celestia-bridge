"use client";

import { cosmoshubChainId } from "@/lib/constants";
import { useInputStateStore } from "@/store";
import { useConnectKitModal } from "@leapwallet/connect-kit-react";
import {
  AllowedChainConfig,
  ElementsProvider,
  MultiView,
  RouteSettingsProvider,
  SELECT_NONE,
  Swaps,
  Tabs,
  type RouteLoadEventData,
  type SwapValuesWithData,
} from "@leapwallet/elements";
import { useAccount } from "graz";
import { parseAsString, useQueryStates } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { ElementsViewSkeleton } from "./skeleton";
import { AggregatedSwapsViewProps } from "./types";
import { getDestinationDefaults, init } from "./util";
import { useGlobalConfig } from "@/contexts/global-config";
import { useAtomValue } from "jotai";
import { socialWalletConnecting } from "@/store/social-login";
import { leapPasskey } from "@/contexts/passkey-context";
import { useTurnkeyContext } from "@/contexts/social-login-context";

const ElementsView: React.FC<AggregatedSwapsViewProps> = ({
  allowedChainsAndAssets,
  allowedSourceChains,
}) => {
  init();
  const { setIsModalOpen } = useConnectKitModal();
	const { currentUser } = useTurnkeyContext()
  const { chain, chainId } = useGlobalConfig();
  const destinationChainDefaults = getDestinationDefaults(chain);
  const [enabledSourceChains, setEnabledSourceChains] = useState<AllowedChainConfig | undefined>(undefined);
  const [enabledDestinationChains, setEnabledDestinationChains] = useState<AllowedChainConfig | undefined>(destinationChainDefaults.allowedChainConfig);
  const { walletType } = useAccount({ chainId });
  const socialWalletLoading = useAtomValue(socialWalletConnecting);
  const [{ destinationAsset, sourceAsset, destinationChainId, sourceChainId }] =
    useQueryStates({
      destinationAsset: parseAsString,
      sourceAsset: parseAsString,
      destinationChainId: parseAsString,
      sourceChainId: parseAsString,
    });

  const defaults = useMemo(() => {
    return {
      sourceAsset: 'uatom',
      sourceChainId: 'cosmoshub-4',
      destinationAsset: destinationChainDefaults?.defaultAssetDenom ?? SELECT_NONE,
      destinationChainId: destinationChainDefaults?.chainId ?? SELECT_NONE
    };

    // do not include inputState in the dependencies, we only want to update the defaults based on search params
    // the defaults will trigger the Swaps component to re-render as it's the key prop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceChainId, destinationChainId, sourceAsset, destinationAsset, destinationChainDefaults]);

  const onValuesChange = (values: SwapValuesWithData) => {
    if (values.sourceChainId === destinationChainDefaults.chainId && !enabledSourceChains) {
      setEnabledSourceChains(destinationChainDefaults.allowedChainConfig);
      setEnabledDestinationChains(undefined);
    }
    if (values.sourceChainId !== destinationChainDefaults.chainId && enabledSourceChains) {
      setEnabledSourceChains(undefined);
      setEnabledDestinationChains(destinationChainDefaults.allowedChainConfig);
    }
  }

  const turnkeyWalletMethods = leapPasskey
  const isSocialWalletConnected = !!currentUser


  return (
    <ElementsProvider
      primaryChainId={cosmoshubChainId}
      connectWallet={() => setIsModalOpen(true)}
      connectedWalletType={walletType}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
      // @ts-ignore
      socialWalletMethods={turnkeyWalletMethods}
      isSocialWalletConnected={!!isSocialWalletConnected}
      isSocialWalletConnecting={socialWalletLoading}
      skeleton={<ElementsViewSkeleton />}
    >

      <RouteSettingsProvider enableSmartSwap={true}>
        <Swaps
          defaultValues={defaults}
          onValuesChange={onValuesChange}
          allowedSourceChains={enabledSourceChains}
          allowedDestinationChains={enabledDestinationChains}
        />
      </RouteSettingsProvider>
    </ElementsProvider>
  );
};

export default ElementsView;
