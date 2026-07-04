<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { LeadStatus } from '~~/prisma/client/enums'

type TLeadFormState = {
  status: LeadStatus
  customerName: string
  customerPhone: string
  customerEmail: string
  source: unknown
  propertyTypeMain: unknown
  propertyTypeSub: unknown
  area: string
  block: string
  road: string
  addressLine1: string
  budgetMin: string
  budgetMax: string
  assignedUsers: Array<{ id: number; name?: string }>
  assignedTeams: Array<{ id: number; name?: string }>
}

const open = defineModel<boolean>('open', { default: false })
const model = defineModel<Partial<TLead>>({ default: () => ({}) })

const statuses = useLeadStatusItems()
const formRef = useTemplateRef('formRef')
const client = useQueryClient()

const newForm = (seed?: Partial<TLead>): TLeadFormState => ({
  status: seed?.status ?? LeadStatus.New,
  customerName: seed?.customer?.name ?? '',
  customerPhone: seed?.customer?.phone ?? '',
  customerEmail: seed?.customer?.email ?? '',
  source: seed?.source ?? null,
  propertyTypeMain: seed?.propertyTypeMain ?? null,
  propertyTypeSub: seed?.propertyTypeSub ?? null,
  area: seed?.address?.name ?? '',
  block: seed?.address?.block ?? '',
  road: seed?.address?.road ?? '',
  addressLine1: seed?.address?.addressLine1 ?? '',
  budgetMin: seed?.budgetMin != null ? String(seed.budgetMin) : '',
  budgetMax: seed?.budgetMax != null ? String(seed.budgetMax) : '',
  assignedUsers: (seed?.assignable?.users ?? [])
    .map(row => row.user)
    .filter((user): user is NonNullable<typeof user> => !!user),
  assignedTeams: (seed?.assignable?.teams ?? [])
    .map(row => row.team)
    .filter((team): team is NonNullable<typeof team> => !!team)
})

const form = ref<TLeadFormState>(newForm())

watch(open, isOpen => {
  if (isOpen) {
    form.value = newForm(model.value)
  }
})

function pickId(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = Number((value as { id: unknown }).id)
    return Number.isFinite(id) ? id : undefined
  }
  return undefined
}

function parseOptionalPositiveNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return n
}

function buildCustomerPayload(state: TLeadFormState) {
  const phone = state.customerPhone.trim()
  const email = state.customerEmail.trim()
  if (!phone && !email) return undefined

  return {
    name: state.customerName.trim() || undefined,
    phone: phone || undefined,
    email: email || undefined
  }
}

function buildAddressPayload(state: TLeadFormState) {
  const area = state.area.trim()
  const block = state.block.trim()
  const road = state.road.trim()
  const addressLine1 = state.addressLine1.trim()

  if (!area && !block && !road && !addressLine1) return undefined

  const line =
    addressLine1 || area || [block, road].filter(Boolean).join(', ').trim() || undefined
  if (!line) return undefined

  return {
    name: area || undefined,
    addressLine1: line,
    road: road || '',
    block: block || ''
  }
}

function buildCreatePayload(state: TLeadFormState) {
  const userIds = state.assignedUsers.map(user => user.id).filter(Boolean)
  const teamIds = state.assignedTeams.map(team => team.id).filter(Boolean)

  return {
    status: state.status,
    budgetMin: parseOptionalPositiveNumber(state.budgetMin),
    budgetMax: parseOptionalPositiveNumber(state.budgetMax),
    sourceId: pickId(state.source),
    propertyTypeMainId: pickId(state.propertyTypeMain),
    propertyTypeSubId: pickId(state.propertyTypeSub),
    userIds,
    teamIds,
    customer: buildCustomerPayload(state),
    address: buildAddressPayload(state)
  }
}

const { mutate, isPending } = useMutation({
  mutationFn: (body: ReturnType<typeof buildCreatePayload>) =>
    $fetch<TLead>('/api/leads', {
      method: 'POST',
      body
    })
})

const onSuccess = (lead: TLead) => {
  client.invalidateQueries({ queryKey: ['/api/leads'] })
  client.invalidateQueries({ queryKey: ['/api/boards/find'] })

  if (lead.boardItems?.[0]) {
    client.invalidateQueries({
      queryKey: [
        `/api/board-items`,
        {
          columnId: lead.boardItems[0].columnId
        }
      ]
    })
  }

  open.value = false
  form.value = newForm()
}

const onSubmit = (event: FormSubmitEvent<TLeadFormState>) => {
  mutate(buildCreatePayload(event.data), {
    onSuccess,
    onError(error) {
      const { message, errors } = parseError(error)
      if (errors?.length) formRef.value?.setErrors(errors)
      else {
        formRef.value?.setErrors([{ name: 'status', message }])
      }
    }
  })
}

const onCancel = () => {
  open.value = false
  form.value = newForm()
}

const fieldClass = 'w-full'
const fieldSize = 'lg' as const
</script>

