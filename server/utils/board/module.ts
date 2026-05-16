import { BoardModule } from '~~/prisma/client/enums'

export const BoardModuleParam = {
  leads: BoardModule.LEADS,
  tasks: BoardModule.TASKS
} as const

export type TBoardModuleQueryParam = keyof typeof BoardModuleParam

export const getBoardModuleFromParam = (value: unknown) => {
  const key = value?.toString().trim().toLowerCase() as TBoardModuleQueryParam
  return BoardModuleParam[key] || null
}

export const getBoardModuleParam = (module: BoardModule) => {
  if (module === BoardModule.LEADS) return 'leads'
  if (module === BoardModule.TASKS) return 'tasks'
  return null
}
