export const useUiColors = () => {
  const config = useAppConfig()

  const primary = useCookie('ui-colors-primary', {
    default: () => config.ui.colors.primary,
  })

  const neutral = useCookie('ui-colors-neutral', {
    default: () => config.ui.colors.neutral,
  })

  watch(
    primary,
    (v) => {
      if (config.ui.colors.primary === v) return
      config.ui.colors.primary = v
    },
    { immediate: true }
  )

  watch(
    neutral,
    (v) => {
      if (config.ui.colors.neutral === v) return
      config.ui.colors.neutral = v
    },
    { immediate: true }
  )

  return {
    primary,
    neutral,
  }
}
