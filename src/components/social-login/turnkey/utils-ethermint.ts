import { SignMode } from '@injectivelabs/core-proto-ts/cjs/cosmos/tx/signing/v1beta1/signing'
import { PubKey } from '@injectivelabs/core-proto-ts/esm/cosmos/crypto/secp256k1/keys'
import { Coin } from '@injectivelabs/core-proto-ts/esm/cosmos/base/v1beta1/coin'
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx'
import { keccak256 } from 'ethereumjs-util'

import {
  TxBody,
  AuthInfo,
  Fee,
  SignDoc
} from '@injectivelabs/core-proto-ts/esm/cosmos/tx/v1beta1/tx'

/**
 * the following are for ethermint chains:
 */

export function fromEthSignature(signature: {
  v: number | string
  r: string
  s: string
}): Uint8Array {
  const r = Buffer.from(signature.r.replace('0x', ''), 'hex')
  const s = Buffer.from(signature.s.replace('0x', ''), 'hex')

  if (r.length !== 32 || s.length !== 32) {
    throw new Error('Invalid Signature')
  }

  const v =
    typeof signature.v === 'string' ? parseInt(signature.v, 16) : signature.v

  if (!Number.isInteger(v) || v < 27) {
    throw new Error('Invalid Signature')
  }

  const vBuffer = Buffer.from([v % 256])

  const formattedSignature = Buffer.concat([r, s, vBuffer])
  if (formattedSignature.length !== 65) {
    throw new Error('Formatted signature has an invalid length')
  }

  return formattedSignature
}

export function generateFee(amount: Coin[], gas: string, feePayer: string) {
  return {
    amount: amount,
    gas,
    feePayer
  }
}

export function generateTypes(msgValues: object) {
  const types = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'string' },
      { name: 'salt', type: 'string' }
    ],
    Tx: [
      { name: 'account_number', type: 'string' },
      { name: 'chain_id', type: 'string' },
      { name: 'fee', type: 'Fee' },
      { name: 'memo', type: 'string' },
      { name: 'msgs', type: 'Msg[]' },
      { name: 'sequence', type: 'string' }
    ],
    Fee: [
      { name: 'feePayer', type: 'string' },
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
  Object.assign(types, msgValues)
  return types
}

export function createAuthInfo(
  signerInfo: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publicKey: any
    modeInfo: { single: { mode: number } }
    sequence: number
  },
  fee: Fee
) {
  return AuthInfo.fromPartial({
    signerInfos: [
      {
        publicKey: signerInfo.publicKey,
        modeInfo: signerInfo.modeInfo,
        sequence: signerInfo.sequence.toString()
      }
    ],
    fee: {
      amount: fee.amount.map((coin) => {
        return {
          denom: coin.denom,
          amount: coin.amount.toString()
        }
      }),
      gasLimit: fee.gasLimit.toString(),
      payer: fee.payer
    }
  })
}

export function createSignerInfo(
  algo: string,
  publicKey: Uint8Array,
  sequence: number,
  mode: number
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pubkey: any

  if (algo === 'secp256k1') {
    pubkey = {
      value: PubKey.encode({
        key: publicKey
      }).finish(),
      typeUrl: '/cosmos.crypto.secp256k1.PubKey'
    }
  } else {
    pubkey = {
      value: PubKey.encode({
        key: publicKey
      }).finish(),
      typeUrl: '/ethermint.crypto.v1.ethsecp256k1.PubKey'
    }
  }

  const signerInfo = {
    publicKey: pubkey,
    modeInfo: {
      single: {
        mode
      }
    },
    sequence
  }

  return signerInfo
}

export function generateIbcMsgTransferTypes(msg: { memo?: string }) {
  const types = {
    MsgValue: [
      { name: 'source_port', type: 'string' },
      { name: 'source_channel', type: 'string' },
      { name: 'token', type: 'TypeToken' },
      { name: 'sender', type: 'string' },
      { name: 'receiver', type: 'string' },
      { name: 'timeout_height', type: 'TypeTimeoutHeight' },
      { name: 'timeout_timestamp', type: 'uint64' }
    ],
    TypeToken: [
      { name: 'denom', type: 'string' },
      { name: 'amount', type: 'string' }
    ],
    TypeTimeoutHeight: [
      { name: 'revision_number', type: 'uint64' },
      { name: 'revision_height', type: 'uint64' }
    ]
  }
  if (msg.memo) {
    types.MsgValue.push({ name: 'memo', type: 'string' })
  }
  return types
}

export function createIBCMsgTransfer(
  receiver: string,
  sender: string,
  sourceChannel: string,
  sourcePort: string,
  revisionHeight: number,
  revisionNumber: number,
  timeoutTimestamp: string,
  amount: string,
  denom: string,
  memo?: string
) {
  const msg = {
    type: 'cosmos-sdk/MsgTransfer',
    value: {
      receiver,
      sender,
      source_channel: sourceChannel,
      source_port: sourcePort,
      timeout_height: {
        revision_height: revisionHeight.toString(),
        revision_number: revisionNumber.toString()
      },
      timeout_timestamp: timeoutTimestamp,
      token: {
        amount,
        denom
      },
      memo
    }
  }
  if (!memo) {
    delete msg.value.memo
  }
  return msg
}

export function generateTx(
  accountNumber: string,
  sequence: string,
  chainCosmosId: string,
  memo: string,
  fee: object,
  msgs: object[]
) {
  return {
    account_number: accountNumber,
    chain_id: chainCosmosId,
    fee,
    memo,
    msgs,
    sequence
  }
}

