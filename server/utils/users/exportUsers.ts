import type { H3Event } from 'h3'
import type z from 'zod'

export type TZExportUsers = z.infer<typeof zExportUsers>
export const zExportUsers = zGetUsers.and(zExportable())

export const exportUsers = async (
  event: H3Event,
  options?: {
    input?: TZExportUsers
  }
) => {
  const user = await getCurrentUser(event)
  if (!user.exportAnyUsers) {
    throw err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zExportUsers))

  let usersInput: TZGetUsers = input

  if (input.selection === 'selected') {
    if (!input.id || ('in' in input.id && !input.id.in.length)) {
      return createError({
        statusCode: 400,
        message: 'No IDs provided'
      })
    }
    usersInput = {
      id: input.id,
      options: false,
      paginate: false,
      orderBy: input.orderBy
    }
  } else if (input.selection === 'current-page') {
    usersInput = {
      ...usersInput,
      options: false,
      paginate: true
    }
  } else if (input.selection === 'all') {
    usersInput = {
      ...usersInput,
      options: false,
      paginate: false
    }
  }

  const data = await getUsers(event, {
    input: usersInput
  })

  const rows = (Array.isArray(data) ? data : data.data) as TUser[]
  return exportData(event, rows, {
    format: input.format,
    filename: `Users ${new Date().toISOString().slice(0, 10)} - ${Date.now()}`,
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      roles: v => {
        return (
          v.userRoles
            ?.map(ur => ur.role?.name)
            .filter(Boolean)
            .join(',') ?? ''
        )
      }
    }
  })
}
