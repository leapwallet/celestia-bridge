// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { definitions } from 'node_modules/@turnkey/sdk-browser/dist/__inputs__/public_api.types'
export type turnkeyWalletType = {
    walletId: string
    walletName: string
    createdAt: definitions['externaldatav1Timestamp']
    updatedAt: definitions['externaldatav1Timestamp']
    exported: boolean
    imported: boolean
  }
  
  export type selectedAccountType = {
    organizationId: string
    walletId: string
    curve: definitions['v1Curve']
    pathFormat: definitions['v1PathFormat']
    path: string
    addressFormat: definitions['v1AddressFormat']
    address: string
    createdAt: definitions['externaldatav1Timestamp']
    updatedAt: definitions['externaldatav1Timestamp']
}