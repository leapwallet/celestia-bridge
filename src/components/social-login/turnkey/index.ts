"use client"

import { StdSignDoc } from '@cosmjs/amino'
import { bech32 } from 'bech32'
import { Fee, SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { Passkey } from './passkey'
import { OfflineDirectSigner } from '@cosmjs/proto-signing'
import { getWalletFromSigner } from './wallet'
import { type AccountData } from '@cosmjs/proto-signing'
import { TurnkeyDirectWallet } from '@turnkey/cosmjs'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { User } from 'node_modules/@turnkey/sdk-browser/dist/models'
import {
  TurnkeyBrowserClient,
  TurnkeyBrowserSDK,
  TurnkeyIframeClient
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from 'node_modules/@turnkey/sdk-browser/dist/sdk-client'
import { pubToAddress } from 'ethereumjs-util'
import { mainnet } from 'viem/chains'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {
  createAuthInfo,
  createBody,
  createFee,
  createSigners,
  createTxRawEIP712,
  createWeb3Extension,
  fetchBlockHeight,
  fromHex,
  getCosmosAddress,
  hexToBase64,
  recoverTypedSignaturePubKey,
  createTxRawEthermintEIP712
} from './utils'
import { createTxIBCMsgTransfer, fromEthSignature } from './utils-ethermint'
import {
  TxRaw,
  TxBody,
  AuthInfo
} from '@injectivelabs/core-proto-ts/esm/cosmos/tx/v1beta1/tx'
import { Account, createWalletClient, http } from 'viem'
import { createAccount } from '@turnkey/viem'
import { getEip712TypedDataV2 } from './eip712/eip712'
import { SignMode } from '@injectivelabs/core-proto-ts/esm/cosmos/tx/signing/v1beta1/signing'
import { Msg } from '@leapwallet/elements-core'
import { ExtensionOptionsWeb3Tx } from './ethermint/tx'
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx'
import { splitSignature } from '@ethersproject/bytes'
import { turnkeyConfig } from '@/components/app-wrapper-parent'

const imagePaths = {
  gmail: '/google.svg',
  passkey: '/passkey.svg'
}

interface ILeapPasskey {
  setChainIdToPrefixAndCointypeMapping: (
    chainIdToPrefixMapping: Record<string, string>,
    chainIdToCoinTypeMapping: Record<string, string>
  ) => void
  setTurnkeyDependencies: (
    turnkey: TurnkeyBrowserSDK | undefined,
    authIframeClient: TurnkeyIframeClient | undefined
  ) => void
  setTurnkeyMethods: (
    activeClient: TurnkeyBrowserClient | undefined,
    pubKey: string | undefined,
    pubKeyEvm: string | undefined,
    evmAddress: string | undefined,
    currentUser: User | undefined,
    signInMethod: 'gmail' | 'passkey' | undefined
  ) => void
  setTurnkeySigner: (turnkeySigner: TurnkeyDirectWallet) => void
  getChainIdToPrefixMapping: () => Record<string, string>
  getWallet: () => Passkey | undefined
  getCurrentUser: () => User | undefined
  getSignInMethodImage: () => string | undefined
  getSignInMethod: () => 'gmail' | 'passkey' | undefined
  generateAddresses: () => Promise<void>
  getAddressMap: () => Record<string, string>
  createWallet: (walletName: string) => Promise<void>
  loadWalletIfAny: () => Promise<void>
  connect: () => Promise<void>
  enable: (chainIds: string[]) => Promise<void>
  disconnect: (chainId: string) => boolean
  getId: () => Uint8Array | undefined
  getKey: (
    chainId: string,
    coinType?: string
  ) => Promise<
    | {
        name: string
        algo: string
        bech32Address: string
        address: Uint8Array
        pubKey: Uint8Array
        isNanoLedger: boolean
      }
    | undefined
  >
  getOfflineSigner: (
    chainId: string,
    signOptions?: object
  ) => OfflineDirectSigner
  getSupportedChains: () => Promise<string[]>
  isConnected: (chainId: string) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
  experimentalSuggestChain: (chainInfo: any) => Promise<void>
  getKeys: (chainIds: string[]) => Promise<AccountData[] | undefined>
  signInjectiveEIP712: (
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    encodedMessages: Msg[],
    rpcUrl: string
  ) => Promise<string>
  signEthermintEIP712: (
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    encodedMessages: Msg[],
    ethereumChainId?: string,
    extensionTypeUrl?: string
  ) => Promise<string>
  signArbitrary: (
    chainId: string,
    signer: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
    data: any,
    signOptions?: object
  ) => void
  signDirect: (
    chainId: string,
    signer: string,
    signDoc: SignDoc,
    signOptions?: object
  ) => void
}

export class LeapPasskey implements ILeapPasskey {
  private static instance: LeapPasskey
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
  private connectWalletPromise: Promise<any> | undefined
  private chainIdToPrefixMapping: Record<string, string> = {}
  private chainIdToCoinTypeMapping: Record<string, string> = {}
  private addresses: Record<string, string> = {}
  private wallet: Passkey | undefined
  private turnkeySigner: TurnkeyDirectWallet | undefined
  private turnkey: TurnkeyBrowserSDK | undefined
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private authIframeClient: TurnkeyIframeClient | undefined
  private activeClient: TurnkeyBrowserClient | undefined
  private pubKey: string | undefined
  private pubKeyEvm: string | undefined
  private evmAddress: string | undefined
  private currentUser: User | undefined
  private signInMethod: 'gmail' | 'passkey' | undefined

  constructor() {
    if (LeapPasskey.instance) {
      return LeapPasskey.instance
    }
    LeapPasskey.instance = this
  }

  public static getInstance(): LeapPasskey {
    if (!LeapPasskey.instance) {
      LeapPasskey.instance = new LeapPasskey()
    }

    return LeapPasskey.instance
  }

  public setChainIdToPrefixAndCointypeMapping(
    chainIdToPrefixMapping: Record<string, string>,
    chainIdToCoinTypeMapping: Record<string, string>
  ) {
    this.chainIdToPrefixMapping = chainIdToPrefixMapping
    this.chainIdToCoinTypeMapping = chainIdToCoinTypeMapping
  }

  public setTurnkeyDependencies(
    turnkey: TurnkeyBrowserSDK | undefined,
    authIframeClient: TurnkeyIframeClient | undefined
  ) {
    this.turnkey = turnkey
    this.authIframeClient = authIframeClient
  }

  public setTurnkeyMethods(
    activeClient: TurnkeyBrowserClient | undefined,
    pubKey: string | undefined,
    pubKeyEvm: string | undefined,
    evmAddress: string | undefined,
    currentUser: User | undefined,
    signInMethod: 'gmail' | 'passkey' | undefined
  ) {
    this.activeClient = activeClient
    this.pubKey = pubKey
    this.pubKeyEvm = pubKeyEvm
    this.evmAddress = evmAddress
    this.currentUser = currentUser
    this.signInMethod = signInMethod
  }

  public getCurrentUser() {
    return this.currentUser
  }

  public getSignInMethodImage() {
    if (this.signInMethod) {
      const img = imagePaths[this.signInMethod]
      return img
    }
  }

  public getSignInMethod() {
    return this.signInMethod
  }

  public setTurnkeySigner(turnkeySigner: TurnkeyDirectWallet) {
    this.turnkeySigner = turnkeySigner
  }

  public getChainIdToPrefixMapping() {
    return this.chainIdToPrefixMapping
  }

  public getWallet() {
    return this.wallet
  }

  public async generateAddresses() {
    if (!this.wallet?.account) {
      console.error('No wallet available')
      return
    }

    if (!this.chainIdToPrefixMapping) {
      console.error('No chainIdToPrefixMapping available')
      return
    }

    const { words } = bech32.decode(this.wallet.account?.address)
    Object.keys(this.chainIdToPrefixMapping ?? {}).map(async (key) => {
      const coinType = this.chainIdToCoinTypeMapping[key]
      const prefix = this.chainIdToPrefixMapping[key]

      /**
       * If chain is not of coin-type 118, then we cant form it using cosmos address
       * so we use signer
       *
       */
      if (coinType !== '118') {
        if (coinType === '60' || prefix.startsWith('inj')) {
          if (coinType === '60' && !prefix.startsWith('inj')) {
            return
          }

          const ethAddress = this.evmAddress ?? ''
          const currAccount = getCosmosAddress(ethAddress, prefix)
          this.addresses[key] = currAccount
        } else {
          const currentChainSigner = await TurnkeyDirectWallet.init({
            config: {
              client: this.activeClient!, // safe assumption
              organizationId: `${this.currentUser?.organization.organizationId}`,
              signWith: `${this.pubKey}`
            },
            prefix: prefix
          })
          const currAccount = (await currentChainSigner.getAccounts())?.[0]
            ?.address
          this.addresses[key] = currAccount
        }
      } else {
        this.addresses[key] = bech32.encode(prefix, words)
      }
    })
  }

  public getAddressMap() {
    return this.addresses
  }

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createWallet(_walletName: string) {
    // just here for wallet method consistency
  }

  async loadWalletIfAny() {
    const signer = this.turnkeySigner
    if (!signer) {
      return
    }

    const wallet = await getWalletFromSigner(signer)
    this.wallet = wallet
    await this.generateAddresses()
  }

  async connect() {
    const user = await this.turnkey?.getCurrentUser()
    if (user?.userId) {
      this.loadWalletIfAny()
      return
    }
    return
  }

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enable(_chainIds: string[]) {
    if (!this.wallet) {
      if (!this.connectWalletPromise) {
        this.connectWalletPromise = this.connect()
      }
      await this.connectWalletPromise
      this.connectWalletPromise = undefined
      return
    }

    return
  }

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  disconnect(_chainId: string) {
    this.wallet = undefined
    this.addresses = {}
    this.connectWalletPromise = undefined
    this.turnkeySigner = undefined
    this.activeClient = undefined
    this.pubKey = undefined
    this.currentUser = undefined
    this.signInMethod = undefined

    return true
  }

  getId() {
    if (!this.wallet) {
      return
    }
    return this.wallet.account.pubkey
  }

  async getKey(chainId: string, coinType?: string) {
    if (!this.wallet) {
      if (!this.connectWalletPromise) {
        this.connectWalletPromise = this.connect()
      }
      await this.connectWalletPromise
      this.connectWalletPromise = undefined
      if (!this.wallet) {
        return
      }
    }
    if (!this.wallet.account) throw new Error('No account')

    // ethermint chains use the evm pubkey
    const publicKey =
      chainId === 'injective-1' || coinType === '60'
        ? fromHex(this.pubKeyEvm!.replace('0x', ''))
        : this.wallet.account.pubkey

    return {
      name: this.wallet.account.address ?? '',
      algo: this.wallet.account.algo,
      bech32Address: this.addresses?.[chainId] ?? this.wallet.account.address,
      address: publicKey,
      pubKey: publicKey,
      isNanoLedger: false
    }
  }

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  getOfflineSigner(_chainId: string, _signOptions = {}): OfflineDirectSigner {
    if (!this.wallet) {
      return {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        signDirect: async () => {
          console.error('No wallet available')
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        getAccounts: async () => {
          console.error('No wallet available')
        }
      } as unknown as OfflineDirectSigner
    }
    const wallet = this.wallet
    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      signDirect: async (signer: string, signDoc: SignDoc) => {
        const decodedAddress = bech32.decode(signer)
        const addressPrefix = decodedAddress.prefix

        const turnkeySigner = await TurnkeyDirectWallet.init({
          config: {
            client: this.activeClient!, // safe assumption
            organizationId: `${this.currentUser?.organization.organizationId}`,
            signWith: `${this.pubKey}`
          },
          prefix: addressPrefix
        })

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const signedData = await turnkeySigner.signDirect(signer, signDoc)
        return signedData
      },
      getAccounts: async () => {
        return [wallet.account]
      }
    }
  }

  async getSupportedChains() {
    return this.chainIdToPrefixMapping
      ? Object.keys(this.chainIdToPrefixMapping)
      : ['kaiyo']
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isConnected(_chainId: string) {
    if (this.wallet) {
      return true
    }
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars
  async experimentalSuggestChain(_chainInfo: any) {
    // just here for wallet method consistency
  }

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getKeys(_chainIds: string[]) {
    if (!this.wallet) {
      if (!this.connectWalletPromise) {
        this.connectWalletPromise = this.connect()
      }
      await this.connectWalletPromise
      this.connectWalletPromise = undefined
      return
    }

    return [this.wallet.account]
  }

  async signInjectiveEIP712(
    _chainId: string,
    _signer: string,
    signDoc: StdSignDoc,
    _encodedMessages: Msg[],
    rpcUrl: string
  ) {
    if (!this.wallet) {
      throw new Error('No wallet available')
    }

    // turnkey ethers signer reference:
    // const ethersSigner = new TurnkeyEthersSigner({
    //   client: this.activeClient!,
    //   organizationId: turnkeyConfig.defaultOrganizationId,
    //   signWith: `${this.pubKeyEvm?.replace('0x', '')}`
    // })

    const turnkeyAccount = await createAccount({
      client: this.activeClient!,
      organizationId: turnkeyConfig.defaultOrganizationId,
      signWith: this.evmAddress!
    })

    // viem client:
    const client = createWalletClient({
      account: turnkeyAccount as Account,
      chain: mainnet,
      transport: http(mainnet.rpcUrls.default.http[0])
    })
    const block = await fetchBlockHeight(rpcUrl)

    // prep typed data:
    const eip712TypedData = getEip712TypedDataV2({
      msgs: _encodedMessages,
      ethereumChainId: '1',
      tx: {
        accountNumber: signDoc.account_number,
        chainId: signDoc.chain_id,
        sequence: signDoc.sequence,
        timeoutHeight: (block + 90).toString(),
        memo: signDoc.memo
      },
      fee: {
        amount: signDoc.fee.amount.map((coin) => ({
          amount: coin.amount,
          denom: coin.denom
        })),
        gas: signDoc.fee.gas
      }
    })

    const signature = await client.signTypedData({
      primaryType: eip712TypedData.primaryType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      domain: eip712TypedData.domain as any,
      // account: turnkeyAccount.address,
      types: eip712TypedData.types,
      message: eip712TypedData.message
    })

    const signatureBuff = new Uint8Array(
      Buffer.from(signature.replace('0x', ''), 'hex')
    )
    const pubkeyHex = recoverTypedSignaturePubKey(eip712TypedData, signature)

    const publicKeyBase64 = hexToBase64(pubkeyHex)
    const signMode = SignMode.SIGN_MODE_EIP712_V2

    const body = createBody({
      messages: _encodedMessages,
      memo: signDoc.memo,
      timeoutHeight: block + 90
    })

    const feeMessage = createFee({
      fee: signDoc.fee.amount[0],
      payer: signDoc.fee.payer,
      granter: signDoc.fee.granter,
      gasLimit: parseInt(signDoc.fee.gas)
    })

    const signInfo = createSigners({
      chainId: signDoc.chain_id,
      mode: signMode,
      signers: [
        {
          pubKey: publicKeyBase64,
          sequence: parseInt(signDoc.sequence)
        }
      ]
    })

    const authInfo = createAuthInfo({
      signerInfo: signInfo,
      fee: feeMessage
    })

    const bodyBytes = TxBody.encode(body).finish()
    const authInfoBytes = AuthInfo.encode(authInfo).finish()

    const txRaw = TxRaw.create()
    txRaw.authInfoBytes = authInfoBytes
    txRaw.bodyBytes = bodyBytes

    const web3Extension = createWeb3Extension({
      ethereumChainId: '1'
    })
    const txRawEip712 = createTxRawEIP712(txRaw, web3Extension)

    txRawEip712.signatures = [signatureBuff]

    const txBytes = TxRaw.encode(txRawEip712).finish()

    /**
     * the below string can directly be submitted/broadcasted to the chain:
     */
    return Buffer.from(txBytes).toString('base64')
  }

  /**
   * Sign a transaction using EIP712 for Ethermint-based chains
   * This method is similar to signInjectiveEIP712 but uses the createTxRawEthermintEIP712 function
   * which is specifically designed for other Ethermint chains (cointype 60)
   */
  async signEthermintEIP712(
    _chainId: string,
    _signer: string,
    signDoc: StdSignDoc,
    _encodedMessages: Msg[]
  ) {
    if (!this.wallet) {
      throw new Error('No wallet available')
    }

    const turnkeyAccount = await createAccount({
      client: this.activeClient!,
      organizationId: turnkeyConfig.defaultOrganizationId,
      signWith: this.evmAddress!
    })

    // viem client:
    const client = createWalletClient({
      account: turnkeyAccount as Account,
      chain: mainnet,
      transport: http(mainnet.rpcUrls.default.http[0])
    })

    const senderAddress = this.addresses[_chainId]
    const sender = {
      accountAddress: senderAddress,
      sequence: parseInt(signDoc.sequence),
      accountNumber: parseInt(signDoc.account_number),
      pubkey: this.pubKeyEvm // Buffer.from(this.pubKeyEvm || '', 'hex').toString('base64')
    }

    const curChain = {
      chainId: 9001,
      cosmosChainId: signDoc.chain_id
    }

    const stdFee = Fee.fromPartial({
      amount: [
        {
          amount: signDoc.fee.amount[0].amount,
          denom: signDoc.fee.amount[0].denom
        }
      ],
      gasLimit: BigInt(signDoc.fee.gas),
      payer: sender.accountAddress
    })

    const msgValue = _encodedMessages[0].value as MsgTransfer

    const tx = createTxIBCMsgTransfer(
      curChain,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sender as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stdFee as any,
      signDoc.memo ?? '',
      {
        sourcePort: msgValue.sourcePort,
        sourceChannel: msgValue.sourceChannel,
        amount: msgValue.token.amount,
        denom: msgValue.token.denom,
        receiver: msgValue.receiver,
        memo: signDoc.memo ?? '',
        revisionHeight: Number(msgValue.timeoutHeight.revisionHeight),
        revisionNumber: Number(msgValue.timeoutHeight.revisionNumber),
        timeoutTimestamp: msgValue.timeoutTimestamp.toString()
      }
    )

    const eipData = tx.eipToSign
    const signature = await client.signTypedData({
      primaryType: eipData.primaryType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      domain: eipData.domain as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      types: eipData.types as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message: eipData.message as any
    })

    const sigSplit = splitSignature(signature)
    const extension = {
      typeUrl: '/ethermint.types.v1.ExtensionOptionsWeb3Tx',
      value: ExtensionOptionsWeb3Tx.encode(
        ExtensionOptionsWeb3Tx.fromPartial({
          typedDataChainId: BigInt((9001).toString()),
          feePayer: sender.accountAddress,
          feePayerSig: fromEthSignature({
            v: sigSplit.v,
            r: sigSplit.r,
            s: sigSplit.s
          })
        })
      ).finish()
    }
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx.legacyAmino.body.extensionOptions = [extension] as any
    const body = TxBody.fromPartial(tx.legacyAmino.body)
    const txRaw = createTxRawEthermintEIP712(body, tx.legacyAmino.authInfo)

    /**
     * the below string can directly be submitted/broadcasted to the chain:
     */
    return Buffer.from(txRaw as Uint8Array).toString('base64')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signArbitrary(
    _chainId: string,
    _signer: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _data: any,
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    _signOptions = {}
  ) {
    // just here for wallet method consistency
  }

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  signDirect(
    _chainId: string,
    _signer: string,
    _signDoc: SignDoc,
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    _signOptions = {}
  ) {
    // just here for wallet method consistency
  }
  //   experimentalSuggestChain(chainInfo) {},
}

export function pubKeyToEvmAddress(decompressedPubKey: Uint8Array): string {
  const address = pubToAddress(Buffer.from(decompressedPubKey), true)
  return `0x${address.toString('hex')}`
}
