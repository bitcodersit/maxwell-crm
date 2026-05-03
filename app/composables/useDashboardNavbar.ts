export type TDashboardNavbarState = {
  title: string
}

const getDefaultState = (): TDashboardNavbarState => ({
  title: '',
})

export function useDashboardNavbar(v?: Partial<TDashboardNavbarState>) {
  const state = useState<TDashboardNavbarState>('DashboardNavbar', getDefaultState)
  state.value = {
    ...state.value,
    ...v,
  }

  return state
}
