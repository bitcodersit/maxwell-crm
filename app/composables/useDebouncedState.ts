export const useDebouncedState = <T>(value: T, delay: number) => {
  const state = ref(value)
  const stateD = refDebounced(state, delay)
  return {
    state,
    stateD
  }
}
