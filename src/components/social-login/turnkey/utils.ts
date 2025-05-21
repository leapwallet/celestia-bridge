import { AminoMsg } from '@cosmjs/amino'
import { EncodeObject } from '@cosmjs/proto-signing'

import BigNumber from 'bignumber.js'
import { fromRpcSig, ecrecover } from 'ethereumjs-util'
import { publicKeyConvert } from 'secp256k1'
import { TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util'
import { getEip712TypedDataV2 } from './eip712/eip712'
import { Address as EthAddress } from 'ethereumjs-util'
import { bech32 } from 'bech32'
import { SignMode } from '@injectivelabs/core-proto-ts/cjs/cosmos/tx/signing/v1beta1/signing'
import { PubKey } from '@injectivelabs/core-proto-ts/esm/cosmos/crypto/secp256k1/keys'
import { Any } from '@injectivelabs/core-proto-ts/cjs/google/protobuf/any'
import { Coin } from '@injectivelabs/core-proto-ts/esm/cosmos/base/v1beta1/coin'
import { ExtensionOptionsWeb3Tx } from './injective/types/v1beta1/tx'
import { MsgExecute } from '@initia/initia.proto/initia/move/v1/tx'
import { MsgInitiateTokenDeposit } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx'
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import {
  TxRaw,
  TxBody,
  AuthInfo,
  Fee,
  SignerInfo,
  ModeInfo,
  ModeInfo_Single
} from '@injectivelabs/core-proto-ts/esm/cosmos/tx/v1beta1/tx'
import {
  Msg,
  MsgDepositForBurn,
  MsgDepositForBurnWithCaller
} from '@leapwallet/elements-core'

export const isNumber = (number: string | number) => {
  if (typeof number === 'number') {
    return true
  }

  return !isNaN(parseFloat(number))
}

const encodeMessage = (msg: Msg) => {
  switch (msg.typeUrl) {
    case '/cosmwasm.wasm.v1.MsgExecuteContract':
      return MsgExecuteContract.encode(msg.value).finish()
    case '/circle.cctp.v1.MsgDepositForBurn':
      return MsgDepositForBurn.encode(msg.value).finish()
    case '/circle.cctp.v1.MsgDepositForBurnWithCaller':
      return MsgDepositForBurnWithCaller.encode(msg.value).finish()
    case '/initia.move.v1.MsgExecute':
      return MsgExecute.encode(msg.value).finish()
    case '/opinit.ophost.v1.MsgInitiateTokenDeposit':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return MsgInitiateTokenDeposit.encode(msg.value as any).finish()
    case '/ibc.applications.transfer.v1.MsgTransfer':
      return MsgTransfer.encode(msg.value).finish()
    case '/cosmos.bank.v1beta1.MsgSend':
      return MsgSend.encode(msg.value).finish()
  }
}

export const getEthermintChainEVMChainId = (
  cosmosChainId: string | undefined
): number => {
  switch (cosmosChainId) {
    case 'injective-1':
      return 2525
    case 'evmos_9001-2':
      return 9001
    default:
      throw new Error('Unsupported chain')
  }
}

export const createBody = ({
  messages,
  memo = '',
  timeoutHeight
}: {
  messages: Msg[]
  memo?: string
  timeoutHeight?: number
}) => {
  const txBody = TxBody.create()

  txBody.messages = messages.map((message) => ({
    typeUrl: message.typeUrl,
    value: encodeMessage(message)
  }))

  txBody.memo = memo

  if (timeoutHeight) {
    txBody.timeoutHeight = timeoutHeight.toString()
  }

  return txBody
}

export const fetchBlockHeight = async (rpcUrl: string): Promise<number> => {
  try {
    const response = await fetch(`${rpcUrl}/block`)
    if (!response.ok) {
      throw new Error('Failed to fetch block height')
    }
    const data = await response.json()
    return parseInt(data.result.block.header.height, 10)
  } catch (error) {
    console.error('Error fetching block height:', error)
    throw error
  }
}

export const numberToCosmosSdkDecString = (value: BigNumber.Value): string => {
  return new BigNumber(value).toFixed(18)
}

export const snakeToPascal = (str: string): string => {
  return str
    .split('/')
    .map((snake) =>
      snake
        .split('_')
        .map((substr) => substr.charAt(0).toUpperCase() + substr.slice(1))
        .join('')
    )
    .join('/')
}

export const hexToBuff = (hex: string) => {
  return Buffer.from(hex.startsWith('0x') ? hex.slice(2) : hex, 'hex')
}

export const hexToBase64 = (hex: string) => {
  return Buffer.from(hex.startsWith('0x') ? hex.slice(2) : hex, 'hex').toString(
    'base64'
  )
}

export const recoverTypedSignaturePubKey = (
  data: ReturnType<typeof getEip712TypedDataV2>,
  signature: string
): `0x${string}` => {
  const compressedPubKeyPrefix = Buffer.from('04', 'hex')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const message = TypedDataUtils.eip712Hash(data, SignTypedDataVersion.V4)
  const sigParams = fromRpcSig(signature)
  const publicKey = ecrecover(message, sigParams.v, sigParams.r, sigParams.s)
  const prefixedKey = Buffer.concat([compressedPubKeyPrefix, publicKey])
  const compressedKey = Buffer.from(publicKeyConvert(prefixedKey))

  return `0x${compressedKey.toString('hex')}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isSet(value: any): boolean {
  return value !== null && value !== undefined
}

export enum MsgTypes {
  GRANT = '/cosmos.authz.v1beta1.MsgGrant',
  REVOKE = '/cosmos.authz.v1beta1.MsgRevoke',
  SEND = '/cosmos.bank.v1beta1.MsgSend',
  IBCTRANSFER = '/ibc.applications.transfer.v1.MsgTransfer',
  GOV = '/cosmos.gov.v1beta1.MsgVote',
  DELEGATE = '/cosmos.staking.v1beta1.MsgDelegate',
  UNDELEGATE = '/cosmos.staking.v1beta1.MsgUndelegate',
  REDELEGATE = '/cosmos.staking.v1beta1.MsgBeginRedelegate',
  WITHDRAW_REWARD = '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
  MSG_EXECUTE_CONTRACT = '/cosmwasm.wasm.v1.MsgExecuteContract'
}

export enum MsgTypesAmino {
  GRANT = 'cosmos-sdk/MsgGrant',
  REVOKE = 'cosmos-sdk/MsgRevoke',
  SEND = 'cosmos-sdk/MsgSend',
  IBCTRANSFER = 'cosmos-sdk/MsgTransfer',
  GOV = 'cosmos-sdk/MsgVote',
  DELEGATE = 'cosmos-sdk/MsgDelegate',
  UNDELEGATE = 'cosmos-sdk/MsgUndelegate',
  REDELEGATE = 'cosmos-sdk/MsgBeginRedelegate',
  WITHDRAW_REWARD = 'cosmos-sdk/MsgWithdrawDelegationReward',
  MSG_EXECUTE_CONTRACT = 'wasm/MsgExecuteContract',
  MSG_EXECUTE_CONTRACT_COMPAT = 'wasmx/MsgExecuteContractCompat'
}

export const formatIbcMessage = (msg: EncodeObject | AminoMsg) => {
  return {
    ...msg.value,
    sender: msg.value.sender,
    receiver: msg.value.receiver,
    memo: msg.value.memo,
    amount: {
      denom: msg.value.token.denom,
      amount: msg.value.token.amount
    },
    port: msg.value.sourcePort,
    channelId: msg.value.sourceChannel,
    timeout: '8446744073709551615',
    height: {
      revisionHeight: msg?.value?.height?.revisionHeight
        ? parseInt(msg.value.height.revisionHeight)
        : 0,
      revisionNumber: msg?.value?.height?.revisionNumber
        ? parseInt(msg.value.height.revisionNumber)
        : 0
    }
  }
}

export const MSG_TYPES = {
  MSG_SEND: 'cosmos-sdk/MsgSend',
  MSG_VOTE: 'cosmos-sdk/MsgVote',
  MSG_DELEGATE: 'cosmos-sdk/MsgDelegate',
  MSG_IBC_TRANSFER: 'cosmos-sdk/MsgTransfer',
  MSG_IBC_TRANSFER_PROTO: '/ibc.applications.transfer.v1.MsgTransfer',
  MSG_EXECUTE_CONTRACT: '/cosmwasm.wasm.v1.MsgExecuteContract',
  MSG_DEPOSIT_FOR_BURN: '/circle.cctp.v1.MsgDepositForBurn',
  MSG_DEPOSIT_FOR_BURN_WITH_CALLER:
    '/circle.cctp.v1.MsgDepositForBurnWithCaller',
  MSG_EXECUTE: '/initia.move.v1.MsgExecute',
  MSG_INITIATE_TOKEN_DEPOSIT: '/opinit.ophost.v1.MsgInitiateTokenDeposit'
}

export function generateTypes(msgValues: object) {
  // Define base types first
  const types = {
    // Primary type must be defined first
    Tx: [
      { name: 'account_number', type: 'string' },
      { name: 'chain_id', type: 'string' },
      { name: 'fee', type: 'Fee' },
      { name: 'memo', type: 'string' },
      { name: 'msgs', type: 'Msg[]' },
      { name: 'sequence', type: 'string' }
    ],
    Fee: [
      { name: 'amount', type: 'Coin[]' },
      { name: 'gas', type: 'string' }
    ],
    Coin: [
      { name: 'denom', type: 'string' },
      { name: 'amount', type: 'string' }
    ],
    Msg: [
      { name: 'type', type: 'string' },
      { name: 'value', type: 'MsgValue' }
    ]
  }
  return { ...types, ...msgValues }
}

export const MSG_SEND_TYPES = {
  MsgValue: [
    { name: 'from_address', type: 'string' },
    { name: 'to_address', type: 'string' },
    { name: 'amount', type: 'TypeAmount[]' }
  ],
  TypeAmount: [
    { name: 'denom', type: 'string' },
    { name: 'amount', type: 'string' }
  ]
}

export const MSG_VOTE_TYPES = {
  MsgValue: [
    { name: 'proposal_id', type: 'uint64' },
    { name: 'voter', type: 'string' },
    { name: 'option', type: 'int32' }
  ]
}

export const MSG_IBC_TRANSFER_TYPES = {
  MsgValue: [
    { name: 'source_port', type: 'string' },
    { name: 'source_channel', type: 'string' },
    { name: 'token', type: 'TypeAmount' },
    { name: 'sender', type: 'string' },
    { name: 'receiver', type: 'string' },
    { name: 'timeout_height', type: 'Height' },
    { name: 'timeout_timestamp', type: 'string' },
    { name: 'memo', type: 'string' }
  ],
  TypeAmount: [
    { name: 'denom', type: 'string' },
    { name: 'amount', type: 'string' }
  ],
  Height: [
    { name: 'revision_number', type: 'string' },
    { name: 'revision_height', type: 'string' }
  ]
}

export const MSG_EXECUTE_CONTRACT_TYPES = {
  MsgValue: [
    { name: 'sender', type: 'string' },
    { name: 'contract', type: 'string' },
    { name: 'msg', type: 'string' },
    { name: 'funds', type: 'TypeAmount[]' }
  ],
  TypeAmount: [
    { name: 'denom', type: 'string' },
    { name: 'amount', type: 'string' }
  ]
}

export const MSG_DEPOSIT_FOR_BURN_TYPES = {
  MsgValue: [
    { name: 'from', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'destination_domain', type: 'uint32' },
    { name: 'mint_recipient', type: 'bytes' },
    { name: 'burn_token', type: 'string' }
  ]
}

export const MSG_DEPOSIT_FOR_BURN_WITH_CALLER_TYPES = {
  MsgValue: [
    { name: 'from', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'destination_domain', type: 'uint32' },
    { name: 'mint_recipient', type: 'bytes' },
    { name: 'burn_token', type: 'string' },
    { name: 'destination_caller', type: 'bytes' }
  ]
}

export const MSG_EXECUTE_TYPES = {
  MsgValue: [
    { name: 'sender', type: 'string' },
    { name: 'module_address', type: 'string' },
    { name: 'module_name', type: 'string' },
    { name: 'function_name', type: 'string' },
    { name: 'args', type: 'string[]' }
  ]
}

export const MSG_INITIATE_TOKEN_DEPOSIT_TYPES = {
  MsgValue: [
    { name: 'sender', type: 'string' },
    { name: 'to', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'bridge_id', type: 'string' }
  ]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function eip712MessageType(msg: any) {
  switch (msg.type) {
    case MSG_TYPES.MSG_SEND:
      return generateTypes(MSG_SEND_TYPES)
    case MSG_TYPES.MSG_VOTE:
      return generateTypes(MSG_VOTE_TYPES)
    case MSG_TYPES.MSG_DELEGATE:
      return generateTypes(MSG_DELEGATE_TYPES)
    case MSG_TYPES.MSG_IBC_TRANSFER:
    case MSG_TYPES.MSG_IBC_TRANSFER_PROTO:
      return generateTypes(MSG_IBC_TRANSFER_TYPES)
    case MSG_TYPES.MSG_EXECUTE_CONTRACT:
      return generateTypes(MSG_EXECUTE_CONTRACT_TYPES)
    case MSG_TYPES.MSG_DEPOSIT_FOR_BURN:
      return generateTypes(MSG_DEPOSIT_FOR_BURN_TYPES)
    case MSG_TYPES.MSG_DEPOSIT_FOR_BURN_WITH_CALLER:
      return generateTypes(MSG_DEPOSIT_FOR_BURN_WITH_CALLER_TYPES)
    case MSG_TYPES.MSG_EXECUTE:
      return generateTypes(MSG_EXECUTE_TYPES)
    case MSG_TYPES.MSG_INITIATE_TOKEN_DEPOSIT:
      return generateTypes(MSG_INITIATE_TOKEN_DEPOSIT_TYPES)
  }

  // If no match found and typeUrl exists, try to match against typeUrl
  if (msg.typeUrl) {
    switch (msg.typeUrl) {
      case MSG_TYPES.MSG_IBC_TRANSFER_PROTO:
        return generateTypes(MSG_IBC_TRANSFER_TYPES)
      case '/cosmos.bank.v1beta1.MsgSend':
        return generateTypes(MSG_SEND_TYPES)
      case MSG_TYPES.MSG_EXECUTE_CONTRACT:
        return generateTypes(MSG_EXECUTE_CONTRACT_TYPES)
      case MSG_TYPES.MSG_DEPOSIT_FOR_BURN:
        return generateTypes(MSG_DEPOSIT_FOR_BURN_TYPES)
      case MSG_TYPES.MSG_DEPOSIT_FOR_BURN_WITH_CALLER:
        return generateTypes(MSG_DEPOSIT_FOR_BURN_WITH_CALLER_TYPES)
      case MSG_TYPES.MSG_EXECUTE:
        return generateTypes(MSG_EXECUTE_TYPES)
      case MSG_TYPES.MSG_INITIATE_TOKEN_DEPOSIT:
        return generateTypes(MSG_INITIATE_TOKEN_DEPOSIT_TYPES)
    }
  }

  throw new Error(
    `Unsupported message type in SignDoc: ${
      msg.type || msg.typeUrl || 'unknown'
    }`
  )
}

export const MSG_DELEGATE_TYPES = {
  MsgValue: [
    { name: 'delegator_address', type: 'string' },
    { name: 'validator_address', type: 'string' },
    { name: 'amount', type: 'TypeAmount' }
  ],
  TypeAmount: [
    { name: 'denom', type: 'string' },
    { name: 'amount', type: 'string' }
  ]
}

export function createEIP712(types: object, chainId: string, message: object) {
  // Convert chainId to a numeric value, defaulting to 1 if invalid
  const numericChainId = parseInt(chainId.split('-')[1] || '1', 10)

  return {
    types,
    primaryType: 'Tx',
    domain: {
      name: 'Injective Protocol',
      version: '1.0.0',
      chainId: numericChainId,
      verifyingContract: '0x0000000000000000000000000000000000000000',
      salt: '0'
    },
    message
  }
}

export const toUint8Array = (str: string) =>
  new Uint8Array(
    atob(str)
      .split('')
      .map((char) => char.charCodeAt(0))
  )

export const getCosmosAddress = (
  ethAddress: string,
  addressPrefix: string
): string => {
  const addressBuffer = EthAddress.fromString(ethAddress.toString()).toBuffer()

  return bech32.encode(addressPrefix, bech32.toWords(addressBuffer))
}

export const createSigners = ({
  chainId,
  mode,
  signers
}: {
  chainId: string
  signers: { pubKey: string; sequence: number }[]
  mode: SignMode
}) => {
  return signers.map((s) =>
    createSignerInfo({
      mode,
      chainId,
      publicKey: s.pubKey,
      sequence: s.sequence
    })
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createAny = (value: any, type: string) => {
  const message = Any.fromPartial({
    typeUrl: type,
    value: value
  })

  return message
}

export const getPublicKey = ({
  chainId,
  key
}: {
  chainId: string
  key: string | Any
}) => {
  if (typeof key !== 'string') {
    return key
  }

  let proto
  let path
  let baseProto

  if (chainId.startsWith('injective')) {
    proto = PubKey.create()
    baseProto = PubKey
    path = '/injective.crypto.v1beta1.ethsecp256k1.PubKey'
  } else if (chainId.startsWith('evmos')) {
    proto = PubKey.create()
    baseProto = PubKey
    path = '/ethermint.crypto.v1.ethsecp256k1.PubKey'
  } else {
    proto = PubKey.create()
    baseProto = PubKey
    path = '/cosmos.crypto.secp256k1.PubKey'
  }

  proto.key = Buffer.from(key, 'base64')

  return createAny(baseProto.encode(proto).finish(), path)
}

export const createSignerInfo = ({
  chainId,
  publicKey,
  sequence,
  mode
}: {
  chainId: string
  publicKey: string | Any
  sequence: number
  mode: SignMode
}) => {
  const pubKey = getPublicKey({ chainId, key: publicKey })

  const single = ModeInfo_Single.create()
  single.mode = mode

  const modeInfo = ModeInfo.create()
  modeInfo.single = single

  const signerInfo = SignerInfo.create()
  signerInfo.publicKey = pubKey
  signerInfo.sequence = sequence.toString()
  signerInfo.modeInfo = modeInfo

  return signerInfo
}

export const createFee = ({
  fee,
  payer,
  granter,
  gasLimit
}: {
  fee: { amount: string; denom: string }
  payer?: string
  granter?: string
  gasLimit: number
}) => {
  const feeAmount = Coin.create()
  feeAmount.amount = fee.amount
  feeAmount.denom = fee.denom

  const feeProto = Fee.create()
  feeProto.gasLimit = gasLimit.toString()
  feeProto.amount = [feeAmount]

  if (payer) {
    feeProto.payer = payer
  }

  if (granter) {
    feeProto.granter = granter
  }

  return feeProto
}

export const createAuthInfo = ({
  signerInfo,
  fee
}: {
  signerInfo: SignerInfo[]
  fee: Fee
}) => {
  const authInfo = AuthInfo.create()
  authInfo.signerInfos = signerInfo
  authInfo.fee = fee

  return authInfo
}

export const createWeb3Extension = ({
  ethereumChainId,
  feePayer,
  feePayerSig
}: {
  ethereumChainId: string
  feePayer?: string
  feePayerSig?: Uint8Array
}) => {
  const web3Extension = ExtensionOptionsWeb3Tx.create(null)
  web3Extension.typedDataChainID = ethereumChainId

  if (feePayer) {
    web3Extension.feePayer = feePayer
  }

  if (feePayerSig) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    web3Extension.feePayerSig = feePayerSig as any
  }

  return web3Extension
}

/**
 * @description: this is only used for injective eip712 txs
 */
export const createTxRawEIP712 = (
  txRaw: TxRaw,
  extension: ExtensionOptionsWeb3Tx
) => {
  const body = TxBody.decode(txRaw.bodyBytes)
  const extensionAny = createAny(
    ExtensionOptionsWeb3Tx.encode(extension).finish(),
    '/injective.types.v1beta1.ExtensionOptionsWeb3Tx'
  )

  body.extensionOptions = [extensionAny]

  txRaw.bodyBytes = TxBody.encode(body).finish()

  return txRaw
}

/**
 * @description: this is only used for other ethermint chains (cointype 60)
 */
export function createTxRawEthermintEIP712(body: TxBody, authInfo: AuthInfo) {
  return TxRaw.encode(
    TxRaw.fromPartial({
      bodyBytes: TxBody.encode(body).finish(),
      authInfoBytes: AuthInfo.encode(authInfo).finish(),
      signatures: [new Uint8Array(0)]
    })
  ).finish()
}

export function fromHex(hexstring: string): Uint8Array {
  if (!hexstring.match(/^[0-9a-f]{2}(?:[0-9a-f]{2})*$/i)) {
    throw new Error(
      'hex string contains invalid characters or is not a multiple of 2'
    )
  }

  const out = new Uint8Array(hexstring.length / 2)
  for (let i = 0; i < out.length; i++) {
    const hexByteAsString = hexstring.slice(2 * i, 2 * (i + 1))
    out[i] = parseInt(hexByteAsString, 16)
  }
  return out
}
