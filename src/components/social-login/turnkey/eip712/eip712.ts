import { Msg, MsgValue } from '@leapwallet/elements-core'
import { SnakeCaseKeys, default as snakeCaseKeys } from 'snakecase-keys'
import { BigNumber } from 'bignumber.js'
import {
  Eip712ConvertFeeArgs,
  Eip712ConvertTxArgs,
  TypedDataField
} from './types'
import { getDefaultEip712TypesV2 } from './utils'
import { mapValuesToProperValueType, objectKeysToEip712Types } from './maps'

export const toAmino = (
  msg: Msg
): { type: string; value: SnakeCaseKeys<MsgValue> } => {
  switch (msg.typeUrl) {
    case '/cosmos.bank.v1beta1.MsgSend': {
      return {
        type: 'cosmos-sdk/MsgSend',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: snakeCaseKeys(msg.value as any)
      }
    }
    case '/ibc.applications.transfer.v1.MsgTransfer': {
      return {
        type: 'ibc/MsgTransfer',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: snakeCaseKeys(msg.value as any)
      }
    }
    case '/cosmwasm.wasm.v1.MsgExecuteContract': {
      return {
        type: 'cosmwasm/MsgExecuteContract',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: snakeCaseKeys(msg.value as any)
      }
    }
    case '/circle.cctp.v1.MsgDepositForBurn': {
      return {
        type: 'cosmos-sdk/MsgDepositForBurn',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: snakeCaseKeys(msg.value as any)
      }
    }
    case '/circle.cctp.v1.MsgDepositForBurnWithCaller': {
      return {
        type: 'cosmos-sdk/MsgDepositForBurnWithCaller',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: snakeCaseKeys(msg.value as any)
      }
    }
    case '/initia.move.v1.MsgExecute': {
      return {
        type: 'move/MsgExecute',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: snakeCaseKeys(msg.value as any)
      }
    }
    case '/opinit.ophost.v1.MsgInitiateTokenDeposit': {
      return {
        type: 'ophost/MsgInitiateTokenDeposit',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: snakeCaseKeys(msg.value as any)
      }
    }
  }
}

export const toEip712 = (
  msg: Msg
): {
  type: string
  value: Record<string, unknown>
} => {
  const amino = toAmino(msg)
  const { type, value } = amino

  return {
    type,
    value: mapValuesToProperValueType(value, type)
  }
}

export const toWeb3 = (msg: Msg) => {
  const { value } = toAmino(msg)

  return {
    '@type': msg.typeUrl,
    ...value
  }
}

export const toEip712Types = (msg: Msg): Map<string, TypedDataField[]> => {
  const amino = toAmino(msg)
  return objectKeysToEip712Types({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object: amino.value as Record<string, any>,
    messageType: amino.type
  })
}

export const getEip712FeeV2 = (
  params: Eip712ConvertFeeArgs
): {
  fee: {
    amount: { denom: string; amount: string }[]
    gas: number
    payer?: string
  }
} => {
  const { amount, gas, payer } = {
    amount: [
      {
        denom: params.amount[0].denom,
        amount: params.amount[0].amount
      }
    ],
    gas: Number(params.gas),
    payer: params.feePayer
  }

  return {
    fee: {
      amount,
      gas,
      payer: payer
    }
  }
}

export const getEipTxContext = ({
  accountNumber,
  sequence,
  fee,
  timeoutHeight,
  chainId,
  memo
}: Eip712ConvertTxArgs & { fee: Eip712ConvertFeeArgs }): {
  account_number: number
  chain_id: string
  sequence: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fee: Record<string, any>
  timeout_height: number
  memo: string
} => {
  return {
    account_number: Number(accountNumber),
    chain_id: chainId,
    ...getEip712FeeV2(fee),
    memo: memo || '',
    sequence: Number(sequence),
    timeout_height: Number(timeoutHeight)
  }
}

export const getEip712TypedDataV2 = ({
  msgs,
  tx,
  fee,
  ethereumChainId
}: {
  msgs: Msg | Msg[]
  tx: Eip712ConvertTxArgs
  fee: Eip712ConvertFeeArgs
  ethereumChainId: string
}) => {
  const messages = Array.isArray(msgs) ? msgs : [msgs]
  const web3Msgs = messages.map(toWeb3)
  console.log('web3Msgs', web3Msgs)
  const { types } = getDefaultEip712TypesV2()

  return {
    domain: {
      name: 'Injective Web3',
      version: '1.0.0',
      chainId: '0x' + new BigNumber(ethereumChainId).toString(16),
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      salt: '0'
    },
    primaryType: 'Tx' as const,
    types: types,
    message: {
      context: JSON.stringify(
        getEipTxContext({
          accountNumber: tx.accountNumber,
          chainId: tx.chainId,
          timeoutHeight: tx.timeoutHeight,
          memo: tx.memo ?? '',
          sequence: tx.sequence,
          fee
        })
      ),
      msgs: (() => {
        const jsonString = JSON.stringify(web3Msgs, (_key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
        return jsonString
      })()
    }
  }
}

/**
 * The following are for ethermint chains:
 */

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
      salt: '0'
    },
    message
  }
}
