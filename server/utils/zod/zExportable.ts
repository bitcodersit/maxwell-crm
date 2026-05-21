import z from 'zod'

export type TZExportFormat = z.infer<ReturnType<typeof zExportFormat>>
export const zExportFormat = () => {
  return z.enum(['csv', 'xlsx']).default('xlsx')
}

export type TZExportSelection = z.infer<ReturnType<typeof zExportSelection>>
export const zExportSelection = () => {
  return z.enum(['all', 'selected', 'current-page']).default('current-page')
}

export type TZExportable = z.infer<ReturnType<typeof zExportable>>
export const zExportable = () => {
  return z.object({
    format: zExportFormat(),
    selection: zExportSelection()
  })
}
