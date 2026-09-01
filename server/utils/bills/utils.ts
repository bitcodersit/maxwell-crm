import { BillApprovalStage, TeamMemberRole } from '~~/prisma/client/enums'

const editableStatuses = ['New', 'Cancelled', 'Rejected'] as const
const deletableStatuses = ['New', 'Cancelled'] as const
const privateStatuses = ['New', 'Cancelled'] as const

const isPrivateBillStatus = (status?: string) => {
  return privateStatuses.includes(String(status || '') as (typeof privateStatuses)[number])
}

export const userLeadsBillEmployee = async (leaderId: number, employeeId: number) => {
  const found = await prisma.teamMember.findFirst({
    where: {
      userId: leaderId,
      role: TeamMemberRole.LEADER,
      deletedAt: null,
      team: {
        deletedAt: null,
        members: {
          some: {
            userId: employeeId,
            deletedAt: null
          }
        }
      }
    },
    select: {
      id: true
    }
  })
  return !!found
}

export const ledTeamMemberBillWhere = (userId: number): Prisma.BillWhereInput => ({
  user: {
    teamMembers: {
      some: {
        deletedAt: null,
        team: {
          deletedAt: null,
          members: {
            some: {
              userId,
              role: TeamMemberRole.LEADER,
              deletedAt: null
            }
          }
        }
      }
    }
  }
})

export const employeeHasNoTeamWhere: Prisma.BillWhereInput = {
  user: {
    teamMembers: {
      none: {
        deletedAt: null,
        team: {
          deletedAt: null
        }
      }
    }
  }
}

export const employeeHasTeamWhere: Prisma.BillWhereInput = {
  user: {
    teamMembers: {
      some: {
        deletedAt: null,
        team: {
          deletedAt: null
        }
      }
    }
  }
}

export const hasLeaderApprovalWhere: Prisma.BillWhereInput = {
  approvals: {
    some: {
      stage: BillApprovalStage.Leader
    }
  }
}

export const accountantQueueWhere: Prisma.BillWhereInput = {
  OR: [hasLeaderApprovalWhere, employeeHasNoTeamWhere]
}

export const awaitingLeaderWhere: Prisma.BillWhereInput = {
  AND: [employeeHasTeamWhere, { NOT: hasLeaderApprovalWhere }]
}

export const ownBillWhere = (userId: number): Prisma.BillWhereInput => ({
  OR: [{ userId }, { authorId: userId }]
})

export const canReadBills = (user: TUser) => {
  return !!(user.readAnyBills || user.readTeamBills || user.readOwnBills)
}

export const canCreateBillForUser = async (user: TUser, employeeId: number) => {
  if (user.createAnyBills) return true
  if (user.createOwnBills && employeeId === user.id) return true
  if (user.createTeamBills && (await userLeadsBillEmployee(user.id, employeeId))) return true
  return false
}

const isOwnBill = (user: TUser, bill: { userId: number; authorId?: number | null }) => {
  return bill.userId === user.id || bill.authorId === user.id
}

export const canUpdateBillRecord = async (
  user: TUser,
  bill: { userId: number; authorId?: number | null; status?: string }
) => {
  const status = String(bill.status || '')
  if (isPrivateBillStatus(status)) {
    return (
      isOwnBill(user, bill) &&
      !!(user.updateAnyBills || user.updateOwnBills || user.updateTeamBills)
    )
  }
  if (user.updateAnyBills) return true
  if (!editableStatuses.includes(status as (typeof editableStatuses)[number])) return false
  if (user.updateOwnBills && isOwnBill(user, bill)) return true
  if (user.updateTeamBills && (await userLeadsBillEmployee(user.id, bill.userId))) return true
  return false
}

export const canDeleteBillRecord = async (
  user: TUser,
  bill: { userId: number; authorId?: number | null; status?: string }
) => {
  const status = String(bill.status || '')
  if (isPrivateBillStatus(status)) {
    return (
      isOwnBill(user, bill) &&
      !!(user.deleteAnyBills || user.deleteOwnBills || user.deleteTeamBills)
    )
  }
  if (user.deleteAnyBills) return true
  if (!deletableStatuses.includes(status as (typeof deletableStatuses)[number])) return false
  if (user.deleteOwnBills && isOwnBill(user, bill)) return true
  if (user.deleteTeamBills && (await userLeadsBillEmployee(user.id, bill.userId))) return true
  return false
}

