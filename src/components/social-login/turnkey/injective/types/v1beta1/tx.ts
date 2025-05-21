/* eslint-disable */
import Long from 'long'
import _m0 from 'protobufjs/minimal'
function createBaseExtensionOptionsWeb3Tx() {
  return { typedDataChainID: '0', feePayer: '', feePayerSig: new Uint8Array(0) }
}
export interface ExtensionOptionsWeb3Tx {
  /**
   * typedDataChainID used only in EIP712 Domain and should match
   * Ethereum network ID in a Web3 provider (e.g. Metamask).
   */
  typedDataChainID: string
  /**
   * feePayer is an account address for the fee payer. It will be validated
   * during EIP712 signature checking.
   */
  feePayer: string
  /**
   * feePayerSig is a signature data from the fee paying account,
   * allows to perform fee delegation when using EIP712 Domain.
   */
  feePayerSig: Uint8Array
}
export const ExtensionOptionsWeb3Tx = {
  encode(message: ExtensionOptionsWeb3Tx, writer = _m0.Writer.create()) {
    if (message.typedDataChainID !== '0') {
      writer.uint32(8).uint64(message.typedDataChainID)
    }
    if (message.feePayer !== '') {
      writer.uint32(18).string(message.feePayer)
    }
    if (message.feePayerSig.length !== 0) {
      writer.uint32(26).bytes(message.feePayerSig)
    }
    return writer
  },
  decode(input: Uint8Array, length?: number) {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseExtensionOptionsWeb3Tx()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break
          }
          // @ts-ignore
          message.typedDataChainID = longToString(reader.uint64())
          continue
        case 2:
          if (tag !== 18) {
            break
          }
          message.feePayer = reader.string()
          continue
        case 3:
          if (tag !== 26) {
            break
          }
          message.feePayerSig = new Uint8Array(reader.bytes())
          continue
      }
      if ((tag & 7) === 4 || tag === 0) {
        break
      }
      reader.skipType(tag & 7)
    }
    return message
  },
  fromJSON(object: any) {
    return {
      typedDataChainID: isSet(object.typedDataChainID)
        ? globalThis.String(object.typedDataChainID)
        : '0',
      feePayer: isSet(object.feePayer)
        ? globalThis.String(object.feePayer)
        : '',
      feePayerSig: isSet(object.feePayerSig)
        ? bytesFromBase64(object.feePayerSig)
        : new Uint8Array(0)
    }
  },
  toJSON(message: ExtensionOptionsWeb3Tx) {
    const obj = {} as any
    if (message.typedDataChainID !== '0') {
      obj.typedDataChainID = message.typedDataChainID
    }
    if (message.feePayer !== '') {
      obj.feePayer = message.feePayer
    }
    if (message.feePayerSig.length !== 0) {
      obj.feePayerSig = base64FromBytes(message.feePayerSig)
    }
    return obj
  },
  create(base: any) {
    return ExtensionOptionsWeb3Tx.fromPartial(
      base !== null && base !== void 0 ? base : {}
    )
  },
  fromPartial(object: any) {
    var _a, _b, _c
    const message = createBaseExtensionOptionsWeb3Tx()
    message.typedDataChainID =
      (_a = object.typedDataChainID) !== null && _a !== void 0 ? _a : '0'
    message.feePayer =
      (_b = object.feePayer) !== null && _b !== void 0 ? _b : ''
    message.feePayerSig =
      (_c = object.feePayerSig) !== null && _c !== void 0
        ? _c
        : new Uint8Array(0)
    return message
  }
}
function bytesFromBase64(b64: string) {
  if (globalThis.Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, 'base64'))
  } else {
    const bin = globalThis.atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i)
    }
    return arr
  }
}
function base64FromBytes(arr: Uint8Array) {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(arr).toString('base64')
  } else {
    const bin: string[] = []
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte))
    })
    return globalThis.btoa(bin.join(''))
  }
}
function longToString(long: Long) {
  return long.toString()
}
if (_m0.util.Long !== Long) {
  _m0.util.Long = Long
  _m0.configure()
}
function isSet(value: any) {
  return value !== null && value !== undefined
}