<template>
  <UModal
    v-model:open="open"
    title="Add Lead"
    description="Create a new lead in the pipeline. All fields except status are optional."
    :ui="{ content: 'max-w-2xl w-full' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :state="form"
        :disabled="isPending"
        class="grid grid-cols-12 gap-4"
        @submit="onSubmit"
      >
        <UFormField
          name="status"
          label="Status"
          class="col-span-12 sm:col-span-6"
        >
          <USelect
            v-model="form.status"
            :items="statuses"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Select status"
          />
        </UFormField>

        <div class="col-span-12 pt-1">
          <p class="text-sm font-medium text-highlighted">
            Customer
          </p>
          <p class="text-xs text-muted">
            Optional contact details
          </p>
        </div>

        <UFormField
          name="customerName"
          label="Customer name"
          class="col-span-12 sm:col-span-6"
        >
          <UInput
            v-model="form.customerName"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Full name"
          />
        </UFormField>

        <UFormField
          name="customerPhone"
          label="Phone"
          class="col-span-12 sm:col-span-6"
        >
          <UInput
            v-model="form.customerPhone"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Phone number"
          />
        </UFormField>

        <UFormField
          name="customerEmail"
          label="Email"
          class="col-span-12"
        >
          <UInput
            v-model="form.customerEmail"
            type="email"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Email address"
          />
        </UFormField>

        <div class="col-span-12 pt-1">
          <p class="text-sm font-medium text-highlighted">
            Lead details
          </p>
        </div>

        <UFormField
          name="source"
          label="Source"
          class="col-span-12 sm:col-span-6"
        >
          <FormSelectMenu
            v-model="form.source"
            api="/api/options"
            :query="{ type: 'SOURCE' }"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Facebook, Website…"
            clear
          />
        </UFormField>

        <UFormField
          name="propertyTypeMain"
          label="Property type (main)"
          class="col-span-12 sm:col-span-6"
        >
          <FormSelectMenu
            v-model="form.propertyTypeMain"
            api="/api/options"
            :query="{ type: 'PROPERTY_TYPE_MAIN' }"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Land, Commercial plot…"
            clear
          />
        </UFormField>

        <UFormField
          name="propertyTypeSub"
          label="Property type (sub)"
          class="col-span-12 sm:col-span-6"
        >
          <FormSelectMenu
            v-model="form.propertyTypeSub"
            api="/api/options"
            :query="{ type: 'PROPERTY_TYPE_SUB' }"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Ready, Ongoing…"
            clear
          />
        </UFormField>

        <UFormField
          name="budgetMin"
          label="Budget min"
          class="col-span-12 sm:col-span-6"
        >
          <UInput
            v-model="form.budgetMin"
            type="number"
            min="0"
            step="0.01"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Minimum budget"
          />
        </UFormField>

        <UFormField
          name="budgetMax"
          label="Budget max"
          class="col-span-12 sm:col-span-6"
        >
          <UInput
            v-model="form.budgetMax"
            type="number"
            min="0"
            step="0.01"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Maximum budget"
          />
        </UFormField>

        <div class="col-span-12 pt-1">
          <p class="text-sm font-medium text-highlighted">
            Location
          </p>
        </div>

        <UFormField
          name="area"
          label="Area"
          class="col-span-12 sm:col-span-6"
        >
          <UInput
            v-model="form.area"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="e.g. Gulshan"
          />
        </UFormField>

        <UFormField
          name="block"
          label="Block"
          class="col-span-12 sm:col-span-3"
        >
          <UInput
            v-model="form.block"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Block"
          />
        </UFormField>

        <UFormField
          name="road"
          label="Road"
          class="col-span-12 sm:col-span-3"
        >
          <UInput
            v-model="form.road"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Road no."
          />
        </UFormField>

        <UFormField
          name="addressLine1"
          label="Address"
          class="col-span-12"
        >
          <UInput
            v-model="form.addressLine1"
            :size="fieldSize"
            :class="fieldClass"
            placeholder="Street or full address"
          />
        </UFormField>

        <div class="col-span-12 pt-1">
          <p class="text-sm font-medium text-highlighted">
            Assignment
          </p>
        </div>

        <UFormField
          name="assignedUsers"
          label="Salesmen"
          class="col-span-12"
        >
          <FormAutocomplete
            v-model="form.assignedUsers"
            api="/api/users"
            :query="{ options: true }"
            :size="fieldSize"
            placeholder="Assign salesmen"
          />
        </UFormField>

        <UFormField
          name="assignedTeams"
          label="Teams"
          class="col-span-12"
        >
          <FormAutocomplete
            v-model="form.assignedTeams"
            api="/api/teams"
            :query="{ options: true }"
            :size="fieldSize"
            placeholder="Assign teams"
          />
        </UFormField>

        <div class="col-span-12 flex justify-end gap-2 pt-2">
          <UButton
            type="button"
            color="neutral"
            variant="subtle"
            :disabled="isPending"
            @click="onCancel"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            icon="i-lucide-plus"
            :loading="isPending"
          >
            Create Lead
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