export const canSeeBillRecord = async (
  user: TUser,
  bill: { status?: string; userId: number; authorId?: number | null }
) => {
  if (!canReadBills(user)) return false
  if (isPrivateBillStatus(bill.status)) return isOwnBill(user, bill)
  if (user.readAnyBills) return true
  if (user.readOwnBills && isOwnBill(user, bill)) return true
  if (user.readTeamBills && (await userLeadsBillEmployee(user.id, bill.userId))) return true
  return false
}

export const getScopedBill: TScopeFn<Prisma.BillWhereInput> = (where, user) => {
  if (!canReadBills(user)) {
    return {
      AND: [where, { id: -1 }]
    }
  }

  const ownPrivateBills: Prisma.BillWhereInput = {
    status: {
      in: [...privateStatuses]
    },
    ...ownBillWhere(user.id)
  }

  const otherBills: Prisma.BillWhereInput[] = []
  if (user.readAnyBills) {
    otherBills.push({
      status: {
        notIn: [...privateStatuses]
      }
    })
  } else {
    const access: Prisma.BillWhereInput[] = []
    if (user.readOwnBills) {
      access.push(ownBillWhere(user.id))
    }
    if (user.readTeamBills) {
      access.push(ledTeamMemberBillWhere(user.id))
    }
    if (access.length) {
      otherBills.push({
        AND: [
          {
            status: {
              notIn: [...privateStatuses]
            }
          },
          {
            OR: access
          }
        ]
      })
    }
  }

  return {
    AND: [
      where,
      {
        OR: [ownPrivateBills, ...otherBills]
      }
    ]
  }
}

export const awaitingPendingWhere = (awaiting?: string | null): Prisma.BillWhereInput | undefined => {
  if (awaiting === 'accountant') {
    return {
      OR: [{ status: { not: BillStatus.Pending } }, { status: BillStatus.Pending, ...accountantQueueWhere }]
    }
  }
  if (awaiting === 'leader') {
    return {
      OR: [{ status: { not: BillStatus.Pending } }, { status: BillStatus.Pending, ...awaitingLeaderWhere }]
    }
  }
  return undefined
}

export const getUsersWithPermissionEmails = async (permissionName: string) => {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      email: {
        not: null
      },
      userRoles: {
        some: {
          role: {
            rolePermissions: {
              some: {
                permission: {
                  name: permissionName
                }
              }
            }
          }
        }
      }
    },
    select: {
      email: true
    }
  })
  return users.map(v => v.email).filter(Boolean) as string[]
}

export const getTeamLeaderEmails = async (employeeId: number) => {
  const leaders = await prisma.user.findMany({
    where: {
      deletedAt: null,
      email: {
        not: null
      },
      teamMembers: {
        some: {
          role: TeamMemberRole.LEADER,
          deletedAt: null,
          team: {
            deletedAt: null,
            members: {
              some: {
                userId: employeeId,
                deletedAt: null
              }
            }
          }
        }
      }
    },
    select: {
      email: true
    }
  })
  return leaders.map(v => v.email).filter(Boolean) as string[]
}

export const getBillTransitionPayload = async (billId: number, user: TUser) => {
  const bill = await prisma.bill.findUnique({
    where: {
      id: billId
    },
    select: {
      id: true,
      date: true,
      amount: true,
      status: true,
      purpose: true,
      userId: true,
      authorId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          teamMembers: {
            where: {
              deletedAt: null,
              team: {
                deletedAt: null
              }
            },
            select: {
              id: true
            }
          }
        }
      },
      author: selectUserForEmail,
      type: {
        select: {
          name: true
        }
      },
      approvals: {
        select: {
          stage: true,
          userId: true
        }
      }
    }
  })
  if (!bill) return null
  if (!(await canSeeBillRecord(user, bill))) return null

  return {
    user,
    bill: bill as unknown as TBill,
    employeeHasTeam: (bill.user as { teamMembers?: { id: number }[] } | null)?.teamMembers?.length
      ? true
      : false,
    hasLeaderApproval: bill.approvals.some(a => a.stage === BillApprovalStage.Leader),
    hasOwnLeaderApproval: bill.approvals.some(
      a => a.stage === BillApprovalStage.Leader && a.userId === user.id
    ),
    leadsEmployeeTeam: await userLeadsBillEmployee(user.id, bill.userId)
  }
}
