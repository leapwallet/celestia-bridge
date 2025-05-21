import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RouteLoadEventData } from "@leapwallet/elements";

type InputState = {
  sourceAsset: string | undefined;
  sourceChainId: string | undefined;
  destinationAsset: string | undefined;
  destinationChainId: string | undefined;
  inputAmount: string;
};

interface InputStateStore {
  inputState: InputState;
  setInputState: (newState: Partial<InputState>) => void;
}

type EmbeddedWalletState = {
  isEmbedWalletOpen: boolean;
  setEmbedWalletOpen: (open: boolean) => void;
};

type TransactionHistoryState = {
  isTransactionHistoryOpen: boolean;
  setTransactionHistoryOpen: (open: boolean) => void;
};

type LatestTransactionState = {
  latestTransactionTimestamp: number;
  setLatestTransactionTimestamp: (timestamp: number) => void;
};

export const useInputStateStore = create(
  persist<InputStateStore>(
    (set) => ({
      inputState: {
        sourceAsset: "uatom",
        sourceChainId: "cosmoshub-4",
        destinationAsset: "uosmo",
        destinationChainId: "osmosis-1",
        inputAmount: "",
      },
      setInputState: (newState) =>
        set((state) => ({
          inputState: Object.assign(state.inputState, newState),
        })),
    }),
    {
      name: "swaps_input_state",
    }
  )
);

export const useEmbeddedWalletState = create<EmbeddedWalletState>((set) => ({
  isEmbedWalletOpen: false,
  setEmbedWalletOpen: (open) => set({ isEmbedWalletOpen: open }),
}));
