"use client";

import { useCallback, useEffect, useMemo } from "react";
import { IconContext } from "@phosphor-icons/react";
import dynamic from 'next/dynamic';
import { WalletType } from "graz";
import { isTestnetApp } from "@/lib/utils";
import { mainnetWallets, testnetWallets } from "@/lib/wallets";
import { WalletSupportedChainsProvider } from "@/contexts/wallet-supported-chains";
import { Toaster } from "@leapwallet/ribbit-react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTurnkeyContext } from "@/contexts/social-login-context";
import { CredentialResponse, GoogleOAuthProvider } from "@react-oauth/google";
import { useTurnkey } from "@turnkey/sdk-react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  setStorageValue,
  StorageKeys,
  TurnkeySDKApiTypes,
} from "@turnkey/sdk-browser";
import {
  // passkeySignInState,
  signInState,
  socialLoginMethod,
  socialWalletConnecting,
  sourceCosmosChainId,
  turnkeyUserSession,
} from "@/store/social-login";
import { loginResponseToUser } from "./social-login/utils";
import { SocialLogin } from "./social-login";
import { leapPasskey } from "@/contexts/passkey-context";
import EmbeddedWallet from "./embedded-wallet";
import { useIsMobileView } from "@/hooks/use-is-mobile-view";
import { useConnectedWallets } from "@/hooks/use-connected-wallets";

const ConnectKitProvider = dynamic(() => import('@leapwallet/connect-kit-react').then(mod => mod.ConnectKitProvider), {
  ssr: false
});

