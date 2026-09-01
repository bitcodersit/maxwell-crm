<script setup lang="ts">
import type {
  TBaseCrudImport,
  TBaseCrudModal,
  TColumn,
  TField,
  TFilter,
  TGetActions
} from '@/components/base/BaseCrud.vue'

definePageMeta({
  title: 'Conveyance Bills'
})

const crudRef = useTemplateRef('crudRef')
const toast = useToast()
const UBadge = resolveComponent('UBadge')
const { confirm } = useConfirm()
const { user } = useCurrentUser()

const canAssignEmployee = computed(
  () => !!(user.value?.createAnyBills || user.value?.createTeamBills)
)
const canReadUsers = computed(
  () => !!(user.value?.readAnyUsers || user.value?.readTeamUsers || user.value?.readOwnUsers)
)

const statusColorMap: Record<string, 'neutral' | 'success' | 'warning' | 'error'> = {
  New: 'neutral',
  Pending: 'warning',
  Approved: 'success',
  Cancelled: 'error',
  Rejected: 'error'
}

const formatCurrency = (amount: unknown) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2
  }).format(Number(amount || 0))
}

const toYmd = (value?: Date | string | null) => {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

const toDate = (value?: unknown) => {
  if (!value) return undefined
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date
}

const printBill = async (id: number) => {
  const blob = await $fetch<Blob>(`/api/bills/${id}/print`, {
    responseType: 'blob'
  })
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.src = url
  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      URL.revokeObjectURL(url)
      iframe.remove()
    }, 3000)
  }
  document.body.appendChild(iframe)
}

const downloadBillPdf = (id: number) => {
  window.open(`/api/bills/${id}/print?download=1`, '_blank')
}

type TWorkflowMeta = {
  canUpdate?: boolean
  canDelete?: boolean
  availableActions?: string[]
  availableTransitions?: Array<{
    event: string
    to: string
  }>
}

const getWorkflowMeta = (item: TBill): TWorkflowMeta => {
  return (item as any)?.workflow ?? {}
}

const canUpdateBill = (item: TBill) => {
  const workflowCanUpdate = getWorkflowMeta(item).canUpdate
  if (typeof workflowCanUpdate === 'boolean') return workflowCanUpdate
  const status = String(item.status || '')
  const isOwn = item.author?.id === user.value?.id || item.user?.id === user.value?.id
  if (status === 'New' || status === 'Cancelled') {
    return !!(
      isOwn &&
      (user.value?.updateAnyBills || user.value?.updateOwnBills || user.value?.updateTeamBills)
    )
  }
  const editable = ['Rejected'].includes(status)
  if (user.value?.updateAnyBills) return true
  if (user.value?.updateTeamBills && editable) return true
  return !!(isOwn && editable)
}

const canDeleteBill = (item: TBill) => {
  const workflowCanDelete = getWorkflowMeta(item).canDelete
  if (typeof workflowCanDelete === 'boolean') return workflowCanDelete
  const status = String(item.status || '')
  const isOwn = item.author?.id === user.value?.id || item.user?.id === user.value?.id
  if (status === 'New' || status === 'Cancelled') {
    return !!(
      isOwn &&
      (user.value?.deleteAnyBills || user.value?.deleteOwnBills || user.value?.deleteTeamBills)
    )
  }
  return !!user.value?.deleteAnyBills
}

const previewOpen = ref(false)
const previewBill = ref<TMaybe<TBill>>()

const onOpenPreview = (item: TBill) => {
  previewBill.value = item
  previewOpen.value = true
}

const approvalNames = (item: TBill) => {
  return (item.approvals || []).map(approval => approval.user?.name).filter(Boolean)
}

const statusModalOpen = ref(false)
const statusModalBill = ref<TMaybe<TBill>>()

const { data: transitions, refetch: refetchTransitions } = useQuery({
  enabled: computed(() => {
    return !!(
      (statusModalOpen.value && statusModalBill.value?.id) ||
      (previewOpen.value && previewBill.value?.id)
    )
  }),
  queryKey: computed(() => {
    const id = statusModalOpen.value ? statusModalBill.value?.id : previewBill.value?.id
    const status = statusModalOpen.value ? statusModalBill.value?.status : previewBill.value?.status
    return [`/api/bills/${id}/transitions`, status] as const
  }),
  initialData: () => [],
  queryFn: ({ queryKey: [url] }) => {
    return $fetch<Array<any>>(String(url))
  }
})

const onOpenStatusModal = (item: TBill) => {
  statusModalBill.value = item
  statusModalOpen.value = true
}

const statusModalTransitions = ref<any[]>([])
watch(
  [statusModalOpen, transitions],
  ([open, list]) => {
    if (open) statusModalTransitions.value = (list as any[]) || []
  },
  { immediate: true }
)

