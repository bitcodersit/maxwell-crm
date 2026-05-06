<script setup lang="ts">
import type {
  TField,
  TFilter,
  TColumn,
  TGetActions,
  TBaseCrudModal,
} from '@/components/base/BaseCrud.vue'

const crudRef = useTemplateRef('crudRef')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const { getAttachment } = useGetAttachment()
const userFilterLabelProps = {
  getLabel(v: { name?: string; avatarId?: number }) {
    return h('div', { class: 'flex items-center gap-2' }, [
      h(UAvatar, {
        size: '2xs',
        src: getAttachment(v?.avatarId),
        alt: v?.name,
      }),
      h('span', v?.name || '—'),
    ])
  },
}

const fields: TField[] = [
  {
    name: 'name',
    type: 'input',
    label: 'Name',
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Description',
  },
]

const columns = computed<TColumn<TTeam>[]>(() => [
  {
    id: 'select',
    size: 48,
  },
  {
    accessorKey: 'id',
    header: 'ID',
    pinned: 'left',
    sortBy: 'id',
    size: 48,
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
            fallback: 'text-xs',
          },
        }),
        h('div', row.original.name),
      ]),
  },
  {
    accessorKey: 'members',
    header: 'Members',
    display: {
      type: 'array',
      slice: 3,
      class: 'flex flex-wrap -ml-1 -mt-1',
    },
    cell({ row, ...ctx }) {
      if (!row.original.members?.length) return '—'
      return row.original.members
        .map((member) => ({
          id: member.user?.id,
          name: member.user?.name,
          avatarId: member.user?.avatarId,
          role: member.role,
        }))
        .filter((member) => member.name)
        .map((member) => {
          const modal = (ctx as any).modal
          return h(
            UBadge,
            {
              size: modal ? 'lg' : 'md',
              class: modal ? 'ml-1 mt-1 rounded-full' : 'mr-1 rounded-full',
              color: 'neutral',
              variant: 'subtle',
              ui: {
                base: 'rounded-full',
              },
            },
            () =>
              h('div', { class: 'flex items-center gap-1' }, [
                h(UAvatar, {
                  size: '2xs',
                  src: getAttachment(member.avatarId),
                  alt: member.name,
                  class: 'bg-primary/20',
                }),
                h('span', `${member.name} (${member.role[0]})`),
              ])
          )
        })
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    sortBy: 'description',
    display: {
      type: 'text',
      class: 'w-64',
      length: 40,
    },
    cell({ row }) {
      return row.original.description || '—'
    },
  },
  {
    accessorKey: 'creator',
    header: 'Creator',
    sortBy: 'creatorId',
    cell: ({ row }) => {
      const creator = row.original.creator
      if (!creator) return '—'
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UAvatar, {
          size: 'sm',
          src: getAttachment(creator.avatarId),
          alt: creator.name,
        }),
        h('div', creator.name),
      ])
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    sortBy: 'createdAt',
    cell: ({ row }) => $dfc(row.original.createdAt),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    sortBy: 'updatedAt',
    cell: ({ row }) => $dfc(row.original.updatedAt),
  },
  {
    id: 'action',
    pinned: 'right',
  },
])

const filters: TFilter[] = [
  {
    name: 'id',
    type: 'input',
    props: {
      label: 'ID',
      placeholder: 'eg 1 or 1,2,3 or 1-10',
    },
  },
  {
    name: 'name',
    type: 'input',
    props: {
      label: 'Name',
      placeholder: 'Search by team name',
      modeable: true,
    },
  },
  {
    name: 'description',
    type: 'input',
    props: {
      label: 'Description',
      placeholder: 'Search by description',
      modeable: true,
    },
  },
  {
    name: 'memberUserIds',
    type: 'checkbox-api',
    props: {
      label: 'Members',
      api: '/api/users',
      query: {
        options: true,
        memberOfTeam: true,
      },
      ...userFilterLabelProps,
    },
  },
  {
    name: 'creatorId',
    type: 'checkbox-api',
    props: {
      label: 'Creators',
      api: '/api/users',
      query: {
        options: true,
        creatorOfTeam: true,
      },
      ...userFilterLabelProps,
    },
  },
  {
    name: 'createdAt',
    type: 'date',
    props: {
      label: 'Created',
    },
  },
  {
    name: 'updatedAt',
    type: 'date',
    props: {
      label: 'Updated',
    },
  },
]

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New Team' : 'Update Team',
    description: mode === 'create' ? 'Add a new team to the system' : 'Update the team',
  }),
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
              content: 'max-w-2xl',
            },
          },
        })
      },
    },
    {
      ...actions.update,
      onSelect() {
        crudRef.value?.onUpdate(item)
      },
    },
  ].filter((action: any) => !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(item)
      },
    },
  ],
]

const getFormState = (v?: TTeam) => ({
  id: v?.id,
  name: v?.name ?? '',
  description: v?.description ?? '',
})

const getPostBody = (v: Record<string, any>) => ({
  id: v.id,
  name: v.name,
  description: v.description,
})
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/teams"
    post-url="/api/teams"
    delete-url="/api/teams/{id}"
    :fields="fields"
    :columns="columns"
    :filters="filters"
    :modal="modal"
    :date-fields="['createdAt', 'updatedAt']"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
  />
</template>
