import { UButton, UTooltip } from '#components'

export const useHCopy = () => {
  const { copied, copy } = useClipboard()
  const hCopy = (v: string | null) => {
    if (!v) return null
    return h(
      UTooltip,
      {
        arrow: true,
        text: copied.value ? 'Copied!' : 'Copy to clipboard',
        delayDuration: 0,
        disableClosingTrigger: true
      },
      {
        default: () =>
          h(UButton, {
            size: 'xs',
            icon: 'i-lucide-copy',
            color: 'neutral',
            variant: 'ghost',
            class: 'text-muted/70',
            ui: { leadingIcon: 'size-3.5' },
            onClick: () => copy(v)
          })
      }
    )
  }
  return {
    hCopy
  }
}