const refreshPreviewBill = async (id?: number) => {
  const billId = id ?? previewBill.value?.id
  if (!billId || !previewOpen.value) return
  if (previewBill.value?.id && previewBill.value.id !== billId) return
  const updated = await $fetch<TBill>(`/api/bills/${billId}`)
  previewBill.value = updated
  if (statusModalOpen.value && statusModalBill.value?.id === billId) statusModalBill.value = updated
  refetchTransitions()
}

const onFormSuccess = async (_item: unknown, mode: 'create' | 'update') => {
  if (mode !== 'update') return
  await refreshPreviewBill()
}

const applyBillTransition = async (id: number, transition: any) => {
  const isRevokeLeader = transition.name === 'revokeLeader'
  confirm({
    title: isRevokeLeader ? 'Cancel approval' : 'Change Status',
    description: isRevokeLeader
      ? `Remove your approval from bill #${id}? The bill will stay pending.`
      : `Change status for bill #${id} to ${transition.to}?`,
    onConfirm: async () => {
      return $fetch(`/api/bills/${id}/transitions`, {
        method: 'POST',
        body: {
          transition: transition.name
        }
      }).then(async () => {
        statusModalOpen.value = false
        crudRef.value?.refetch()
        await refreshPreviewBill(id)
      })
    }
  })
}

const onChangeStatusFromModal = async (transition: any) => {
  const id = statusModalBill.value?.id || previewBill.value?.id
  if (!id) return
  return applyBillTransition(id, transition)
}

const fields = computed<TField[]>(() => [
  {
    name: 'userId',
    type: 'select-menu',
    label: 'Employee',
    hidden: !canAssignEmployee.value,
    props: {
      api: '/api/users',
      query: {
        options: true
      },
      placeholder: 'Select employee'
    }
  },
  {
    name: 'typeId',
    type: 'select-menu',
    label: 'Bill Type',
    props: {
      api: '/api/options',
      query: {
        type: 'BILL_TYPE'
      },
      placeholder: 'Select bill type'
    }
  },
  {
    name: 'date',
    type: 'date',
    label: 'Bill Date',
    props: {
      placeholder: 'Pick a date'
    }
  },
  {
    name: 'amount',
    type: 'input',
    label: 'Amount',
    props: {
      type: 'number',
      step: 0.01,
      min: 0,
      placeholder: '0.00'
    }
  },
  {
    name: 'purpose',
    type: 'textarea',
    label: 'Purpose',
    props: {
      rows: 4,
      placeholder: 'What was this conveyance bill for?'
    }
  }
])

const columns = computed<TColumn<TBill>[]>(() => [
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
    accessorKey: 'date',
    header: 'Date',
    sortBy: 'date',
    cell: ({ row }) => $dfc(row.original.date)
  },
  {
    accessorKey: 'user',
    header: 'Employee',
    sortBy: 'userId',
    cell: ({ row }) => row.original.user?.name || '—'
  },
  {
    accessorKey: 'type',
    header: 'Type',
    sortBy: 'typeId',
    cell: ({ row }) => row.original.type?.name || '—'
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    sortBy: 'amount',
    cell: ({ row }) => formatCurrency(row.original.amount)
  },
  {
    accessorKey: 'status',
    header: 'Status',
    sortBy: 'status',
    cell: ({ row }) =>
      h(
        'div',
        {
          class: 'w-fit',
          'data-stop-row-click': ''
        },
        [
          h(UBadge, {
            label: row.original.status,
            color: statusColorMap[row.original.status] || 'neutral',
            variant: 'soft',
            class: 'cursor-pointer w-fit',
            onClick: ((e: Event) => {
              e.stopPropagation()
              onOpenStatusModal(row.original)
            }) as any
          })
        ]
      )
  },
  {
    accessorKey: 'approvals',
    header: 'Approved By',
    cell: ({ row }) => {
      const names = approvalNames(row.original)
      return names.length ? names.join(', ') : '—'
    }
  },
  {
    accessorKey: 'author',
    header: 'Created By',
    sortBy: 'authorId',
    cell: ({ row }) => row.original.author?.name || '—'
  },
  {
    accessorKey: 'purpose',
    header: 'Purpose',
    display: {
      type: 'text',
      class: 'w-72',
      length: 50
    },
    cell: ({ row }) => row.original.purpose || '—'
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

const filters = computed<TFilter[]>(() => [
  {
    name: 'status',
    type: 'tabs',
    props: {
      api: '/api/enums',
      query: {
        type: 'BillStatus'
      }
    }
  },
  ...(canReadUsers.value
    ? ([
        {
          name: 'userId',
          type: 'checkbox-api',
          props: {
            label: 'User',
            api: '/api/users',
            query: {
              options: true
            }
          }
        }
      ] as TFilter[])
    : []),
  {
    name: 'typeId',
    type: 'checkbox-api',
    props: {
      label: 'Type',
      api: '/api/options',
      query: {
        type: 'BILL_TYPE'
      }
    }
  },
  {
    name: 'date',
    type: 'date',
    props: {
      label: 'Date'
    }
  }
])

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New Conveyance Bill' : 'Update Conveyance Bill',
    description:
      mode === 'create' ? 'Create a conveyance bill entry' : 'Update conveyance bill details',
    ui: {
      content: 'max-w-lg'
    }
  })
}

