// import { BoardModule } from '~~/prisma/client/enums'

export const BoardModuleParam = {
  leads: 'leads',
  tasks: 'tasks'
} as const

export type TBoardModuleQueryParam = keyof typeof BoardModuleParam

export const getBoardModuleFromParam = (value: unknown) => {
  const key = value?.toString().trim().toLowerCase() as TBoardModuleQueryParam
  return BoardModuleParam[key] || null
}

export const getBoardModuleParam = (module: string) => {
  if (module === 'leads') return 'leads'
  if (module === 'tasks') return 'tasks'
  return null
}
