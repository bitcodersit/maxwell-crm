export const selectTeamForOptions = {
  id: true,
  name: true
}

export const selectTeamForTable = {
  creator: selectUserForDisplay,
  members: {
    orderBy: {
      role: 'asc' as Prisma.SortOrder
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
