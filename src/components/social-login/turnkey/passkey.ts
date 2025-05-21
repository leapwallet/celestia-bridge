import {
    type AccountData,
    // type EncodeObject,
    // coins
  } from '@cosmjs/proto-signing'
//   import { type DeliverTxResponse, SigningStargateClient } from '@cosmjs/stargate'
  import type { ChainInfo, Window as KeplrWindow } from '@keplr-wallet/types'
  import type { TurnkeyDirectWallet } from '@turnkey/cosmjs'
  
  declare global {
    // eslint-disable-next-line 
    interface Window extends KeplrWindow {}
  }
  
  export class Passkey {
    private constructor(
      public account: AccountData,
      public config: ChainInfo,
      public signer: TurnkeyDirectWallet
    ) {}
  
    static connect = async (
      config: ChainInfo,
      signer: TurnkeyDirectWallet
    ): Promise<Passkey> => {
      const [account] = await signer.getAccounts()
  
      return new Passkey(account, config, signer)
    }
  
    public onChange = (fn: (k: Passkey) => void) => {
      console.log(fn)
    }
  
    public disconnect = () => {}
  
    // public signAndBroadcast = async (
    //   rpc: string,
    //   msgs: EncodeObject[]
    // ): Promise<DeliverTxResponse> => {
    //   console.log('Signing and broadcasting transaction...')
  
    //   const signingClient = await SigningStargateClient.connectWithSigner(
    //     rpc,
    //     // @ts-expect-error - type error expected
    //     this.signer
    //   )
    //   return await signingClient.signAndBroadcast(this.account.address, msgs, {
    //     amount: coins(340, 'ukuji'), // this value does not matter here
    //     gas: '10000'
    //   })
    // }
  }