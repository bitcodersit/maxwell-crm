export const selectTeamForOptions: Prisma.TeamSelect = {
  id: true,
  name: true
}

export const selectTeamForTable: Prisma.TeamInclude = {
  creator: {
    select: selectUserForDisplay
  },
  members: {
    orderBy: {
      role: 'asc'
    },
    select: {
      role: true,
      user: {
        select: selectUserForDisplay
      },
      assigner: {
        select: selectUserForDisplay
      }
    }
  }
}

export const selectTeam = (v?: { options?: boolean }) => {
  return v?.options
    ? {
        include: selectTeamForTable
      }
    : {
        select: selectTeamForOptions
      }
}
