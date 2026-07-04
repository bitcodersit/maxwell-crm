function paginated<T>(data: T[], page = 1, perPage = 10): TPaginated<T> {
  const total = data.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return {
    page,
    total,
    perPage,
    totalPages,
    firstPage: 1,
    lastPage: totalPages,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    fetchedAt: Date.now(),
    data
  }
}

const userKarim = {
  id: 2,
  name: 'Karim Hossain',
  email: 'karim@maxwell.com',
  phone: '+8801711000001',
  avatar: { path: null }
}

const userRitu = {
  id: 3,
  name: 'Ritu Ahmed',
  email: 'ritu@maxwell.com',
  phone: '+8801711000002',
  avatar: { path: null }
}

const userNabil = {
  id: 4,
  name: 'Nabil Rahman',
  email: 'nabil@maxwell.com',
  phone: null,
  avatar: { path: null }
}

const badgeKarim = { id: userKarim.id, name: userKarim.name, avatar: userKarim.avatar }
const badgeRitu = { id: userRitu.id, name: userRitu.name, avatar: userRitu.avatar }

function buildLeadFixture(sid: string): TLead {
  const now = new Date()
  const createdAt = new Date('2026-06-15T09:30:00.000Z')
  const updatedAt = new Date('2026-06-28T14:20:00.000Z')

  return {
    id: 42,
    sid,
    status: 'Hot',
    budgetMin: '4500000' as unknown as TLead['budgetMin'],
    budgetMax: '6500000' as unknown as TLead['budgetMax'],
    creatorId: userKarim.id,
    assignableId: 10,
    addressId: 5,
    sourceId: 1,
    customerId: 20,
    propertyTypeMainId: 2,
    propertyTypeSubId: 3,
    attachableId: 100,
    commentableId: 200,
    createdAt,
    updatedAt,
    deletedAt: null,
    creator: userKarim,
    customer: {
      id: 20,
      name: 'Mohammad Shahid',
      email: 'shahid@email.com',
      phone: '+8801812345678',
      avatar: { path: null }
    },
    source: {
      id: 1,
      name: 'Facebook',
      type: 'LeadSource',
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    },
    propertyTypeMain: {
      id: 2,
      name: 'Land',
      type: 'PropertyTypeMain',
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    },
    propertyTypeSub: {
      id: 3,
      name: 'Ready',
      type: 'PropertyTypeSub',
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    },
    address: {
      id: 5,
      name: 'Gulshan',
      addressLine1: 'Road 12, Block C',
      road: 'Road 12',
      block: 'Block C',
      addressableId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    },
    assignable: {
      id: 10,
      users: [
        {
          id: 1,
          assignableId: 10,
          userId: userKarim.id,
          assignerId: userKarim.id,
          user: userKarim
        },
        {
          id: 2,
          assignableId: 10,
          userId: userRitu.id,
          assignerId: userKarim.id,
          user: userRitu
        }
      ],
      teams: [
        {
          id: 1,
          assignableId: 10,
          teamId: 1,
          assignerId: userKarim.id,
          team: {
            id: 1,
            name: 'Sales Team A',
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            members: [
              {
                id: 1,
                teamId: 1,
                userId: userNabil.id,
                role: 'MEMBER',
                user: userNabil
              }
            ]
          }
        }
      ]
    },
    boardItems: [
      {
        id: 55,
        boardId: 1,
        columnId: 3,
        leadId: 42,
        taskId: null,
        sortOrder: 'a0',
        createdAt: now,
        updatedAt: now
      }
    ],
    attachable: {
      id: 100,
      attachments: [
        {
          id: 1,
          name: 'site-map.pdf',
          path: 'leads/42/site-map.pdf',
          mime: 'application/pdf',
          size: 245760
        },
        {
          id: 2,
          name: 'customer-id.jpg',
          path: 'leads/42/customer-id.jpg',
          mime: 'image/jpeg',
          size: 184320
        },
        {
          id: 3,
          name: 'budget-breakdown.xlsx',
          path: 'leads/42/budget-breakdown.xlsx',
          mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 51200
        }
      ]
    },
    commentable: {
      id: 200,
      comments: []
    }
  } as unknown as TLead
}

function buildFollowUps(leadId: number): TFollowUp[] {
  return [
    {
      id: 1,
      leadId,
      authorId: badgeKarim.id,
      date: new Date('2026-06-20T10:00:00.000Z'),
      type: 'Call',
      status: 'Completed',
      outcome: 'Customer interested in Gulshan plot. Asked for site visit.',
      nextDate: new Date('2026-06-25T11:00:00.000Z'),
      attachableId: 101,
      commentableId: 201,
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
      updatedAt: new Date('2026-06-20T10:30:00.000Z'),
      deletedAt: null,
      author: badgeKarim,
      attachable: {
        id: 101,
        attachments: [
          {
            id: 10,
            name: 'call-notes.pdf',
            path: 'follow-ups/1/call-notes.pdf',
            mime: 'application/pdf',
            size: 32000
          }
        ]
      },
      commentable: { id: 201, comments: [] }
    },
    {
      id: 2,
      leadId,
      authorId: badgeRitu.id,
      date: new Date('2026-06-25T11:30:00.000Z'),
      type: 'Visit',
      status: 'Completed',
      outcome: 'Site visit completed. Customer liked the location.',
      nextDate: new Date('2026-06-28T15:00:00.000Z'),
      attachableId: 102,
      commentableId: 202,
      createdAt: new Date('2026-06-25T11:30:00.000Z'),
      updatedAt: new Date('2026-06-25T14:00:00.000Z'),
      deletedAt: null,
      author: badgeRitu,
      attachable: { id: 102, attachments: [] },
      commentable: { id: 202, comments: [] }
    },
    {
      id: 3,
      leadId,
      authorId: badgeKarim.id,
      date: new Date('2026-06-28T15:00:00.000Z'),
      type: 'Whatsapp',
      status: 'Pending',
      outcome: null,
      nextDate: new Date('2026-06-30T10:00:00.000Z'),
      attachableId: 103,
      commentableId: 203,
      createdAt: new Date('2026-06-28T15:00:00.000Z'),
      updatedAt: new Date('2026-06-28T15:00:00.000Z'),
      deletedAt: null,
      author: badgeKarim,
      attachable: { id: 103, attachments: [] },
      commentable: { id: 203, comments: [] }
    }
  ] as unknown as TFollowUp[]
}

