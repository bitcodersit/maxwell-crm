export type TLeadDetailActions = {
  refresh: () => void | Promise<unknown>
  openFollowUpModal: () => void
  openVisitModal: () => void
  openEditModal: () => void
  setTab: (tab: string) => void
}

const key = Symbol('leadDetailActions')

export function provideLeadDetailActions(actions: TLeadDetailActions) {
  provide(key, actions)
}

export function useLeadDetailActions() {
  return inject<TLeadDetailActions>(key)
}
