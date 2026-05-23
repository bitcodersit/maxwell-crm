import type { z } from 'zod'
import { createGetMorphableId } from '../morphable/createGetMorphableId'

export type TAttachableModel = (typeof AttachableModels)[number]
export const AttachableModels = [
  'lead',
  'task',
  'visit',
  'followUp',
  'comment',
  'property'
] as const

const { zGetMorphable, getMorphableId } = createGetMorphableId('attachable', AttachableModels)

export type TZGetAttachable = z.infer<typeof zGetAttachable>
export const zGetAttachable = zGetMorphable

export const getAttachableId = getMorphableId
