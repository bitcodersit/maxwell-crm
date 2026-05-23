import type { H3Event } from 'h3'
import { z } from 'zod'
import { createAttachments, zCreateAttachmentsBase } from '../attachments'
import { getInput } from '../getInput'
import { getCommentableId, zGetCommentable } from './getCommentableId'

export type TZCreateComment = z.infer<typeof zCreateComment>
export const zCreateComment = z
  .object({
    text: zString()
  })
  .and(zGetCommentable)
  .and(zCreateAttachmentsBase.partial())

export type TZUpdateComment = z.infer<typeof zUpdateComment>
export const zUpdateComment = z
  .object({
    id: zId(),
    text: zString().nullish()
  })
  .and(zCreateAttachmentsBase.partial())

export type TZUpsertComment = z.infer<typeof zUpsertComment>
export const zUpsertComment = z.union([zUpdateComment, zCreateComment])

export const upsertComment = async (event: H3Event, options?: { input?: TZUpsertComment }) => {
  //
  const user = await getCurrentUser(event)
  const input = await getInput(event, zUpsertComment, options)

  // Update comment
  if ('id' in input) {
    const comment = await prisma.comment.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        text: true,
        attachableId: true
      }
    })
    if (!comment) throw err.notFound()
    if (input.text && input.text !== comment?.text) {
      await prisma.comment.update({
        where: { id: input.id },
        data: { text: input.text }
      })
    }
    if (input.files?.length) {
      await createAttachments(event, {
        input: {
          attachableId: comment.attachableId!,
          attachableModelId: comment.id,
          attachableModelType: 'comment',
          files: input.files,
          folder: 'comments'
        }
      })
    }
    return {
      message: 'Comment updated successfully'
    }
  }

  // Create comment
  const commentableId = await getCommentableId(event, { input })
  const comment = await prisma.comment.create({
    data: {
      text: input.text,
      author: {
        connect: {
          id: user.id
        }
      },
      commentable: {
        connect: {
          id: commentableId
        }
      },
      attachable: {
        create: {}
      }
    },
    include: {
      attachable: {
        include: {
          attachments: true
        }
      }
    }
  })

  if (input.files?.length) {
    await createAttachments(event, {
      input: {
        attachableId: comment.attachableId!,
        attachableModelId: comment.id,
        attachableModelType: 'comment',
        files: input.files,
        folder: 'comments'
      }
    })
  }

  return {
    message: 'Comment created successfully'
  }
}
