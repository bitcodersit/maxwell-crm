<script setup lang="ts">
import type {
  TField,
  TFilter,
  TColumn,
  TGetActions,
  TBaseCrudModal
} from '@/components/base/BaseCrud.vue'
import { TeamMemberRole } from '~~/prisma/client/enums'

const crudRef = useTemplateRef('crudRef')

const UIcon = resolveComponent('UIcon')
const UAvatar = resolveComponent('UAvatar')

const { getAttachment } = useGetAttachment()
const userFilterLabelProps = {
  getLabel(v: { name?: string; avatar?: TAttachment }) {
    return h('div', { class: 'flex items-center gap-2' }, [
      h(UAvatar, {
        size: '2xs',
        src: getAttachment(v?.avatar?.path),
        alt: v?.name
      }),
      h('span', v?.name || '—')
    ])
  }
}

const fields: TField[] = [
  {
    name: 'name',
    type: 'input',
    label: 'Name',
    props: {
      placeholder: 'Enter name...'
    }
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Description',
    props: {
      placeholder: 'Enter description...'
    }
  },
  {
    name: 'members',
    type: 'team-members',
    label: 'Members',
    props: {
      placeholder: 'Search users...',
      fields: [
        {
          name: 'role',
          type: 'select',
          props: {
            class: 'w-24',
            variant: 'soft',
            highlight: false,
            trailingIcon: false,
            placeholder: 'Select role...',
            items: [
              { label: 'Leader', value: TeamMemberRole.LEADER },
              { label: 'Member', value: TeamMemberRole.MEMBER }
            ]
          }
        }
      ]
    }
  }
]

const getUsersCell = useUsersCell()
const columns = computed<TColumn<TTeam>[]>(() => [
  {
    id: 'select',
    size: 48
  },
  {
    accessorKey: 'id',
    header: 'ID',
    pinned: 'left',
    sortBy: 'id',
    size: 48
  },
  {
    accessorKey: 'name',
    header: 'Name',
    sortBy: 'name',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h(UAvatar, {
          size: 'sm',
          alt: row.original.name,
          ui: {
            fallback: 'text-xs'
          }
        }),
        h('div', row.original.name)
      ])
  },
  {
    accessorKey: 'members',
    header: 'Members',
    display: {
      type: 'array',
      slice: 3,
      class: 'flex flex-wrap -ml-1 -mt-1'
    },
    cell({ row, ...ctx }) {
      if (!row.original.members?.length) return '—'
      return getUsersCell(
        (row.original.members || [])
          .filter(v => !!v.user)
          .map(v => {
            return {
              name: v.user?.name ?? '',
              avatarId: v.user?.avatarId ?? null,
              role: v.role
            }
          }),
        {
          modal: (ctx as any).modal,
          right: v => {
            return v.role === TeamMemberRole.LEADER
              ? h(UIcon, { name: 'i-lucide-star', class: 'text-warning' })
              : null
          }
        }
      )
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
    sortBy: 'description',
    display: {
      type: 'text',
      class: 'w-64',
      length: 40
    },
    cell({ row }) {
      return row.original.description || '—'
    }
  },
  {
    accessorKey: 'creator',
    header: 'Creator',
    sortBy: 'creatorId',
    cell: ({ row }) => row.original.creator?.name || '—'
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    sortBy: 'createdAt',
    cell: ({ row }) => $dfc(row.original.createdAt)
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    sortBy: 'updatedAt',
    cell: ({ row }) => $dfc(row.original.updatedAt)
  },
  {
    id: 'action',
    pinned: 'right'
  }
])

const filters: TFilter[] = [
  {
    name: 'q',
    type: 'inline-input',
    props: {
      placeholder: 'Search...'
    }
  },
  {
    name: 'id',
    type: 'input',
    props: {
      label: 'ID',
      placeholder: 'eg 1 or 1,2,3 or 1-10'
    }
  },
  // {
  //   name: 'name',
  //   type: 'input',
  //   props: {
  //     label: 'Name',
  //     placeholder: 'Search by team name',
  //     modeable: true
  //   }
  // },
  // {
  //   name: 'description',
  //   type: 'input',
  //   props: {
  //     label: 'Description',
  //     placeholder: 'Search by description',
  //     modeable: true
  //   }
  // },
  {
    name: 'memberUserIds',
    type: 'checkbox-api',
    props: {
      label: 'Members',
      api: '/api/users',
      query: {
        options: true,
        memberOfTeam: true
      },
      ...userFilterLabelProps
    }
  },
  {
    name: 'creatorId',
    type: 'checkbox-api',
    props: {
      label: 'Creators',
      api: '/api/users',
      query: {
        options: true,
        isCreatorOfTeam: true
      },
      ...userFilterLabelProps
    }
  },
  {
    name: 'createdAt',
    type: 'date',
    props: {
      label: 'Created'
    }
  },
  {
    name: 'updatedAt',
    type: 'date',
    props: {
      label: 'Updated'
    }
  }
]

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New Team' : 'Update Team',
    description: mode === 'create' ? 'Add a new team to the system' : 'Update the team'
  })
}

const getActions: TGetActions<TTeam> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        crudRef.value?.onView(item, {
          modal: {
            ui: {
              content: 'max-w-2xl'
            }
          }
        })
      }
    },
    {
      ...actions.update,
      onSelect() {
        crudRef.value?.onUpdate(item)
      }
    }
  ].filter((action: any) => !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(item)
      }
    }
  ]
]

const getFormState = (v?: TTeam) => ({
  id: v?.id,
  name: v?.name ?? '',
  description: v?.description ?? '',
  members:
    v?.members?.map(m => ({
      userId: m.userId || m.user?.id,
      role: m.role,
      user: m.user
        ? {
            id: m.user.id,
            name: m.user.name,
            avatarId: m.user.avatarId
          }
        : undefined
    })) ?? []
})

const getPostBody = (v: Record<string, any>) => ({
  id: v.id,
  name: v.name,
  description: v.description,
  members: (v.members || []).map((m: any) => ({
    userId: m.userId || v.user?.id,
    role: m.role
  }))
})
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/teams"
    post-url="/api/teams"
    export-url="/api/teams/export"
    delete-url="/api/teams/{id}"
    :fields="fields"
    :columns="columns"
    :filters="filters"
    :modal="modal"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
  />
</template>
