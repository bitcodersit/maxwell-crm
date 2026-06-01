import type { H3Event } from 'h3'
import z from 'zod'

type TMorphableDirectInput<T extends string> = Record<`${T}Id`, number>

type TMorphableModelInput<T extends string, M extends readonly string[]> = Record<
  `${T}ModelId`,
  number
> &
  Record<`${T}ModelType`, M[number]>

type TMorphableInput<T extends string, M extends readonly string[]> =
  | TMorphableDirectInput<T>
  | TMorphableModelInput<T, M>

type TMorphableEnumMap<M extends readonly string[]> = {
  [K in keyof { [K in M[number]]: K }]: { [K in M[number]]: K }[K]
}

type TMorphableSchema<T extends string, M extends readonly [string, ...string[]]> = z.ZodUnion<
  readonly [
    z.ZodObject<Record<`${T}Id`, z.ZodCoercedNumber<unknown>>, z.core.$strip>,
    z.ZodObject<
      Record<`${T}ModelId`, z.ZodCoercedNumber<unknown>> &
        Record<`${T}ModelType`, z.ZodEnum<TMorphableEnumMap<M>>>,
      z.core.$strip
    >
  ]
>

export const createGetMorphableId = <T extends string, M extends readonly [string, ...string[]]>(
  name: T,
  models: M
) => {
  type TDirectKey = `${T}Id`
  type TModelIdKey = `${T}ModelId`
  type TModelTypeKey = `${T}ModelType`
  type TInput = TMorphableInput<T, M>

  const xId = `${name}Id` as TDirectKey
  const xModelId = `${name}ModelId` as TModelIdKey
  const xModelType = `${name}ModelType` as TModelTypeKey

  const zGetMorphable: TMorphableSchema<T, M> = z.union([
    z.object({
      [xId]: zId()
    }),
    z.object({
      [xModelId]: zId(),
      [xModelType]: z.enum(models)
    })
  ]) as unknown as TMorphableSchema<T, M>

  const getMorphableId = async (event: H3Event, options?: { input?: TInput }): Promise<number> => {
    const input = options?.input ?? (await validate(await readBody(event), zGetMorphable))

    if (xId in input) {
      const directInput = input as TMorphableDirectInput<T>
      return directInput[xId]
    }

    const modelInput = input as TMorphableModelInput<T, M>
    const modelType = modelInput[xModelType]
    const modelId = modelInput[xModelId]
    const model = (prisma as any)[modelType]
    const entity = await model.findUnique({
      where: { id: modelId },
      select: { id: true, [xId]: true }
    })

    if (!entity) {
      throw createError({
        statusCode: 404,
        message: `${modelType} not found with id ${modelId}`
      })
    }

    if (entity[xId]) return entity[xId]

    const morph = await (prisma as any)[name].create({
      data: {},
      select: {
        id: true
      }
    })

    await model.update({
      where: {
        id: entity.id
      },
      data: {
        [xId]: morph.id
      }
    })

    return morph.id
  }

  return {
    zGetMorphable,
    getMorphableId
  }
}
