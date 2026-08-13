<script setup lang="ts">
import type {
  TBaseCrudImport,
  TBaseCrudModal,
  TColumn,
  TField,
  TFilter,
  TGetActions
} from '@/components/base/BaseCrud.vue'

const props = defineProps<{
  trashed?: boolean
}>()

const crudRef = useTemplateRef('crudRef')
const UAvatar = resolveComponent('UAvatar')

const { user } = useCurrentUser()
const { hCopy } = useHCopy()
const { getAttachment } = useGetAttachment()

const canManageTrash = computed(() => !!props.trashed && !!user.value?.deleteAnyUsers)

const getCustomerAddressLine1 = (item?: TUser) =>
  ((item as { addressable?: { addresses?: { addressLine1?: string }[] } })?.addressable
    ?.addresses?.[0]?.addressLine1 as string | undefined) || ''

const fields: TField[] = [
  {
    name: 'name',
    type: 'input',
    label: 'Name',
    col: 'col-span-2'
  },
  {
    name: 'phone',
    type: 'input',
    label: 'Phone'
  },
  {
    name: 'email',
    type: 'input',
    label: 'Email (optional)',
    props: {
      type: 'email'
    }
  },
  {
    name: 'company',
    type: 'input',
    label: 'Company'
  },
  {
    name: 'designation',
    type: 'input',
    label: 'Designation'
  },
  {
    name: 'addressLine1',
    type: 'textarea',
    label: 'Address',
    col: 'col-span-2'
  }
]

const columns = computed<TColumn<TUser>[]>(() => [
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
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UAvatar, {
          size: 'sm',
          src: getAttachment(row.original.avatar?.path),
          alt: row.original.name,
          ui: {
            fallback: 'text-xs'
          }
        }),
        h('div', {}, row.original.name)
      ])
    }
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    sortBy: 'phone',
    cell({ row }) {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', row.original.phone || '—'),
        hCopy(row.original.phone)
      ])
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
    sortBy: 'email',
    cell({ row }) {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', row.original.email || '—'),
        hCopy(row.original.email)
      ])
    }
  },
  {
    accessorKey: 'organization',
    header: 'Company',
    sortBy: 'organization',
    cell: ({ row }) => row.original.organization || '—'
  },
  {
    accessorKey: 'designation',
    header: 'Designation',
    sortBy: 'designation',
    cell: ({ row }) => row.original.designation || '—'
  },
  {
    accessorKey: 'addressLine1',
    header: 'Address',
    cell: ({ row }) => getCustomerAddressLine1(row.original) || '—'
  },
  {
    accessorKey: 'creator',
    header: 'Creator',
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
  ...(props.trashed
    ? [
        {
          accessorKey: 'deletedAt',
          header: 'Deleted',
          sortBy: 'deletedAt',
          cell: ({ row }: { row: { original: TUser } }) => $dfc(row.original.deletedAt)
        } satisfies TColumn<TUser>
      ]
    : []),
  {
    id: 'action',
    pinned: 'right'
  }
])

const filters = computed<TFilter[]>(() => [
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
  {
    name: 'email',
    type: 'input',
    props: {
      label: 'Email',
      placeholder: 'Search by email',
      modeable: true
    }
  },
  {
    name: 'phone',
    type: 'input',
    props: {
      label: 'Phone',
      placeholder: 'Search by phone',
      modeable: true
    }
  },
  {
    name: 'company',
    type: 'input',
    props: {
      label: 'Company',
      placeholder: 'Search by company',
      modeable: true
    }
  },
  {
    name: 'designation',
    type: 'input',
    props: {
      label: 'Designation',
      placeholder: 'Search by designation',
      modeable: true
    }
  },
  {
    name: 'addressLine1',
    type: 'input',
    props: {
      label: 'Address',
      placeholder: 'Search by address',
      modeable: true
    }
  },
  ...(props.trashed
    ? [
        {
          name: 'deletedAt',
          type: 'date' as const,
          props: {
            label: 'Deleted'
          }
        } satisfies TFilter
      ]
    : []),
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
])

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New Customer' : 'Update Customer',
    description: mode === 'create' ? 'Create a customer profile' : 'Update customer details'
  })
}

const getActions: TGetActions<TUser> = (item, v) => {
  const viewGroup = [
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
    ...(props.trashed
      ? []
      : [
          {
            ...actions.update,
            onSelect() {
              crudRef.value?.onUpdate(item)
            }
          }
        ])
  ].filter(action => !('hidden' in action) || !action.hidden)

  const restoreGroup =
    props.trashed && canManageTrash.value
      ? [
          {
            ...actions.restore,
            onSelect() {
              crudRef.value?.onRestore(item)
            }
          }
        ]
      : []

  const dangerGroup = props.trashed
    ? canManageTrash.value
      ? [
          {
            ...actions.deleteForever,
            onSelect() {
              crudRef.value?.onDelete(item)
            }
          }
        ]
      : []
    : [
        {
          ...actions.delete,
          onSelect() {
            crudRef.value?.onDelete(item)
          }
        }
      ]

  return [viewGroup, restoreGroup, dangerGroup].filter(group => group.length)
}

const getFormState = (v?: TUser) => ({
  id: v?.id,
  name: v?.name ?? '',
  email: v?.email ?? '',
  phone: v?.phone ?? '',
  company: v?.organization ?? '',
  designation: v?.designation ?? '',
  addressLine1: getCustomerAddressLine1(v)
})

const getPostBody = (v: Record<string, unknown>) => ({
  id: v.id,
  name: v.name,
  email: typeof v.email === 'string' && v.email.trim() ? v.email.trim() : null,
  phone: typeof v.phone === 'string' && v.phone.trim() ? v.phone.trim() : undefined,
  company: typeof v.company === 'string' && v.company.trim() ? v.company.trim() : null,
  designation:
    typeof v.designation === 'string' && v.designation.trim() ? v.designation.trim() : null,
  addressLine1:
    typeof v.addressLine1 === 'string' && v.addressLine1.trim() ? v.addressLine1.trim() : null
})

const importConfig: TBaseCrudImport = {
  importUrl: '/api/customers/import',
  exampleUrl: '/api/customers/import/example',
  title: 'Bulk Import Customers',
  description: 'Upload a CSV or Excel file to create multiple customers at once',
  entityLabel: 'customer',
  dropzoneDescription: 'CSV or Excel (.xlsx, .xls) — one customer per row',
  failedColumns: [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' }
  ]
}

const dateFields = computed(() =>
  props.trashed ? ['createdAt', 'updatedAt', 'deletedAt'] : ['createdAt', 'updatedAt']
)

const initialQuery = computed(() =>
  props.trashed
    ? {
        orderBy: {
          deletedAt: 'desc' as const
        }
      }
    : undefined
)
</script>

<template>
  <BaseCrud
    ref="crudRef"
    :get-url="trashed ? '/api/trash/customers' : '/api/customers'"
    :post-url="trashed ? undefined : '/api/customers'"
    :export-url="trashed ? undefined : '/api/customers/export'"
    :delete-url="
      trashed ? (canManageTrash ? '/api/trash/customers/{id}' : undefined) : '/api/customers/{id}'
    "
    :restore-url="canManageTrash ? '/api/trash/customers/{id}/restore' : undefined"
    :permanent-delete="trashed"
    :show-add-button="!trashed"
    :modal="trashed ? undefined : modal"
    :fields="trashed ? [] : fields"
    :filters="filters"
    :columns="columns"
    :date-fields="dateFields"
    :initial-query="initialQuery"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
    :import-config="trashed ? undefined : importConfig"
  />
</template>
