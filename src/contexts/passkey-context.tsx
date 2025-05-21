import {
    type FC,
    type PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
  } from 'react'
  import { useTurnkey } from '@turnkey/sdk-react'
  import { TurnkeyDirectWallet } from '@turnkey/cosmjs'
  import { useAtomValue } from 'jotai/react'
  import useElementsChains from '../hooks/use-elements-chains'
import { useTurnkeyContext } from './social-login-context'
import { LeapPasskey } from '@/components/social-login/turnkey'
import { socialLoginMethod, turnkeyUserSession } from '@/store/social-login'
  
  export const KUJIRA_RPC_URL =
    'https://kujira-rpc.publicnode.com:443/9a353f27b9e92ea909491d7ae2102facbd105fb06ff969932dd19cb31d93d0a6'
  
// eslint-disable-next-line 
  export interface PasskeyContextI {}
  
  const context = createContext<PasskeyContextI>({})
  
  new LeapPasskey()
  export const leapPasskey = LeapPasskey.getInstance()
  
  export const PasskeyContext: FC<PropsWithChildren> = ({ children }) => {
    const userSession = useAtomValue(turnkeyUserSession)
    const socialLoginMethodType = useAtomValue(socialLoginMethod)
    const [loading, setLoading] = useState<boolean>(true)
    const { turnkey, authIframeClient, getActiveClient } = useTurnkey()
    const { data: elementsData } = useElementsChains()
    const { pubkey, pubkeyEvm, evmAccount, setTurnkeyWalletReady } = useTurnkeyContext()
  
    // set turnkey wallet dependency
    leapPasskey.setTurnkeyDependencies(turnkey, authIframeClient)
  
    useEffect(() => {
      async function fn() {
        console.log('Creating wallet instance')
  
        const activeClient = await getActiveClient()
        const cleanPubKey = pubkey?.address.replace('0x', '')
        const currentUser = await turnkey?.getCurrentUser()
  
        // userSession determines if logged in or not
        if (activeClient && cleanPubKey && userSession) {
          const turnkeySigner = await TurnkeyDirectWallet.init({
            config: {
              client: activeClient,
              organizationId: `${currentUser?.organization.organizationId}`,
              signWith: cleanPubKey
            }
          })
  
          try {
            await leapPasskey.setTurnkeyMethods(
              activeClient,
            cleanPubKey, // cosmos pubkey
            pubkeyEvm?.address, // evm pubkey
            evmAccount?.address,
            currentUser,
            socialLoginMethodType
            )
            await leapPasskey.setTurnkeySigner(turnkeySigner)
            await leapPasskey.loadWalletIfAny()
            setTurnkeyWalletReady((prev) => !prev)
          } catch (err) {
            console.error('Error during setting turnkey methods to wallet', err)
          }
        }
      }
      fn()
    }, [turnkey, getActiveClient, userSession, pubkey])
  
    const chainIdToPrefixMapping = useMemo(() => {
      return elementsData?.reduce(
        (acc, chain) => {
          // if (chain.coinType === '118') {
          acc[chain.chainId] = chain.addressPrefix
          // }
          return acc
        },
        {} as Record<string, string>
      )
    }, [elementsData])
  
    const chainIdToCoinTypeMapping = useMemo(() => {
      return elementsData?.reduce(
        (acc, chain) => {
          acc[chain.chainId] = chain.coinType
          return acc
        },
        {} as Record<string, string>
      )
    }, [elementsData])
  
    useEffect(() => {
      async function fn() {
        if (chainIdToPrefixMapping && chainIdToCoinTypeMapping) {
          try {
            leapPasskey.setChainIdToPrefixAndCointypeMapping(
              chainIdToPrefixMapping,
              chainIdToCoinTypeMapping
            )
            await leapPasskey.loadWalletIfAny()
          } finally {
            setLoading(false)
          }
        }
      }
      fn()
    }, [chainIdToPrefixMapping, chainIdToCoinTypeMapping])
  
    if (loading) return null
  
    return <context.Provider value={{}}>{children}</context.Provider>
  }
  
  export const usePasskeys = () => useContext(context)