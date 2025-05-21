import { WalletConnectEvent, WalletDisconnectEvent } from "@/lib/types";
import { elementsEvents } from "@leapwallet/elements";
import { ConnectedWallet } from "@leapwallet/embedded-wallet-sdk-react";
import { useEffect, useMemo, useState } from "react";

export type ElementsConnectedWallet = {
  prettyName: string;
  type: 'evm-wallet' | 'cosmos-wallet' | 'svm-wallet';
  address: string;
  logoUrl?: string;
}

export const useConnectedWallets = () => {
  const [connectedWallets, setConnectedWallets] = useState<ElementsConnectedWallet[]>([]);

  useEffect(() => {

    const handleWalletConnect = (e: WalletConnectEvent) => {
      console.log('Wallet connected:', e.detail);
      setConnectedWallets(prev => {
        const isConnected = prev.find(wallet => wallet?.type === e.detail?.connectionType);
        if (isConnected) {
          return prev;
        }
        return prev.concat({
          prettyName: e.detail?.name,
          type: e.detail?.connectionType,
          address: e.detail?.address,
          logoUrl: e.detail?.logoUrl
        } as ElementsConnectedWallet);
      });
    };

    const handleWalletDisconnect = (e: WalletDisconnectEvent) => {
      setConnectedWallets(prev => prev.filter(wallet => wallet?.type !== e.detail?.connectionType))
    }

    window.addEventListener(elementsEvents.wallet.connect, handleWalletConnect as EventListener)
    window.addEventListener(elementsEvents.wallet.disconnect, handleWalletDisconnect as EventListener)

    return () => {
      window.removeEventListener(elementsEvents.wallet.connect, handleWalletConnect as EventListener)
      window.removeEventListener(elementsEvents.wallet.disconnect, handleWalletDisconnect as EventListener)
    }
  }, [])

  const connectedWalletList = useMemo(() => {
    return connectedWallets.map(wallet => {
      return {
        prettyName: wallet.prettyName,
        type: wallet.type.split('-')[0],
        address: wallet.address,
        logoUrl: wallet?.logoUrl
      } as ConnectedWallet
    }).filter(wallet => wallet.type === 'evm' || wallet.type === 'cosmos');
  }, [connectedWallets]);

  return connectedWalletList;
}