const getActions: TGetActions<TBill> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        onOpenPreview(item)
      }
    },
    {
      ...actions.update,
      hidden: !canUpdateBill(item),
      onSelect() {
        crudRef.value?.onUpdate(item)
      }
    },
    {
      label: 'Change Status',
      icon: 'i-lucide-repeat',
      onSelect() {
        onOpenStatusModal(item)
      }
    },
    {
      label: 'Print PDF',
      icon: 'i-lucide-printer',
      async onSelect() {
        try {
          await printBill(item.id)
        } catch (error) {
          const { message } = parseError(error)
          toast.add({
            color: 'error',
            title: 'Failed to print bill',
            description: message
          })
        }
      }
    },
    {
      label: 'Download PDF',
      icon: 'i-lucide-download',
      onSelect() {
        downloadBillPdf(item.id)
      }
    }
  ].filter((action: any) => !action.hidden),
  [
    {
      ...actions.delete,
      hidden: !canDeleteBill(item),
      onSelect() {
        crudRef.value?.onDelete(item)
      }
    }
  ].filter((action: any) => !action.hidden)
]

const previewActions = computed(() => {
  if (!previewBill.value) return []
  return getActions(previewBill.value, { view: true })
    .flat()
    .filter(action => action.label !== 'Change Status')
})

const getFormState = (v?: TBill) => ({
  id: v?.id,
  userId: canAssignEmployee.value ? v?.user : user.value,
  typeId: v?.type,
  date: toYmd(v?.date || new Date()),
  amount: v?.amount != null ? Number(v.amount) : undefined,
  purpose: v?.purpose ?? ''
})

const getPostBody = (v: Record<string, any>) => ({
  id: v.id,
  userId: canAssignEmployee.value ? v.userId?.id : user.value.id,
  typeId: v.typeId?.id,
  date: toDate(v.date),
  amount: Number(v.amount || 0),
  purpose: typeof v.purpose === 'string' && v.purpose.trim() ? v.purpose.trim() : null
})

const importConfig: TBaseCrudImport = {
  importUrl: '/api/bills/import',
  exampleUrl: '/api/bills/import/example',
  title: 'Bulk Import Conveyance Bills',
  description: 'Upload a CSV or Excel file. Identify each employee by userId or email.',
  entityLabel: 'bill',
  dropzoneDescription: 'CSV or Excel (.xlsx, .xls) — employee via userId or email',
  failedColumns: [
    { key: 'userId', label: 'User ID' },
    { key: 'email', label: 'Email' },
    { key: 'type', label: 'Type' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' }
  ]
}
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/bills"
    post-url="/api/bills"
    export-url="/api/bills/export"
    delete-url="/api/bills/{id}"
    :modal="modal"
    :fields="fields"
    :filters="filters"
    :columns="columns"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
    :import-config="importConfig"
    :on-row-click="onOpenPreview"
    :on-form-success="onFormSuccess"
  />

  <BillPreviewSlideover
    v-model:open="previewOpen"
    :bill="previewBill"
    :actions="previewActions"
    :transitions="transitions"
    @transition="onChangeStatusFromModal"
  />

  <UModal
    v-model:open="statusModalOpen"
    title="Apply Bill Transition"
    :description="
      statusModalBill
        ? `Please choose a transition to change the status. If no transition is available, the status is not changeable.`
        : ''
    "
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UButton
          v-for="transition in statusModalTransitions"
          :key="transition.name"
          :color="transition.meta?.color || 'neutral'"
          block
          size="xl"
          variant="soft"
          class="justify-center text-base font-semibold py-4"
          @click="onChangeStatusFromModal(transition)"
        >
          <div class="text-center">
            <div>{{ transition.meta?.title || transition.name }}</div>
            <div
              v-if="transition.meta?.description"
              class="text-xs opacity-70 mt-1"
            >
              {{ transition.meta.description }}
            </div>
          </div>
        </UButton>
      </div>
      <p
        v-if="!statusModalTransitions.length"
        class="text-sm text-muted text-center py-6"
      >
        No transitions available for current status.
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          @click="
            () => {
              statusModalOpen = false
            }
          "
        >
          Close
        </UButton>
      </div>
    </template>
  </UModal>
</template>
