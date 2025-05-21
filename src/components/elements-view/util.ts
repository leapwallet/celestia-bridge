import {
  AsyncIDBStorage,
  initCachingLayer,
  setLeapIntegratorID,
  setCustomHeaders
} from "@leapwallet/elements";
import { ChainDefaultsConfig } from "./types";

export const init = () => {
  initCachingLayer(AsyncIDBStorage);
  if (process.env.NEXT_PUBLIC_LEAP_API_APP_TYPE) {
    setCustomHeaders({
      'x-app-type': process.env.NEXT_PUBLIC_LEAP_API_APP_TYPE
    })
  }
  if (process.env.NODE_ENV === "production") {
    setLeapIntegratorID("");
  }
};

export const getDestinationDefaults = (key: string): ChainDefaultsConfig => {
  const chainDefaults: Record<string, ChainDefaultsConfig> = {
    'eclipse': {
      chainId: '9286185',
      defaultAssetDenom: '11111111111111111111111111111111',
      allowedChainConfig: [
        {
          chainId: '9286185',
        },
      ],
    },
    'celestia': {
      chainId: 'celestia',
      defaultAssetDenom: 'utia',
      allowedChainConfig: [
        {
          chainId: 'celestia',
        },
      ],
    },
    'forma': {
      chainId: '984122',
      defaultAssetDenom: 'forma-native',
      allowedChainConfig: [
        {
          chainId: '984122',
        },
      ],
    },
  }
  return {
    chainId: chainDefaults[key]?.chainId,
    defaultAssetDenom: chainDefaults[key]?.defaultAssetDenom,
    allowedChainConfig: chainDefaults[key] ? chainDefaults[key].allowedChainConfig : undefined
  }
}
