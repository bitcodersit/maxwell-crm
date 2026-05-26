type TOrderBy2 = Record<string, 'asc' | 'desc'>

export const getOrderBy = <T extends TOrderBy2 | TOrderBy2[]>(query: TZOrderBy, orderBy?: T) => {
  let v: Record<string, 'asc' | 'desc'> = {}
  try {
    if (typeof query.orderBy === 'string') {
      const parsed = JSON.parse(query.orderBy || '{}')
      if (parsed && typeof parsed === 'object') {
        v = parsed as Record<string, 'asc' | 'desc'>
      }
    } else if (Array.isArray(query.orderBy)) {
      v = (query.orderBy[0] ?? {}) as Record<string, 'asc' | 'desc'>
    } else if (query.orderBy && typeof query.orderBy === 'object') {
      v = query.orderBy as Record<string, 'asc' | 'desc'>
    }
  } catch {
    /* empty */
  }
  return {
    orderBy: Object.keys(v).length
      ? (Object.entries(v).map(([key, value]) => ({
          [key]: value
        })) as T)
      : orderBy
  }
}

type TEmptyObject = Record<never, never>
type TObjectShape = Record<string, unknown>
type TDeepSortable<T> = T extends TObjectShape
  ? { [K in keyof T]: TDeepSortable<T[K]> }
  : Prisma.SortOrder
type TNoEmptyDeepObject<T> = T extends TObjectShape
  ? keyof T extends never
    ? never
    : {
        [K in keyof T]: T[K] extends TObjectShape ? TNoEmptyDeepObject<T[K]> : Prisma.SortOrder
      }
  : never

type TModifierFn = (order: Prisma.SortOrder) => TObjectShape

type TModifierUnion<M extends Partial<Record<string, TModifierFn>>> = [keyof M] extends [never]
  ? TEmptyObject
  : ReturnType<NonNullable<M[keyof M]>>

type TValidatedModifier<T extends TModifierFn> = (
  order: Prisma.SortOrder
) => TNoEmptyDeepObject<ReturnType<T>>

export const getOrderBy2 = <
  T extends string,
  M extends Partial<Record<T, TModifierFn>> = TEmptyObject
>(
  input: TMaybe<Record<T, Prisma.SortOrder>[]>,
  modifiers?: M & { [K in keyof M]: TValidatedModifier<NonNullable<M[K]>> }
):
  | Array<
      TPrettify<
        {
          [K in T as K extends keyof M ? never : K]: Prisma.SortOrder
        } & TDeepSortable<TModifierUnion<M>>
      >
    >
  | undefined => {
  if (!input) return undefined
  const _modifiers = (modifiers ?? {}) as M
  return input.map(row => {
    const rowKeys = Object.keys(row) as T[]
    return rowKeys.reduce((acc, key) => {
      const modifier = _modifiers[key as keyof M]
      const addition = modifier ? modifier(row[key]) : { [key]: row[key] }
      return { ...acc, ...addition }
    }, {} as any)
  }) as any
}
