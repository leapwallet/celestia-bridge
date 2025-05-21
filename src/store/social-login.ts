// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { User } from 'node_modules/@turnkey/sdk-browser/dist/models'
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const turnkeyUserSession = atomWithStorage<User | undefined>(
  'turnkey_user_session',
  undefined
)

export const socialLoginMethod = atomWithStorage<
  'gmail' | 'passkey' | undefined
>('social_login_method', undefined)

export const isTestnetAtom = atomWithStorage('isTestnet', false)
export const signInState = atom<boolean>(false);
export const passkeySignInState = atom<boolean>(false);
export const socialWalletConnecting = atom<boolean>(false);
export const sourceCosmosChainId = atomWithStorage<string>('source_cosmos_chain_id', 'cosmoshub-4');
