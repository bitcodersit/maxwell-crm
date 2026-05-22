export const selectTeamForOptions: Prisma.TeamSelect = {
  id: true,
  name: true
}

export const selectTeamForTable: Prisma.TeamInclude = {
  creator: selectUserForDisplay,
  members: {
    orderBy: {
      role: 'asc'
    },
    select: {
      role: true,
      user: selectUserForDisplay,
      assigner: selectUserForDisplay
    }
  }
}

export const selectTeam = (v?: { options?: boolean }) => {
  return v?.options
    ? {
        select: selectTeamForOptions
      }
    : {
        include: selectTeamForTable
      }
}
