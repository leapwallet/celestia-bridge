import type {
    ReadOnlySession,
    User
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } from 'node_modules/@turnkey/sdk-browser/dist/models'

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