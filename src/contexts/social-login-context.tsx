import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'
import { useTurnkey } from '@turnkey/sdk-react'
import { useAtomValue } from 'jotai/react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { User } from 'node_modules/@turnkey/sdk-browser/dist/models'
import { selectedAccountType, turnkeyWalletType } from '@/components/social-login/types'
import { useUser } from '@/hooks/use-turnkey-user'
import { turnkeyUserSession } from '@/store/social-login'

interface TurnkeyContextType {
  currentUser: User | undefined
  selectedWallet: turnkeyWalletType | undefined
  selectedAccount: selectedAccountType | undefined
  evmAccount: selectedAccountType | undefined
  pubkey: selectedAccountType | undefined
  pubkeyEvm: selectedAccountType | undefined
  userEmail: string | undefined
  setCurrentUser: React.Dispatch<React.SetStateAction<User | undefined>>
  setSelectedWallet: React.Dispatch<
    React.SetStateAction<turnkeyWalletType | undefined>
  >
  setSelectedAccount: React.Dispatch<
    React.SetStateAction<selectedAccountType | undefined>
  >
  setPubkey: React.Dispatch<
    React.SetStateAction<selectedAccountType | undefined>
  >
  setPubkeyEvm: React.Dispatch<
    React.SetStateAction<selectedAccountType | undefined>
  >
  setUserEmail: React.Dispatch<React.SetStateAction<string | undefined>>
  turnkeyWalletReady: boolean
  setTurnkeyWalletReady: React.Dispatch<React.SetStateAction<boolean>>
}

const TurnkeyContext = createContext<TurnkeyContextType | undefined>(undefined)

export const TurnkeyUserProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const userSession = useAtomValue(turnkeyUserSession)
  const [currentUser, setCurrentUser] = useState<User | undefined>()
  const [selectedWallet, setSelectedWallet] = useState<
    turnkeyWalletType | undefined
  >()
  const [turnkeyWalletReady, setTurnkeyWalletReady] = useState<boolean>(false)
  const [selectedAccount, setSelectedAccount] = useState<
    selectedAccountType | undefined
  >()
  const [evmAccount, setEvmAccount] = useState<
    selectedAccountType | undefined
  >()
  const [pubkey, setPubkey] = useState<selectedAccountType | undefined>()
  const [pubkeyEvm, setPubkeyEvm] = useState<selectedAccountType | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const { user } = useUser()

  const { getActiveClient, turnkey } = useTurnkey()

  useEffect(() => {
    const fetchUserData = async () => {
      const curUser = await turnkey?.getCurrentUser()
      setCurrentUser(curUser)

      const currentUserSession = await turnkey?.currentUserSession()
      const userWallets = await currentUserSession?.getWallets()

      if (userWallets && userWallets.wallets.length > 0) {
        const wallet = userWallets.wallets[0]
        setSelectedWallet(wallet)

        const walletAccounts = await currentUserSession?.getWalletAccounts({
          walletId: wallet?.walletId
        })
        if (walletAccounts && walletAccounts.accounts.length > 1) {
          const uncompressedAccount = walletAccounts.accounts.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (account) =>
              account.addressFormat === 'ADDRESS_FORMAT_UNCOMPRESSED' &&
              account.path === "m/44'/118'/0'/0/0"
          )

          const uncompressedEvmAccount = walletAccounts.accounts.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (account) =>
              account.addressFormat === 'ADDRESS_FORMAT_COMPRESSED' &&
              account.path === "m/44'/60'/0'/0/0"
          )

          const cosmosAccount = walletAccounts.accounts.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (account) => account.addressFormat === 'ADDRESS_FORMAT_COSMOS'
          )

          const evmAccount = walletAccounts.accounts.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (account) => account.addressFormat === 'ADDRESS_FORMAT_ETHEREUM'
          )
          setPubkey(uncompressedAccount)
          setPubkeyEvm(uncompressedEvmAccount)
          setSelectedAccount(cosmosAccount)
          if (evmAccount) {
            setEvmAccount(evmAccount)
          }
        }
      }
    }
    fetchUserData()
  }, [getActiveClient, user, userSession])

  const value = {
    currentUser,
    selectedWallet,
    selectedAccount,
    evmAccount,
    pubkey,
    pubkeyEvm,
    userEmail,
    setCurrentUser,
    setPubkey,
    setPubkeyEvm,
    setSelectedWallet,
    setSelectedAccount,
    setUserEmail,
    turnkeyWalletReady,
    setTurnkeyWalletReady
  }

  return (
    <TurnkeyContext.Provider value={value}>{children}</TurnkeyContext.Provider>
  )
}

export const useTurnkeyContext = () => {
  const context = useContext(TurnkeyContext)
  if (context === undefined) {
    throw new Error(
      'useTurnkeyContext must be used within a TurnkeyUserProvider'
    )
  }
  return context
}