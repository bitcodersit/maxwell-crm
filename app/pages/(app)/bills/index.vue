<script setup lang="ts">
import type {
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

const isAdmin = computed(() => !!user.value?.updateAnyBills)

const statusColorMap: Record<string, 'neutral' | 'success' | 'warning' | 'error'> = {
  New: 'neutral',
  Pending: 'warning',
  Approved: 'success',
  Cancelled: 'neutral',
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
  return (
    isAdmin.value ||
    (item.author?.id === user.value?.id && ['New', 'Cancelled', 'Rejected'].includes(status))
  )
}

const canDeleteBill = (item: TBill) => {
  const workflowCanDelete = getWorkflowMeta(item).canDelete
  if (typeof workflowCanDelete === 'boolean') return workflowCanDelete
  const status = String(item.status || '')
  return (
    isAdmin.value || (item.author?.id === user.value?.id && ['New', 'Cancelled'].includes(status))
  )
}

const statusModalOpen = ref(false)
const statusModalBill = ref<TMaybe<TBill>>()

const { data: transitions } = useQuery({
  enabled: computed(() => {
    return statusModalOpen.value && !!statusModalBill.value?.id
  }),
  queryKey: computed(() => {
    return [`/api/bills/${statusModalBill.value?.id}/transitions`] as const
  }),
  initialData: () => [],
  queryFn: ({ queryKey: [url] }) => {
    return $fetch<Array<any>>(url)
  }
})

const onOpenStatusModal = (item: TBill) => {
  statusModalBill.value = item
  statusModalOpen.value = true
}

const onChangeStatusFromModal = async (transition: any) => {
  const id = statusModalBill.value?.id
  if (!id) return
  confirm({
    title: 'Change Status',
    description: `Change status for bill #${id} to ${transition.to}?`,
    onConfirm: async () => {
      return $fetch(`/api/bills/${id}/transitions`, {
        method: 'POST',
        body: {
          transition: transition.name
        }
      }).then(() => {
        statusModalOpen.value = false
        statusModalBill.value = null
        crudRef.value?.refetch()
      })
    }
  })
}

const fields = computed<TField[]>(() => [
  {
    name: 'userId',
    type: 'select-menu',
    label: 'Employee',
    hidden: !user.value.createAnyBills,
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
    type: 'input',
    label: 'Bill Date',
    props: {
      type: 'date'
    }
  },
  {
    name: 'amount',
    type: 'input',
    label: 'Amount',
    props: {
      type: 'number',
      step: 0.01,
      min: 0
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
      h(UBadge, {
        label: row.original.status,
        color: statusColorMap[row.original.status] || 'neutral',
        variant: 'soft',
        class: 'cursor-pointer',
        onClick: (() => {
          onOpenStatusModal(row.original)
        }) as any
      })
  },
  {
    accessorKey: 'reviewer',
    header: 'Reviewer',
    sortBy: 'reviewerId',
    cell: ({ row }) => row.original.reviewer?.name || '—'
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

const filters: TFilter[] = [
  // {
  //   name: 'q',
  //   type: 'inline-input',
  //   props: {
  //     placeholder: 'Search purpose...'
  //   }
  // },
  // {
  //   name: 'id',
  //   type: 'input',
  //   props: {
  //     label: 'ID',
  //     placeholder: 'eg 1 or 1,2,3 or 1-10'
  //   }
  // },
  // {
  //   name: 'status',
  //   type: 'checkbox-api',
  //   props: {
  //     label: 'Status',
  //     api: '/api/enums',
  //     query: {
  //       type: 'BillStatus'
  //     }
  //   }
  // },
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
  },
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
  // {
  //   name: 'createdAt',
  //   type: 'date',
  //   props: {
  //     label: 'Created'
  //   }
  // },
  // {
  //   name: 'updatedAt',
  //   type: 'date',
  //   props: {
  //     label: 'Updated'
  //   }
  // }
]

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New Conveyance Bill' : 'Update Conveyance Bill',
    description:
      mode === 'create' ? 'Create a conveyance bill entry' : 'Update conveyance bill details',
    ui: {
      content: 'max-w-2xl'
    }
  })
}

const getActions: TGetActions<TBill> = (item, v) => [
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

const getFormState = (v?: TBill) => ({
  id: v?.id,
  userId: user.value.createAnyBills ? v?.user?.id : user.value.id,
  typeId: v?.type,
  date: toYmd(v?.date || new Date()),
  amount: v?.amount != null ? Number(v.amount) : undefined,
  purpose: v?.purpose ?? ''
})

const getPostBody = (v: Record<string, any>) => ({
  id: v.id,
  userId: user.value.createAnyBills ? v.userId?.id : user.value.id,
  typeId: v.typeId?.id,
  date: toDate(v.date),
  amount: Number(v.amount || 0),
  purpose: typeof v.purpose === 'string' && v.purpose.trim() ? v.purpose.trim() : null
})
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
          v-for="transition in transitions"
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
        v-if="!transitions.length"
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
          @click="statusModalOpen = false"
        >
          Close
        </UButton>
      </div>
    </template>
  </UModal>
</template>
