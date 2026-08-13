import type { H3Event } from 'h3'

export const forceDeleteUsers = async (event: H3Event) => {
  return forceDeleteTrashedUsers(event, {
    where: {
      userRoles: {
        none: {
          role: {
            name: CUSTOMER_ROLE_NAME
          }
        }
      }
    },
    successMessage: 'Users permanently deleted!'
  })
}
