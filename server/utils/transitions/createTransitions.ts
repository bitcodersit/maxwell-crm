/* eslint-disable no-unused-vars */
type TContext<State, Payload, Transition> = {
  state: State
  payload: Payload
  transition: Transition
}

type TSuccessContext<State, Payload, Transition, Result> = {
  oldState: State
  state: State
  payload: Payload
  transition: Transition
  result: Result
}

type TTransition<State, Transition, Payload = any, Meta = any> = {
  name: Transition
  from: State | State[]
  to: State
  meta?: Meta
  hidden?: (payload?: Partial<Payload>) => boolean
  payload?: (context: TContext<State, Payload, Transition>) => Partial<Payload>
}

type TErrorContext<State, Payload, Transition, Error> = {
  oldState: State
  state: State
  payload: Payload
  transition: Transition
  error: Error
}

export const createTransitions = <
  State extends string,
  Transition extends string,
  Payload = any,
  Meta = any,
  Result = unknown
>(config: {
  states: State[]
  transitions: TTransition<State, Transition, Payload, Meta>[]
  onCheck?: (context: TContext<State, Payload, Transition>) => boolean
  onMutate?: (context: TContext<State, Payload, Transition>) => Promise<Result>
  onSuccess?: (context: TSuccessContext<State, Payload, Transition, Result>) => any | Promise<any>
  onError?: (context: TErrorContext<State, Payload, Transition, Error>) => any | Promise<any>
}) => {
  const list = (payload?: Partial<Payload>, state?: State) => {
    if (!state) return config.transitions
    return config.transitions
      .filter(transition => {
        if (Array.isArray(transition.from)) {
          return transition.from.includes(state)
        }
        return transition.from === state
      })
      .filter(transition => {
        if (!transition.hidden) return true
        return !transition.hidden(payload)
      })
  }

  return {
    list,
    init(state: State, payload: Payload) {
      const can = (transition: Transition) => {
        if (!list(payload, state).some(t => t.name === transition)) {
          return false
        }
        if (!config.onCheck) return true
        return config.onCheck({
          state,
          payload,
          transition
        })
      }

      const apply = async (transition: Transition): Promise<[Error | null, Result | null]> => {
        if (!can(transition)) return [new Error(`Transition ${transition} is not allowed`), null]
        const item = list(payload, state).find(t => t.name === transition)
        const nextState = item!.to
        const newPayload = !item?.payload
          ? payload
          : {
              ...payload,
              ...item!.payload?.({
                state,
                payload,
                transition
              })
            }

        const data = {
          state,
          payload: newPayload,
          oldState: nextState,
          transition
        }

        try {
          const result = await config.onMutate?.({
            state: nextState,
            payload: newPayload,
            transition
          })
          state = nextState
          config.onSuccess?.({ ...data, result: result! })
          return [null, result!]
        } catch (error) {
          config.onError?.({ ...data, error: error as Error })
          return [
            new Error(`Failed to apply transition ${transition} from ${state} to ${nextState}`),
            null
          ]
        }
      }

      return {
        state,
        can,
        list,
        apply
      }
    }
  }
}
