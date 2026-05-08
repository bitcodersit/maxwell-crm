import { UIcon, UTooltip } from '#components'

export const hVerified = (v: string | null, vVerifiedAt: string | Date | null, message: string) => {
  if (!v) return null
  return h(
    UTooltip,
    { text: vVerifiedAt ? `Verified at ${$dfc(vVerifiedAt)}` : message },
    {
      default: () =>
        h(UIcon, {
          name: vVerifiedAt ? 'i-lucide-circle-check' : 'i-lucide-circle-alert',
          class: vVerifiedAt ? 'text-success size-4' : 'text-warning size-4'
        })
    }
  )
}
