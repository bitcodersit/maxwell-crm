<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  bill?: TMaybe<TBill>
  actions?: DropdownMenuItem[]
  transitions?: Array<{
    name: string
    to?: string
    meta?: {
      title?: string
      color?: string
      description?: string
    }
  }>
}>()

const emit = defineEmits<{
  transition: [transition: any]
}>()

const statusColorMap: Record<string, 'neutral' | 'success' | 'warning' | 'error'> = {
  New: 'neutral',
  Pending: 'warning',
  Approved: 'success',
  Cancelled: 'error',
  Rejected: 'error'
}

const formatCurrency = (amount?: unknown) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2
  }).format(Number(amount || 0))
}

const formatDate = (value?: Date | string | null) => {
  if (!value) return '—'
  return $dfc(value)
}

const stageLabel = (stage?: string) => {
  if (stage === 'Leader') return 'Team leader'
  if (stage === 'Accountant') return 'Accountant'
  if (stage === 'Admin') return 'Admin'
  if (stage === 'Reject') return 'Rejected'
  return stage || '—'
}

const approvalLines = computed(() => {
  return (props.bill?.approvals || []).map(approval => {
    const name = approval.user?.name || '—'
    if (approval.stage === 'Reject') return `Rejected by ${name}`
    return `${name} (${stageLabel(approval.stage)})`
  })
})
</script>

<template>
  <USlideover
    v-model:open="open"
    title="Conveyance Bill"
    :description="bill ? `Invoice CB-${bill.id}` : 'Bill details'"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <div
        v-if="bill"
        class="space-y-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-lg font-semibold">Maxwell CRM</div>
            <div class="text-sm text-muted">Conveyance Bill Invoice</div>
          </div>
          <div class="rounded-md border border-default px-3 py-2 text-sm min-w-36">
            <div class="flex justify-between gap-3">
              <span class="text-muted">Invoice #</span>
              <span class="font-medium">CB-{{ bill.id }}</span>
            </div>
            <div class="flex justify-between gap-3 mt-1">
              <span class="text-muted">Date</span>
              <span>{{ formatDate(bill.date) }}</span>
            </div>
            <div class="flex justify-between gap-3 mt-1 items-center">
              <span class="text-muted">Status</span>
              <UBadge
                :label="bill.status"
                :color="statusColorMap[bill.status] || 'neutral'"
                variant="soft"
                size="sm"
              />
            </div>
          </div>
        </div>

        <USeparator />

        <div>
          <div class="text-sm font-semibold mb-2">Employee details</div>
          <dl class="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt class="text-muted">Employee</dt>
            <dd>{{ bill.user?.name || '—' }}</dd>
            <dt class="text-muted">Prepared by</dt>
            <dd>{{ bill.author?.name || '—' }}</dd>
          </dl>
        </div>

        <div>
          <div class="text-sm font-semibold mb-2">Bill details</div>
          <dl class="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt class="text-muted">Type</dt>
            <dd>{{ bill.type?.name || '—' }}</dd>
            <dt class="text-muted">Bill date</dt>
            <dd>{{ formatDate(bill.date) }}</dd>
            <dt class="text-muted">Amount</dt>
            <dd>{{ formatCurrency(bill.amount) }}</dd>
          </dl>
        </div>

        <div class="rounded-md border border-default p-3">
          <div class="text-sm font-semibold mb-1">Purpose / Notes</div>
          <p class="text-sm whitespace-pre-wrap">{{ bill.purpose || '—' }}</p>
        </div>

        <div
          v-if="approvalLines.length"
          class="space-y-1"
        >
          <div class="text-sm font-semibold">Approved By</div>
          <p
            v-for="(line, index) in approvalLines"
            :key="index"
            class="text-sm text-muted"
          >
            {{ line }}
          </p>
        </div>

        <div class="flex justify-end">
          <div class="rounded-md bg-elevated px-4 py-3 min-w-44">
            <div class="text-xs text-muted">Total amount</div>
            <div class="text-lg font-semibold">{{ formatCurrency(bill.amount) }}</div>
          </div>
        </div>

        <div
          v-if="transitions?.length"
          class="space-y-2"
        >
          <div class="text-sm font-semibold">Change status</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <UButton
              v-for="transition in transitions"
              :key="transition.name"
              :color="(transition.meta?.color as any) || 'neutral'"
              block
              variant="soft"
              class="justify-center"
              @click="emit('transition', transition)"
            >
              <div class="text-center">
                <div>{{ transition.meta?.title || transition.name }}</div>
                <div
                  v-if="transition.meta?.description"
                  class="text-xs opacity-70 mt-1 font-normal"
                >
                  {{ transition.meta.description }}
                </div>
              </div>
            </UButton>
          </div>
        </div>
      </div>
      <p
        v-else
        class="text-sm text-muted text-center py-8"
      >
        Select a bill to preview.
      </p>
    </template>
    <template
      v-if="actions?.length"
      #footer
    >
      <div class="flex flex-wrap justify-end gap-2 w-full">
        <UButton
          v-for="action in actions"
          :key="action.label"
          size="sm"
          variant="subtle"
          v-bind="action"
          @click="action.onSelect"
        />
      </div>
    </template>
  </USlideover>
</template>
