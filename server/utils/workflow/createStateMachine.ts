type TTransitionDef<TState extends string, TEvent extends string, TContext> = {
  to: TState
  can?: (context: TContext) => boolean
}

export type TStateMachineDef<TState extends string, TEvent extends string, TContext> = {
  transitions: Partial<Record<TState, Partial<Record<TEvent, TTransitionDef<TState, TEvent, TContext>>>>>
}

export const createStateMachine = <TState extends string, TEvent extends string, TContext>(
  def: TStateMachineDef<TState, TEvent, TContext>
) => {
  const canApply = (state: TState, event: TEvent, context: TContext) => {
    const transition = def.transitions[state]?.[event]
    if (!transition) return false
    return transition.can ? !!transition.can(context) : true
  }

  const apply = (state: TState, event: TEvent, context: TContext) => {
    const transition = def.transitions[state]?.[event]
    if (!transition || !canApply(state, event, context)) {
      return {
        ok: false as const,
        from: state,
        to: state
      }
    }
    return {
      ok: true as const,
      from: state,
      to: transition.to
    }
  }

  const getAvailableTransitions = (state: TState, context: TContext) => {
    const entries = Object.entries(def.transitions[state] ?? {}) as [
      TEvent,
      TTransitionDef<TState, TEvent, TContext>
    ][]
    return entries
      .filter(([event]) => canApply(state, event, context))
      .map(([event, transition]) => ({
        event,
        to: transition.to
      }))
  }

  return {
    def,
    canApply,
    apply,
    getAvailableTransitions
  }
}
