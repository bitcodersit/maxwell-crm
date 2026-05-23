import type { z } from 'zod'
import { createGetMorphableId } from '../morphable/createGetMorphableId'

export type TCommentableModel = (typeof CommentableModels)[number]
export const CommentableModels = ['lead', 'visit', 'followUp'] as const

const { zGetMorphable, getMorphableId } = createGetMorphableId('commentable', CommentableModels)

export type TZGetCommentable = z.infer<typeof zGetMorphable>
export const zGetCommentable = zGetMorphable

export const getCommentableId = getMorphableId