function buildVisits(leadId: number): TVisit[] {
  return [
    {
      id: 1,
      leadId,
      propertyId: null,
      authorId: badgeRitu.id,
      date: new Date('2026-06-25T11:00:00.000Z'),
      status: 'Completed',
      checkIn: { lat: 23.7925, lng: 90.4078 },
      nextAction: 'Send revised quotation',
      customerPresence: 'Present',
      attachableId: 110,
      commentableId: 210,
      assignableId: 11,
      createdAt: new Date('2026-06-25T11:00:00.000Z'),
      updatedAt: new Date('2026-06-25T14:00:00.000Z'),
      deletedAt: null,
      author: badgeRitu,
      assignable: {
        id: 11,
        users: [
          {
            id: 3,
            assignableId: 11,
            userId: badgeRitu.id,
            assignerId: badgeKarim.id,
            user: userRitu
          }
        ],
        teams: []
      },
      attachable: { id: 110, attachments: [] },
      commentable: { id: 210, comments: [] }
    },
    {
      id: 2,
      leadId,
      propertyId: null,
      authorId: badgeKarim.id,
      date: new Date('2026-06-30T10:00:00.000Z'),
      status: 'Pending',
      checkIn: null,
      nextAction: 'Follow up on financing options',
      customerPresence: null,
      attachableId: 111,
      commentableId: 211,
      assignableId: 12,
      createdAt: new Date('2026-06-28T09:00:00.000Z'),
      updatedAt: new Date('2026-06-28T09:00:00.000Z'),
      deletedAt: null,
      author: badgeKarim,
      assignable: {
        id: 12,
        users: [
          {
            id: 4,
            assignableId: 12,
            userId: badgeKarim.id,
            assignerId: badgeKarim.id,
            user: userKarim
          }
        ],
        teams: []
      },
      attachable: { id: 111, attachments: [] },
      commentable: { id: 211, comments: [] }
    }
  ] as unknown as TVisit[]
}

function buildComments(): TComment[] {
  return [
    {
      id: 1,
      commentableId: 200,
      attachableId: 120,
      authorId: badgeKarim.id,
      text: 'Customer prefers east-facing plot. Budget is flexible up to 65 lakh.',
      createdAt: new Date('2026-06-16T08:00:00.000Z'),
      updatedAt: new Date('2026-06-16T08:00:00.000Z'),
      deletedAt: null,
      author: badgeKarim,
      attachable: { id: 120, attachments: [] }
    },
    {
      id: 2,
      commentableId: 200,
      attachableId: 121,
      authorId: badgeRitu.id,
      text: 'Shared brochure via WhatsApp. Customer will review with family.',
      createdAt: new Date('2026-06-18T14:30:00.000Z'),
      updatedAt: new Date('2026-06-18T14:30:00.000Z'),
      deletedAt: null,
      author: badgeRitu,
      attachable: {
        id: 121,
        attachments: [
          {
            id: 20,
            name: 'brochure.pdf',
            path: 'comments/2/brochure.pdf',
            mime: 'application/pdf',
            size: 1024000
          }
        ]
      }
    },
    {
      id: 3,
      commentableId: 200,
      attachableId: 122,
      authorId: badgeKarim.id,
      text: 'Family approved the Gulshan location. Moving to negotiation phase.',
      createdAt: new Date('2026-06-26T11:00:00.000Z'),
      updatedAt: new Date('2026-06-26T11:00:00.000Z'),
      deletedAt: null,
      author: badgeKarim,
      attachable: { id: 122, attachments: [] }
    },
    {
      id: 4,
      commentableId: 200,
      attachableId: 123,
      authorId: badgeRitu.id,
      text: 'Scheduled second visit for end of month.',
      createdAt: new Date('2026-06-28T09:15:00.000Z'),
      updatedAt: new Date('2026-06-28T09:15:00.000Z'),
      deletedAt: null,
      author: badgeRitu,
      attachable: { id: 123, attachments: [] }
    }
  ] as unknown as TComment[]
}

export function getLeadDetailFixture(id: string): TLeadDetailData | null {
  const sid = id.startsWith('RL-') ? id : 'RL-00042'
  if (sid !== 'RL-00042' && id !== '42') {
    return null
  }

  const lead = buildLeadFixture(sid)
  const followUps = buildFollowUps(lead.id)
  const visits = buildVisits(lead.id)
  const comments = buildComments()
  const attachments = lead.attachable?.attachments ?? []

  return {
    lead,
    followUps: paginated(followUps),
    visits: paginated(visits),
    comments: paginated(comments),
    attachments: [...attachments],
    properties: paginated([])
  } as unknown as TLeadDetailData
}
