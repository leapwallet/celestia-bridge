import { Passkey } from './passkey'
import { TurnkeyDirectWallet } from '@turnkey/cosmjs'

export const RP_NAME = 'Turnkey passkey'
const STORE_KEY = 'authn-web'

export const KUJIRA_RPC_URL =
  'https://kujira-rpc.publicnode.com:443/9a353f27b9e92ea909491d7ae2102facbd105fb06ff969932dd19cb31d93d0a6'

/**
 * Fetches stored signers from the local storage and returns them as a record.
 *
 * @returns A record of signers where the key is the signer's ID and the value is the signer itself.
 * If no signers are found in the local storage, it returns an empty record.
 *
 * @remarks
 * This function retrieves the stored signers from the local storage, parses them into a record,
 * and then creates new AuthnWebSigner instances for each stored signer.
 *
 * @example
 * ```typescript
 * const signers = fetchSigners();
 * console.log(signers); // { 'signer1': AuthnWebSigner, 'signer2': AuthnWebSigner, ... }
 * ```
 */
export function fetchSigner(): TurnkeyDirectWallet | undefined {
  const storedJSON = localStorage.getItem(STORE_KEY)
  if (!storedJSON) {
    return undefined
  }

  const stored: TurnkeyDirectWallet | undefined = JSON.parse(storedJSON)
  return stored ? stored : undefined
}

/**
 * Initializes wallets for each signer.
 *
 * @param signer - A record of signers where the key is the signer's ID and the value is the signer itself.
 * @returns A promise that resolves to a record of wallets, where the key is the signer's ID and the value is the corresponding wallet.
 * If there are no signers, it resolves to `undefined`.
 */
export async function getWalletFromSigner(
  signer: TurnkeyDirectWallet
): Promise<Passkey | undefined> {
  if (!signer) {
    return
  }
  const passkey = await Passkey.connect(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    { undefined, rpc: KUJIRA_RPC_URL },
    signer
  )

  return passkey
}

/**
 * Stores the provided signer in the local storage.
 *
 * @param signer - The AuthnWebSigner instance to be stored.
 *
 * @remarks
 * This function stores the provided signer in the local storage.
 * It retrieves the existing signers from the local storage, adds the new signer,
 * and then updates the local storage with the new set of signers.
 *
 * @example
 * ```typescript
 * const signer = await AuthnWebSigner.create(publicKeyCredentialRpEntity, name);
 * storeSigner(signer);
 * ```
 */
export function storeSigner(signer: TurnkeyDirectWallet) {
  localStorage.setItem(STORE_KEY, JSON.stringify(signer))
}
