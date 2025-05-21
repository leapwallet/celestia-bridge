import type { TurnkeySDKApiTypes } from '@turnkey/sdk-browser'
import { useTurnkey } from '@turnkey/sdk-react'
import { AnimatePresence, motion } from 'framer-motion'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { definitions } from 'node_modules/@turnkey/sdk-browser/dist/__inputs__/public_api.types'
import { Button, Dialog, DialogContent, Input } from '@leapwallet/ribbit-react'
import type {
  ReadOnlySession,
  User
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
} from 'node_modules/@turnkey/sdk-browser/dist/models'
import { useAtom, useSetAtom } from 'jotai/react'
import { useEffect, useState } from 'react'
import { passkeySignInState, socialLoginMethod, socialWalletConnecting, turnkeyUserSession } from '@/store/social-login'
import { useTurnkeyContext } from '@/contexts/social-login-context'

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

export const loginResponseToUser = (loginResponse: {
  organizationId: string
  organizationName: string
  userId: string
  username: string
  session?: string
  sessionExpiry?: string
}): User => {
  const subOrganization = {
    organizationId: loginResponse.organizationId,
    organizationName: loginResponse.organizationName
  }

  let readOnlySession: ReadOnlySession | undefined
  if (loginResponse.session) {
    readOnlySession = {
      session: loginResponse.session,
      sessionExpiry: Number(loginResponse.sessionExpiry)
    }
  }

  return {
    userId: loginResponse.userId,
    username: loginResponse.username,
    organization: subOrganization,
    readOnlySession
  }
}

export type Email = `${string}@${string}.${string}`

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const SocialLogin = () => {
  const { turnkey, passkeyClient } = useTurnkey()
  const setSocialWalletConnecting = useSetAtom(socialWalletConnecting);
  const setTurnkeyUser = useSetAtom(turnkeyUserSession)
  const setSocialLoginMethod = useSetAtom(socialLoginMethod)
  const [passkeySignInOpen, setPasskeySignInOpen] = useAtom(passkeySignInState)

  const { setCurrentUser, setUserEmail: userEmailSetter } = useTurnkeyContext()
  const [userEmail, setUserEmail] = useState<string>('')

  const loginWithPasskey = async (email?: Email) => {
    try {
      setSocialWalletConnecting(true);
      const getOrgIds = (await turnkey?.serverSign('getSubOrgIds', [
        {
          filterType: 'EMAIL',
          filterValue: userEmail
        }
      ])) as TurnkeySDKApiTypes.TGetSubOrgIdsResponse

      const subOrgId = getOrgIds.organizationIds[0]

      if (subOrgId?.length) {
        const loginResponse = await passkeyClient?.login()
        if (loginResponse?.organizationId) {
          const user = await turnkey?.getCurrentUser()
          setCurrentUser(user)
          setTurnkeyUser(user)
          userEmailSetter(userEmail)
          setPasskeySignInOpen(false)
          setSocialLoginMethod('passkey')
          setSocialWalletConnecting(false);
        }
      } else {
        // user either does not have an account with a sub organization
        // or does not have a passkey
        // create a new passkey for the user
        const { encodedChallenge, attestation } =
          (await passkeyClient?.createUserPasskey({
            publicKey: {
              user: {
                name: email,
                displayName: email
              }
            }
          })) || {}

        // Create a new sub organization for the user
        if (encodedChallenge && attestation) {
          const authenticators = [
            {
              authenticatorName: 'Passkey',
              challenge: encodedChallenge,
              attestation: attestation
            }
          ]

          const subOrganizationConfig: TurnkeySDKApiTypes.TCreateSubOrganizationBody =
            {
              subOrganizationName: 'Sub-org',
              rootUsers: [
                {
                  userName: userEmail,
                  userEmail: userEmail,
                  oauthProviders: [],
                  apiKeys: [],
                  authenticators: authenticators
                }
              ],
              rootQuorumThreshold: 1,
              wallet: {
                walletName: userEmail,
                accounts: [
                  {
                    curve: 'CURVE_SECP256K1',
                    pathFormat: 'PATH_FORMAT_BIP32',
                    path: "m/44'/118'/0'/0/0",
                    addressFormat: 'ADDRESS_FORMAT_UNCOMPRESSED' // public key
                  },
                  {
                    curve: 'CURVE_SECP256K1',
                    pathFormat: 'PATH_FORMAT_BIP32',
                    path: "m/44'/118'/0'/0/0",
                    addressFormat: 'ADDRESS_FORMAT_COSMOS' // cosmos address
                  },
                  {
                    curve: 'CURVE_SECP256K1',
                    pathFormat: 'PATH_FORMAT_BIP32',
                    path: "m/44'/60'/0'/0/0",
                    addressFormat: 'ADDRESS_FORMAT_ETHEREUM' // evm address
                  }
                ]
              }
            }

          const createSubOrganizationResponse = (await turnkey?.serverSign(
            'createSubOrganization',
            [subOrganizationConfig]
          )) as TurnkeySDKApiTypes.TCreateSubOrganizationResponse
          // const targetSubOrgId = createSubOrganizationResponse.subOrganizationId;
          await createSubOrganizationResponse.subOrganizationId

          const user = await turnkey?.getCurrentUser()
          setCurrentUser(user)
          setTurnkeyUser(user)
          setPasskeySignInOpen(false)
          setSocialLoginMethod('passkey')
          setSocialWalletConnecting(false);
        }
      }
    } catch (error) {
      console.log('Error in passkey log in: ', error)
    }
  }

  /**
   * This delayed open method helps prevent the following issue caused by Dialog modals:
   *
   * As we switch between closing and opening another modal, if it happens simaltaneously there is a
   * background layer which persists and blocks any click action on the page even if dialog is closed
   */
  const [delayedPasskeyOpen, setDelayedPasskeyOpen] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    if (passkeySignInOpen) {
      timeoutId = setTimeout(() => {
        setDelayedPasskeyOpen(true)
      }, 200)
    } else {
      setDelayedPasskeyOpen(false)
      setSocialWalletConnecting(false)
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [passkeySignInOpen, setSocialWalletConnecting])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateEmail(userEmail)) {
      loginWithPasskey()
    }
  }

  return (
    <>
      {/* Passkey dialog */}
      <Dialog
        modal={true}
        open={delayedPasskeyOpen}
        onOpenChange={setPasskeySignInOpen}
      >
        <DialogContent
          showClose={true}
          className="w-[21rem] rounded-3xl border cursor-default p-6 flex flex-col justify-start items-start overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="google-login"
              className="w-full"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <form
                onSubmit={handleSubmit}
                className="flex flex-col w-full items-center justify-center gap-6 mt-10"
              >
                <Input
                  className="bg-card border border-primary/40 w-full px-4 py-2 rounded-md text-sm"
                  type="email"
                  variant="unstyled"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  onChange={(e) => setUserEmail(e.target.value)}
                  value={userEmail}
                  placeholder="Enter email address"
                  required={true}
                />
                <Button
                  type="submit"
                  variant="default"
                  className="rounded-full w-full border-none font-bold"
                  disabled={!validateEmail(userEmail)}
                >
                  Continue with Passkey
                </Button>
              </form>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}