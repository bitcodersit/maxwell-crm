import { BoardModule } from '~~/prisma/client/enums'
import { getAllLeads } from '~~/server/utils/demo/demoStore'

export type TBoardItemMorph = {
  leadId?: number | null
  taskId?: number | null
}

export const assertSingleFk = (data: TBoardItemMorph) => {
  const values = [data.leadId, data.taskId].filter(v => v != null)
  if (values.length !== 1) {
    throw err.unprocessable({
      item: {
        errors: ['Exactly one of leadId or taskId is required']
      }
    })
  }
}

export const assertFkMatchesModule = (module: BoardModule, data: TBoardItemMorph) => {
  if (module === BoardModule.LEADS && data.taskId != null) {
    throw err.unprocessable({
      taskId: {
        errors: ['taskId is not allowed for LEADS boards']
      }
    })
  }
  if (module === BoardModule.TASKS && data.leadId != null) {
    throw err.unprocessable({
      leadId: {
        errors: ['leadId is not allowed for TASKS boards']
      }
    })
  }
}

export const boardItemFk = (module: BoardModule, entityId: number) => {
  if (module === BoardModule.LEADS) {
    return {
      leadId: entityId,
      taskId: null
    }
  }
  return {
    leadId: null,
    taskId: entityId
  }
}

export const assertEntityExists = async (module: BoardModule, data: TBoardItemMorph) => {
  if (module === BoardModule.LEADS && data.leadId) {
    const leads = await getAllLeads()
    if (!leads.some(v => v.id === data.leadId)) {
      throw err.notFound('Lead not found')
    }
    return
  }

  if (module === BoardModule.TASKS && data.taskId) {
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        deletedAt: null
      },
      select: { id: true }
    })
    if (!task) {
      throw err.notFound('Task not found')
    }
  }
}
