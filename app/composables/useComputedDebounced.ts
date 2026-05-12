export const useComputedDebounced = <T>(getter: () => T, delay = 300) => {
  const state = computed(getter)
  return refDebounced(state, delay)
}
