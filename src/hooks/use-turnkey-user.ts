import { useTurnkey } from '@turnkey/sdk-react'
import { useEffect, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { User } from 'node_modules/@turnkey/sdk-browser/dist/models'

export const useUser = () => {
  const { turnkey } = useTurnkey()
  const [user, setUser] = useState<User | undefined>(undefined)
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined)


  useEffect(() => {
    const fetchUser = async () => {
      if (turnkey) {
        const currentUser = await turnkey.getCurrentUser()
        setCurrentUser(currentUser)
        // note/todo: assuming we have a readwrite session, if we move away from this structure do check if still compatible:
        // const readWriteSession = await turnkey.getReadWriteSession()
        const client = await turnkey.currentUserSession()
        
        let userData: User = currentUser
        const { user } =
          (await client?.getUser({
            organizationId: currentUser?.organization?.organizationId,
            userId: currentUser?.userId ?? 'not-available'
          })) || {}
        userData = { ...currentUser, email: user?.userEmail }
        setUser(userData)
      }
    }
    fetchUser()
  }, [turnkey])

  const logout = async () => {
    if (turnkey) {
      await turnkey.logoutUser()
      setUser(undefined)
    }
  }
  
  const currentTimestamp = new Date().getTime()
  const readOnlySessionTimeout = currentUser?.readOnlySession?.sessionExpiry

  /**
   * when session expires, auto logout
   */
  if(currentTimestamp > readOnlySessionTimeout) {
    logout()
  }


  return { user, logout }
}