const iconContextValue = {
  color: "currentColor",
  size: 16,
  weight: "bold",
  mirrored: false,
} as const;

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const connectedWallets = useConnectedWallets();
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
  }, []);

  const chainId = useMemo(() => {
    return testnet ? "theta-testnet-001" : "cosmoshub-4";
  }, [testnet]);

  const wallets = useMemo(() => {
    return testnet ? testnetWallets : mainnetWallets;
  }, [testnet]);

  const { isMobile } = useIsMobileView();

  /**
   * social login methods:
   */
  const { turnkey, authIframeClient } = useTurnkey();
  const setSocialWalletConnecting = useSetAtom(socialWalletConnecting);

  const setTurnkeyUser = useSetAtom(turnkeyUserSession);
  const setSocialLoginMethod = useSetAtom(socialLoginMethod);
  const socialLoginMethodType = useAtomValue(socialLoginMethod);

  const { setCurrentUser, currentUser } = useTurnkeyContext();
  const setSignInOpen = useSetAtom(signInState);
  // const setPasskeySignInOpen = useSetAtom(passkeySignInState);

  const handleLogout = useCallback(async () => {
    await turnkey?.logoutUser();
    setCurrentUser(undefined);
    setTurnkeyUser(undefined);
    setSocialLoginMethod(undefined);

    // TODO NOTE - make sure proper disconnect
    // leapPasskey.disconnect('cosmoshub-4') // chain-id does not matter here
  }, [turnkey, setCurrentUser, setTurnkeyUser, setSocialLoginMethod]);

  const handleGoogleLogin = async (response: CredentialResponse) => {
    setSocialWalletConnecting(true)
    // const decodedJWT = jwtDecode<GoogleJwtPayload>(response.credential!)
    // const userEmail = decodedJWT.email

    let targetSubOrgId: string
    const subOrgIds = (await turnkey?.serverSign('getSubOrgIds', [
      {
        filterType: 'OIDC_TOKEN',
        filterValue: response.credential
      }
    ])) as TurnkeySDKApiTypes.TGetSubOrgIdsResponse

    targetSubOrgId = subOrgIds.organizationIds[0]

    if (subOrgIds.organizationIds.length === 0) {
      // create a sub org for this user:

      if (!response.credential) {
        throw new Error('No credential found in OAuth response')
      }

      const subOrganizationConfig: TurnkeySDKApiTypes.TCreateSubOrganizationBody =
        {
          subOrganizationName: 'Sub-org',
          rootUsers: [
            {
              userName: '',
              userEmail: '',
              oauthProviders: [
                {
                  providerName: 'Google Auth - Embedded Wallet',
                  oidcToken: response.credential
                }
              ],
              apiKeys: [],
              authenticators: []
            }
          ],
          rootQuorumThreshold: 1,
          wallet: {
            walletName: 'Default Wallet',
            accounts: [
              {
                curve: 'CURVE_SECP256K1',
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/118'/0'/0/0",
                addressFormat: 'ADDRESS_FORMAT_UNCOMPRESSED' // public key
              },
              {
                curve: 'CURVE_SECP256K1',
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/60'/0'/0/0",
                addressFormat: 'ADDRESS_FORMAT_COMPRESSED' // evm public key
              },
              {
                curve: 'CURVE_SECP256K1',
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/118'/0'/0/0",
                addressFormat: 'ADDRESS_FORMAT_COSMOS' // cosmos address
              },
              {
                curve: 'CURVE_SECP256K1',
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/60'/0'/0/0",
                addressFormat: 'ADDRESS_FORMAT_ETHEREUM' // evm address
              }
            ]
          }
        }

      const createSubOrganizationResponse = (await turnkey?.serverSign(
        'createSubOrganization',
        [subOrganizationConfig]
      )) as TurnkeySDKApiTypes.TCreateSubOrganizationResponse
      targetSubOrgId = createSubOrganizationResponse.subOrganizationId
    }

    if (authIframeClient?.iframePublicKey) {
      const oauthResponse = (await turnkey?.serverSign('oauth', [
        {
          oidcToken: response.credential,
          targetPublicKey: authIframeClient?.iframePublicKey,
          organizationId: targetSubOrgId
        }
      ])) as TurnkeySDKApiTypes.TOauthResponse

      const credentialResponse = await authIframeClient?.injectCredentialBundle(
        oauthResponse.credentialBundle
      )

      if (credentialResponse) {
        const loginResponse = await authIframeClient?.login()
        if (loginResponse?.organizationId) {
          const customLoginResponse = loginResponseToUser(loginResponse)
          await setStorageValue(StorageKeys.CurrentUser, customLoginResponse)

          await authIframeClient?.loginWithReadWriteSession(
            authIframeClient.iframePublicKey
          )

          setSocialLoginMethod('gmail')
          // userEmailSetter(userEmail)
          setCurrentUser(customLoginResponse)
          setTurnkeyUser(customLoginResponse)
          setSignInOpen(false)
          setSocialWalletConnecting(false)
        }
      }
    }
  }

  const cosmosSourceChainId = useAtomValue(sourceCosmosChainId);
  const addressMap = leapPasskey.getAddressMap();
  const currentSourceAddress = addressMap?.[cosmosSourceChainId]

  return (
    <GoogleOAuthProvider
      clientId={
        process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID as string
      }
    >
      <ConnectKitProvider
        multiChainConnect="all"
        chainId={currentSourceAddress ? cosmosSourceChainId : chainId}
        wallets={wallets}
        noncePublicKey={authIframeClient?.iframePublicKey ?? ""}
        googleClientId={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID as string}
        customWallets={[
          // Note: uncomment this when we want to also support passkey (there's no issue with it)
          // {
          //   walletInfo: {
          //     name: "passkey_wallet" as WalletType,
          //     isAvailable: true,
          //     prettyName: "Continue with Passkey",
          //     icon: "/passkey.svg",
          //     downloadUrl: {
          //       desktop:
          //         "https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge",
          //       android:
          //         "https://play.google.com/store/apps/details?id=com.okinc.okex.gp",
          //       ios: "https://apps.apple.com/us/app/okx-buy-bitcoin-btc-crypto/id1327268470",
          //     },
          //   },
          //   handleCustomWalletClick: () => setPasskeySignInOpen(true),
          //   handleCustomWalletDisconnect: () => handleLogout(),
          //   walletStatus: {
          //     name: "Passkey",
          //     address: currentSourceAddress ?? "",
          //     isConnected:
          //       socialLoginMethodType === "passkey" ? !!currentUser : false,
          //   },
          // },
          {
            walletInfo: {
              name: "google_wallet" as WalletType,
              isAvailable: true,
              prettyName: "Continue with Google",
              icon: "/google.svg",
              downloadUrl: {
                desktop:
                  "https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge",
                android:
                  "https://play.google.com/store/apps/details?id=com.okinc.okex.gp",
                ios: "https://apps.apple.com/us/app/okx-buy-bitcoin-btc-crypto/id1327268470",
              },
            },
            handleCustomWalletClick: (res) => handleGoogleLogin(res),
            handleCustomWalletDisconnect: () => handleLogout(),
            walletStatus: {
              name: "Google",
              address: currentSourceAddress ?? "",
              isConnected:
                socialLoginMethodType === "gmail" ? !!currentUser : false,
            },
          },
        ]}
      >
        <WalletSupportedChainsProvider>
              <IconContext.Provider value={iconContextValue}>
                {children}
                <Toaster
                  duration={3000}
                  richColors={true}
                  visibleToasts={5}
                  className="font-sans"
                />
                <SocialLogin />
                {!isMobile && connectedWallets.length > 0 && <EmbeddedWallet stickyView isEmbedWalletOpen={true} setEmbedWalletOpen={() => { }} />}
              </IconContext.Provider>
        </WalletSupportedChainsProvider>
      </ConnectKitProvider>
    </GoogleOAuthProvider>
  );
}