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

const updateBillStatus = async (
  item: TBill,
  action: 'submit' | 'approve' | 'reject' | 'cancel',
  confirmMessage: string
) => {
  if (!(await confirm(confirmMessage))) return
  const actionLabelMap: Record<typeof action, string> = {
    submit: 'submitted',
    approve: 'approved',
    reject: 'rejected',
    cancel: 'cancelled'
  }
  try {
    await $fetch(`/api/bills/${item.id}/status`, {
      method: 'POST',
      body: {
        action
      }
    })
    toast.add({
      color: 'success',
      title: 'Status updated',
      description: `Bill #${item.id} has been ${actionLabelMap[action]} successfully`
    })
    await crudRef.value?.refetch()
  } catch (error) {
    const { message } = parseError(error)
    toast.add({
      color: 'error',
      title: 'Status update failed',
      description: message
    })
  }
}

const canUpdateBill = (item: TBill) => {
  const status = String(item.status || '')
  if (isAdmin.value) return true
  return item.author?.id === user.value?.id && ['New', 'Cancelled', 'Rejected'].includes(status)
}

const canDeleteBill = (item: TBill) => {
  const status = String(item.status || '')
  if (isAdmin.value) return true
  return item.author?.id === user.value?.id && ['New', 'Cancelled'].includes(status)
}

const canSubmitBill = (item: TBill) => {
  const status = String(item.status || '')
  if (isAdmin.value) return true
  return item.author?.id === user.value?.id && ['New', 'Rejected'].includes(status)
}

const canCancelBill = (item: TBill) => {
  const status = String(item.status || '')
  if (isAdmin.value) return true
  return item.author?.id === user.value?.id && status === 'Pending'
}

const canApproveOrRejectBill = (item: TBill) => {
  return isAdmin.value && String(item.status || '') === 'Pending'
}

const fields: TField[] = [
  {
    name: 'userId',
    type: 'select-menu',
    label: 'Employee',
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
]

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
        variant: 'soft'
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
  {
    name: 'q',
    type: 'inline-input',
    props: {
      placeholder: 'Search purpose...'
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
    name: 'userId',
    type: 'checkbox-api',
    props: {
      label: 'Employee',
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
      label: 'Bill Type',
      api: '/api/options',
      query: {
        type: 'BILL_TYPE'
      }
    }
  },
  {
    name: 'status',
    type: 'checkbox-api',
    props: {
      label: 'Status',
      api: '/api/bills/statuses',
      query: {
        options: true
      }
    }
  },
  {
    name: 'date',
    type: 'date',
    props: {
      label: 'Bill Date'
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
      label: 'Submit',
      icon: 'i-lucide-send',
      hidden: !canSubmitBill(item),
      async onSelect() {
        await updateBillStatus(item, 'submit', `Submit bill #${item.id} for admin approval?`)
      }
    },
    {
      label: 'Approve',
      icon: 'i-lucide-check-check',
      hidden: !canApproveOrRejectBill(item),
      async onSelect() {
        await updateBillStatus(item, 'approve', `Approve bill #${item.id}?`)
      }
    },
    {
      label: 'Reject',
      icon: 'i-lucide-x-circle',
      hidden: !canApproveOrRejectBill(item),
      async onSelect() {
        await updateBillStatus(item, 'reject', `Reject bill #${item.id}?`)
      }
    },
    {
      label: 'Cancel',
      icon: 'i-lucide-ban',
      hidden: !canCancelBill(item),
      async onSelect() {
        await updateBillStatus(item, 'cancel', `Cancel bill #${item.id}?`)
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
  userId: v?.user,
  typeId: v?.type,
  date: toYmd(v?.date || new Date()),
  amount: v?.amount != null ? Number(v.amount) : undefined,
  purpose: v?.purpose ?? ''
})

const getPostBody = (v: Record<string, any>) => ({
  id: v.id,
  userId: v.userId?.id,
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
</template>
