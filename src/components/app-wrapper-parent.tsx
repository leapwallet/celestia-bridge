"use client";

import { useEffect, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { GrazProvider, WalletType } from "graz";
import { testnetChainsArray, mainnetChainsArray } from "graz/chains";

import { queryClient } from "@/lib/query-client";
import { isTestnetApp } from "@/lib/utils";
import { mainnetWallets, testnetWallets } from "@/lib/wallets";
import { TooltipProvider } from "@leapwallet/ribbit-react";
import { walletConnectOptions } from "@/lib/constants";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TurnkeyProvider } from "@turnkey/sdk-react";
import { TurnkeyUserProvider } from "@/contexts/social-login-context";
import { PasskeyContext } from "@/contexts/passkey-context";
import { useConnectedWallets } from "@/hooks/use-connected-wallets";
import { GlobalConfigProvider } from "@/contexts/global-config";

export const turnkeyConfig = {
  apiBaseUrl: "https://api.turnkey.com",
  serverSignUrl: process.env.NEXT_PUBLIC_TURNKEY_SERVER_SIGN_URL,
  defaultOrganizationId: process.env.NEXT_PUBLIC_TURNKEY_DEFAULT_ORG_ID as string,
  iFrame: {
    url: "https://auth.turnkey.com",
    elementId: "turnkey-auth-iframe-element-id",
    containerId: "turnkey-auth-iframe-container-id",
    auth: {
      url: "https://auth.turnkey.com",
      containerId: "turnkey-auth-iframe-container-id",
    },
    export: {
      url: "https://export.turnkey.com",
      containerId: "turnkey-export-iframe-container-id",
    },
    import: {
      url: "https://import.turnkey.com",
      containerId: "turnkey-import-iframe-container-id",
    },
  },
  rpId: typeof window !== "undefined"
    ? window.location.hostname
    : process.env.NODE_ENV === "development" ? "localhost" : process.env.NEXT_PUBLIC_APP_DOMAIN,
  passkey: {
    rpId:
      typeof window !== "undefined"
        ? window.location.hostname === "localhost"
          ? "localhost"
          : window.location.hostname
        : "localhost",
  },
};

export function AppWrapperParent({ children }: { children: React.ReactNode }) {
  const connectedWallets = useConnectedWallets();
  const chain = process.env.NEXT_PUBLIC_CHAIN;
  const testnet = useMemo(() => {
    if (typeof window !== "undefined") {
      return isTestnetApp();
    }
    return false;
  }, []);

  useEffect(() => {
    const colorScheme = useColorScheme.getState().colorScheme;
    if (colorScheme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [])

  const grazOptions = useMemo(() => {
    return {
      chains: testnet ? testnetChainsArray : mainnetChainsArray,
      defaultWallet: WalletType.LEAP,
      walletConnect: {
        options: walletConnectOptions,
        web3Modal: {
          projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
          walletConnectVersion: 2,
          enableExplorer: true,
          explorerRecommendedWalletIds: [
            "3ed8cc046c6211a798dc5ec70f1302b43e07db9639fd287de44a9aa115a21ed6", // leap
            "123e6d19e6c0f575b148c469eb191f8b92618c13c94c4758aee35e042e37fa21", // compass
            "6adb6082c909901b9e7189af3a4a0223102cd6f8d5c39e39f3d49acb92b578bb", // keplr
            "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // metamask
            "feb6ff1fb426db18110f5a80c7adbde846d0a7e96b2bc53af4b73aaf32552bea", // cosmostation
            "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709", // okx
            "f896cbca30cd6dc414712d3d6fcc2f8f7d35d5bd30e3b1fc5d60cf6c8926f98f", // xdefi
            "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393", // phantom
            "1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79", // solflare
            "afbd95522f4041c71dd4f1a065f971fd32372865b416f95a0b1db759ae33f2a7", // omni wallet
            "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // coinbase
          ],
        },
      },
    };
  }, [testnet]);

  const chainId = useMemo(() => {
    return testnet ? "theta-testnet-001" : "cosmoshub-4";
  }, [testnet]);

  const wallets = useMemo(() => {
    return testnet ? testnetWallets : mainnetWallets;
  }, [testnet]);

  const globalConfig = useMemo(() => {
    return {
      chainId,
      testnet,
      wallets,
      connectedWallets,
      chain: chain ?? ''
    };
  }, [chainId, testnet, wallets, connectedWallets, chain]);

  return (
      <TooltipProvider delayDuration={250} skipDelayDuration={1000}>
        <QueryClientProvider client={queryClient}>
          <TurnkeyProvider config={{
            rpId: turnkeyConfig.rpId,
            apiBaseUrl: turnkeyConfig.apiBaseUrl,
            defaultOrganizationId: turnkeyConfig.defaultOrganizationId,
            serverSignUrl: turnkeyConfig.serverSignUrl,
          }}>
            <TurnkeyUserProvider>
              <PasskeyContext>
                {/* @ts-expect-error - grazOptions is web3modal types are a bit restrictive, but we need to use more config */}
                <GrazProvider grazOptions={grazOptions}>
                  <GlobalConfigProvider config={globalConfig}>
                    {children}
                  </GlobalConfigProvider>
                </GrazProvider>
              </PasskeyContext>
            </TurnkeyUserProvider>
          </TurnkeyProvider>
        </QueryClientProvider>
      </TooltipProvider>
  );
}
