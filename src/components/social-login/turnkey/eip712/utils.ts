import { Eip712ConvertFeeArgs } from './types'

export const getDefaultEip712Types = () => {
  return {
    types: {
      EIP712Domain: [
        {
          name: 'name',
          type: 'string'
        },
        {
          name: 'version',
          type: 'string'
        },
        {
          name: 'chainId',
          type: 'uint256'
        },
        {
          name: 'verifyingContract',
          type: 'address'
        },
        {
          name: 'salt',
          type: 'string'
        },
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' }
      ],
      Tx: [
        { name: 'context', type: 'string' },
        { name: 'msgs', type: 'string' }
      ]
    }
  }
}

export const getTypesIncludingFeePayer = ({
  fee,
  types
}: {
  fee?: Eip712ConvertFeeArgs
  types: ReturnType<typeof getDefaultEip712Types>
}) => {
  if (!fee) {
    return types
  }

  if (!fee.feePayer) {
    return types
  }

  return types
}

export const getDefaultEip712TypesV2 = () => {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
        { name: 'salt', type: 'string' }
      ],
      Tx: [
        { name: 'context', type: 'string' },
        { name: 'msgs', type: 'string' }
      ]
    }
  }
}
