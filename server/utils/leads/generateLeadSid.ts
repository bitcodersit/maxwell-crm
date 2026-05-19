export const generateLeadSid = async () => {
  const lastLead = await prisma.lead.findFirst({
    orderBy: { id: 'desc' },
    select: { sid: true }
  })
  let sid = 1
  if (lastLead) {
    sid = +lastLead.sid.split('-')[1]! + 1
  }
  return `RL-${sid.toString().padStart(5, '0')}`
}