export function createEIP712Tx(
  types: object,
  chainId: number,
  message: object
) {
  return {
    types,
    primaryType: 'Tx',
    domain: {
      name: 'Cosmos Web3',
      version: '1.0.0',
      chainId,
      verifyingContract: 'cosmos',
      salt: '0x0000000000000000000000000000000000000000' //'0'
    },
    message
  }
}

export function createProtoIBCMsgTransfer(
  sourcePort: string,
  sourceChannel: string,
  amount: string,
  denom: string,
  sender: string,
  receiver: string,
  revisionNumber: number,
  revisionHeight: number,
  timeoutTimestamp: string,
  memo: string
) {
  const token = Coin.fromPartial({
    denom,
    amount
  })

  const ibcMessage = {
    sourcePort: sourcePort,
    sourceChannel: sourceChannel,
    token,
    sender,
    receiver,
    timeoutHeight: {
      revisionNumber: BigInt(revisionNumber.toString()),
      revisionHeight: BigInt(revisionHeight.toString())
    },
    timeoutTimestamp: BigInt(timeoutTimestamp),
    memo
  }

  return {
    value: MsgTransfer.encode(MsgTransfer.fromPartial(ibcMessage)).finish(),
    typeUrl: '/ibc.applications.transfer.v1.MsgTransfer'
  }
}

export function createTransactionWithMultipleMessages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any,
  memo: string,
  fee: Fee,
  gasLimit: string,
  algo: string,
  pubKey: string,
  sequence: number,
  accountNumber: number,
  chainId: string
) {
  const body = {
    messages: messages,
    memo,
    extensionOptions: []
  }

  const feeMessage = Fee.fromPartial({
    amount: fee.amount,
    gasLimit: gasLimit,
    payer: fee.payer
  })
  const pubKeyDecoded = Buffer.from(pubKey, 'base64')

  // AMINO
  const signInfoAmino = createSignerInfo(
    algo,
    pubKeyDecoded,
    sequence,
    SignMode.SIGN_MODE_LEGACY_AMINO_JSON
  )

  const authInfoAmino = createAuthInfo(signInfoAmino, feeMessage)

  // SignDirect
  const signInfoDirect = createSignerInfo(
    algo,
    pubKeyDecoded,
    sequence,
    SignMode.SIGN_MODE_DIRECT
  )

  const authInfoDirect = createAuthInfo(signInfoDirect, feeMessage)

  return {
    legacyAmino: {
      body,
      authInfo: authInfoAmino,
      accountNumber,
      chainId
    },
    signDirect: {
      body,
      authInfo: authInfoDirect,
      accountNumber,
      chainId
    }
  }
}

export function createTxIBCMsgTransfer(
  chain: {
    chainId: number
    cosmosChainId: string
  },
  sender: {
    accountAddress: string
    sequence: number
    accountNumber: number
    pubkey: string
  },
  fee: Fee,
  memo: string,
  params: {
    sourcePort: string
    sourceChannel: string
    amount: string
    denom: string
    receiver: string
    revisionNumber: number
    revisionHeight: number
    timeoutTimestamp: string
    memo: string
  }
) {
  const feeObject = generateFee(
    fee.amount,
    fee.gasLimit.toString(),
    sender.accountAddress
  )

  const msg = createIBCMsgTransfer(
    params.receiver,
    sender.accountAddress,
    params.sourceChannel,
    params.sourcePort,
    params.revisionHeight,
    params.revisionNumber,
    params.timeoutTimestamp,
    params.amount,
    params.denom,
    params.memo
  )

  console.log('msg ------', msg)
  const eip712Types = generateTypes(generateIbcMsgTransferTypes(msg.value))

  const messages = generateTx(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    [msg]
  )
  const eipToSign = createEIP712Tx(eip712Types, chain.chainId, messages)
  const msgCosmos = createProtoIBCMsgTransfer(
    params.sourcePort,
    params.sourceChannel,
    params.amount,
    params.denom,
    sender.accountAddress,
    params.receiver,
    params.revisionNumber,
    params.revisionHeight,
    params.timeoutTimestamp,
    params.memo
  )

  const tx = createTransactionWithMultipleMessages(
    [msgCosmos],
    memo,
    fee,
    fee.gasLimit.toString(),
    'ethsecp256',
    sender.pubkey,
    sender.sequence,
    sender.accountNumber,
    chain.cosmosChainId
  )

  const signDirectDoc = SignDoc.encode(
    SignDoc.fromPartial({
      bodyBytes: TxBody.encode(TxBody.fromPartial(tx.signDirect.body)).finish(),
      authInfoBytes: AuthInfo.encode(tx.signDirect.authInfo).finish(),
      accountNumber: sender.accountNumber.toString(),
      chainId: chain.cosmosChainId
    })
  ).finish()

  const signBytes = keccak256(Buffer.from(signDirectDoc))

  return {
    signDirect: {
      authInfo: {
        ...tx.signDirect.authInfo,
        serializeBinary: () => AuthInfo.encode(tx.signDirect.authInfo).finish()
      },
      body: {
        ...tx.signDirect.body,
        serializeBinary: () =>
          TxBody.encode(TxBody.fromPartial(tx.signDirect.body)).finish()
      },
      signBytes
    },
    legacyAmino: tx.legacyAmino,
    eipToSign
  }
}
