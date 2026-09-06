<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { TLead } from '~~/shared/types/Lead'
import { formatBudgetRange, formatLeadStatus, leadStatusColors } from '@/utils/leads'

const props = defineProps<{
  lead: TLead
}>()

const toast = useToast()
const client = useQueryClient()
const { confirm } = useConfirm()
const { user } = useCurrentUser()
const { getAttachment } = useGetAttachment()

const canUpdate = computed(() => !!user.value?.updateAnyLeads || !!user.value?.updateOwnLeads)
const canAssign = computed(() => !!user.value?.updateAnyLeads)

const status = ref(props.lead.status)
watch(
  () => props.lead.status,
  value => {
    status.value = value
  }
)

const statusColor = computed(() => leadStatusColors[status.value] || 'neutral')
const statusLabel = computed(() => formatLeadStatus(status.value))

const customerName = computed(() => props.lead.customer?.name || '')
const customerPhone = computed(() => props.lead.customer?.phone || null)

const area = computed(() => {
  return (
    props.lead.address?.name ||
    props.lead.address?.addressLine1 ||
    props.lead.address?.block ||
    null
  )
})

const budget = computed(() => formatBudgetRange(props.lead.budgetMin, props.lead.budgetMax))

const propertyType = computed(() => {
  const main = props.lead.propertyTypeMain?.name
  const sub = props.lead.propertyTypeSub?.name
  if (!main && !sub) return null
  return [main, sub].filter(Boolean).join(' · ')
})

const borderClass = computed(() => {
  const map: Record<string, string> = {
    primary: 'border-l-primary',
    error: 'border-l-error',
    warning: 'border-l-warning',
    secondary: 'border-l-secondary',
    neutral: 'border-l-muted',
    success: 'border-l-success'
  }
  return map[statusColor.value] || 'border-l-muted'
})

type TAssignedUser = Pick<TUser, 'id' | 'name'> & { avatar?: TUser['avatar'] }
type TAssignedTeam = Pick<TTeam, 'id' | 'name'>

const assignedUsers = ref<TAssignedUser[]>([])
const assignedTeams = ref<TAssignedTeam[]>([])
const usersPickerOpen = ref(false)
const teamsPickerOpen = ref(false)
const editOpen = ref(false)
const editLead = ref<TLead | null>(null)

const AVATAR_MAX = 3

watch(
  () => props.lead.assignable,
  assignable => {
    assignedUsers.value = (assignable?.users ?? [])
      .map(row => row.user)
      .filter((item): item is NonNullable<typeof item> => !!item)
    assignedTeams.value = (assignable?.teams ?? [])
      .map(row => row.team)
      .filter((item): item is NonNullable<typeof item> => !!item)
  },
  { immediate: true, deep: true }
)

const visibleUsers = computed(() => assignedUsers.value.slice(0, AVATAR_MAX))
const overflowUsers = computed(() => assignedUsers.value.slice(AVATAR_MAX))
const userOverflow = computed(() => overflowUsers.value.length)
const visibleTeams = computed(() => assignedTeams.value.slice(0, AVATAR_MAX))
const overflowTeams = computed(() => assignedTeams.value.slice(AVATAR_MAX))
const teamOverflow = computed(() => overflowTeams.value.length)

const invalidateBoard = () => {
  client.invalidateQueries({ queryKey: ['/api/board-items'] })
  client.invalidateQueries({ queryKey: ['/api/boards/find'] })
}

const patchLead = async (body: Record<string, unknown>) => {
  try {
    const updated = await $fetch<TLead>(`/api/leads/${props.lead.id}`, {
      method: 'PATCH',
      body
    })
    if (updated.status) status.value = updated.status
    invalidateBoard()
    return updated
  } catch (error) {
    toast.add({
      title: 'Error',
      color: 'error',
      description: parseError(error).message
    })
    throw error
  }
}

const statusItems = useLeadStatusItems(next => {
  if (next === status.value) return
  patchLead({ status: next })
})

const onChangeUsers = (users: TAssignedUser[]) => {
  patchLead({ userIds: users.map(item => item.id) })
}

const onChangeTeams = (teams: TAssignedTeam[]) => {
  patchLead({ teamIds: teams.map(item => item.id) })
}

const onUnassignUser = (item: TAssignedUser) => {
  if (!canAssign.value) return
  const name = item.name || `User #${item.id}`
  confirm({
    title: 'Unassign user',
    description: `Are you sure you want to unassign ${name} from this lead?`,
    confirmLabel: 'Unassign',
    onConfirm: async () => {
      const next = assignedUsers.value.filter(user => user.id !== item.id)
      await patchLead({ userIds: next.map(user => user.id) })
      assignedUsers.value = next
    }
  })
}

const onUnassignTeam = (item: TAssignedTeam) => {
  if (!canAssign.value) return
  const name = item.name || `Team #${item.id}`
  confirm({
    title: 'Unassign team',
    description: `Are you sure you want to unassign ${name} from this lead?`,
    confirmLabel: 'Unassign',
    onConfirm: async () => {
      const next = assignedTeams.value.filter(team => team.id !== item.id)
      await patchLead({ teamIds: next.map(team => team.id) })
      assignedTeams.value = next
    }
  })
}

const onView = () => {
  navigateTo(`/leads/${props.lead.sid}`)
}

const onUpdate = async () => {
  if (!canUpdate.value) return
  try {
    editLead.value = await $fetch<TLead>(`/api/leads/${props.lead.id}`)
    editOpen.value = true
  } catch (error) {
    toast.add({
      title: 'Error',
      color: 'error',
      description: parseError(error).message
    })
  }
}

const onDelete = () => {
  confirm({
    title: 'Delete Lead',
    description: `Are you sure you want to delete "${props.lead.sid}"? This action cannot be undone.`,
    onConfirm: async () => {
      try {
        await $fetch(`/api/leads/${props.lead.id}`, { method: 'DELETE' })
        invalidateBoard()
      } catch (error) {
        toast.add({
          title: 'Error',
          color: 'error',
          description: parseError(error).message
        })
        throw error
      }
    }
  })
}

const menuItems = computed<DropdownMenuItem[][]>(() => {
  const primary: DropdownMenuItem[] = [
    {
      ...actions.view,
      onSelect: onView
    },
    {
      ...actions.update,
      disabled: !canUpdate.value,
      onSelect: onUpdate
    },
    {
      label: 'Update status',
      icon: 'i-lucide-circle-dot',
      disabled: !canUpdate.value,
      children: statusItems.value
    },
    {
      label: 'Assign to user',
      icon: 'i-lucide-user-plus',
      disabled: !canAssign.value,
      onSelect: () => {
        usersPickerOpen.value = true
      }
    },
    {
      label: 'Assign to team',
      icon: 'i-lucide-users',
      disabled: !canAssign.value,
      onSelect: () => {
        teamsPickerOpen.value = true
      }
    }
  ]

  if (assignedUsers.value.length) {
    primary.push({
      label: 'Unassign user',
      icon: 'i-lucide-user-minus',
      disabled: !canAssign.value,
      children: assignedUsers.value.map(item => ({
        label: item.name || `User #${item.id}`,
        onSelect: () => onUnassignUser(item)
      }))
    })
  }

  if (assignedTeams.value.length) {
    primary.push({
      label: 'Unassign team',
      icon: 'i-lucide-users',
      disabled: !canAssign.value,
      children: assignedTeams.value.map(item => ({
        label: item.name || `Team #${item.id}`,
        onSelect: () => onUnassignTeam(item)
      }))
    })
  }

  return [
    primary,
    [
      {
        ...actions.delete,
        onSelect: onDelete
      }
    ]
  ]
})
</script>

<template>
  <UContextMenu
    :items="menuItems"
    :ui="{ content: 'w-48' }"
  >
    <div
      class="rounded-lg border border-default border-l-4 bg-default shadow-xs hover:shadow-sm hover:border-primary/40 transition-all"
      :class="borderClass"
    >
      <div class="flex items-start justify-between gap-2 px-3 pt-3">
        <NuxtLink
          :to="`/leads/${lead.sid}`"
          class="text-xs font-mono text-muted truncate hover:text-primary"
        >
          {{ lead.sid }}
        </NuxtLink>
        <div
          class="flex items-center gap-0.5 shrink-0"
          @click.stop
        >
          <UDropdownMenu
            :items="statusItems"
            :disabled="!canUpdate"
            :ui="{ content: 'w-40' }"
          >
            <button
              type="button"
              class="inline-flex rounded-full"
              :disabled="!canUpdate"
              :aria-label="`Change status: ${statusLabel}`"
            >
              <UBadge
                :label="statusLabel"
                :color="statusColor"
                variant="soft"
                size="sm"
                class="pointer-events-none"
              />
            </button>
          </UDropdownMenu>
          <UDropdownMenu
            :items="menuItems"
            :ui="{ content: 'w-48' }"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              size="xs"
              color="neutral"
              variant="ghost"
              aria-label="Actions"
            />
          </UDropdownMenu>
        </div>
      </div>

      <NuxtLink
        :to="`/leads/${lead.sid}`"
        class="block px-3 pt-2"
      >
        <p
          v-if="customerName"
          class="text-sm font-semibold text-highlighted leading-tight truncate"
        >
          {{ customerName }}
        </p>
        <p
          v-if="customerPhone"
          class="text-xs text-muted mt-0.5 flex items-center gap-1"
        >
          <UIcon
            name="i-lucide-phone"
            class="size-3 shrink-0"
          />
          <span class="truncate">{{ customerPhone }}</span>
        </p>

        <div
          v-if="area || budget !== '—'"
          class="flex items-center gap-1.5 mt-2 text-xs text-muted"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="size-3 shrink-0"
          />
          <span class="truncate">
            <template v-if="area">{{ area }}</template>
            <template v-if="area && budget !== '—'"> · </template>
            <template v-if="budget !== '—'">{{ budget }}</template>
          </span>
        </div>

        <div
          v-if="propertyType || lead.source?.name"
          class="flex flex-wrap items-center gap-1.5 mt-2"
        >
          <UBadge
            v-if="lead.source?.name"
            :label="lead.source.name"
            color="neutral"
            variant="subtle"
            size="xs"
          />
          <UBadge
            v-if="propertyType"
            :label="propertyType"
            color="neutral"
            variant="subtle"
            size="xs"
          />
        </div>
      </NuxtLink>

      <div
        class="flex items-center justify-between gap-2 mt-3 mx-3 mb-3 pt-2 border-t border-default"
        @click.stop
      >
        <div class="flex items-center gap-1.5 min-w-0">
          <FormUsersCardPicker
            v-model="assignedUsers"
            v-model:open="usersPickerOpen"
            class="w-auto"
            :disabled="!canAssign"
            @update:model-value="onChangeUsers"
          >
            <template #trigger="{ open, disabled }">
              <div class="flex items-center -space-x-1">
                <UTooltip
                  v-for="item in visibleUsers"
                  :key="item.id"
                  :text="item.name || `User #${item.id}`"
                  :delay-duration="0"
                >
                  <button
                    type="button"
                    class="group relative inline-flex rounded-full ring-2 ring-inverted/25 hover:z-10"
                    :disabled="disabled"
                    :aria-label="`Unassign ${item.name || `User #${item.id}`}`"
                    @click="onUnassignUser(item)"
                  >
                    <UAvatar
                      :alt="item.name || `User #${item.id}`"
                      :src="getAttachment(item.avatar?.path || undefined)"
                      size="xs"
                      class="bg-elevated"
                      :ui="{
                        root: 'bg-elevated',
                        fallback: 'text-[10px] text-highlighted bg-elevated'
                      }"
                    />
                    <span
                      v-if="!disabled"
                      class="absolute -top-0.5 -right-0.5 hidden group-hover:flex size-3.5 items-center justify-center rounded-full bg-error text-inverted ring-2 ring-inverted/25"
                    >
                      <UIcon
                        name="i-lucide-x"
                        class="size-2.5"
                      />
                    </span>
                  </button>
                </UTooltip>
                <UPopover
                  v-if="userOverflow > 0"
                  :content="{ align: 'start', side: 'top' }"
                >
                  <button
                    type="button"
                    class="relative z-1 inline-flex items-center justify-center size-6 rounded-full bg-elevated text-[10px] font-medium text-highlighted ring-2 ring-inverted/25"
                    :aria-label="`${userOverflow} more users`"
                  >
                    +{{ userOverflow }}
                  </button>
                  <template #content>
                    <div class="p-1 min-w-44">
                      <button
                        v-for="item in overflowUsers"
                        :key="item.id"
                        type="button"
                        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-elevated"
                        :disabled="disabled"
                        @click="onUnassignUser(item)"
                      >
                        <UAvatar
                          :alt="item.name || `User #${item.id}`"
                          :src="getAttachment(item.avatar?.path || undefined)"
                          size="2xs"
                          class="bg-elevated"
                        />
                        <span class="min-w-0 flex-1 truncate text-sm">
                          {{ item.name || `User #${item.id}` }}
                        </span>
                        <UIcon
                          v-if="!disabled"
                          name="i-lucide-x"
                          class="size-3.5 text-error shrink-0"
                        />
                      </button>
                    </div>
                  </template>
                </UPopover>
                <UTooltip
                  v-if="!disabled"
                  text="Assign users"
                  :delay-duration="0"
                >
                  <button
                    type="button"
                    class="relative z-1 inline-flex items-center justify-center size-6 rounded-full bg-elevated text-highlighted ring-2 ring-inverted/25 hover:bg-primary hover:text-inverted transition-colors"
                    aria-label="Assign users"
                    @click="open()"
                  >
                    <UIcon
                      :name="assignedUsers.length ? 'i-lucide-plus' : 'i-lucide-user'"
                      class="size-3"
                    />
                  </button>
                </UTooltip>
              </div>
            </template>
          </FormUsersCardPicker>

          <div
            class="w-px h-5 bg-default shrink-0"
            aria-hidden="true"
          />

          <FormTeamsCardPicker
            v-model="assignedTeams"
            v-model:open="teamsPickerOpen"
            class="w-auto"
            :disabled="!canAssign"
            @update:model-value="onChangeTeams"
          >
            <template #trigger="{ open, disabled }">
              <div class="flex items-center -space-x-1">
                <UTooltip
                  v-for="item in visibleTeams"
                  :key="item.id"
                  :text="item.name || `Team #${item.id}`"
                  :delay-duration="0"
                >
                  <button
                    type="button"
                    class="group relative inline-flex rounded-full ring-2 ring-inverted/25 hover:z-10"
                    :disabled="disabled"
                    :aria-label="`Unassign ${item.name || `Team #${item.id}`}`"
                    @click="onUnassignTeam(item)"
                  >
                    <UAvatar
                      :alt="item.name || `Team #${item.id}`"
                      icon="i-lucide-users"
                      size="xs"
                      class="bg-elevated"
                      :ui="{
                        root: 'bg-elevated',
                        fallback: 'text-[10px] text-highlighted bg-elevated'
                      }"
                    />
                    <span
                      v-if="!disabled"
                      class="absolute -top-0.5 -right-0.5 hidden group-hover:flex size-3.5 items-center justify-center rounded-full bg-error text-inverted ring-2 ring-inverted/25"
                    >
                      <UIcon
                        name="i-lucide-x"
                        class="size-2.5"
                      />
                    </span>
                  </button>
                </UTooltip>
                <UPopover
                  v-if="teamOverflow > 0"
                  :content="{ align: 'start', side: 'top' }"
                >
                  <button
                    type="button"
                    class="relative z-1 inline-flex items-center justify-center size-6 rounded-full bg-elevated text-[10px] font-medium text-highlighted ring-2 ring-inverted/25"
                    :aria-label="`${teamOverflow} more teams`"
                  >
                    +{{ teamOverflow }}
                  </button>
                  <template #content>
                    <div class="p-1 min-w-44">
                      <button
                        v-for="item in overflowTeams"
                        :key="item.id"
                        type="button"
                        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-elevated"
                        :disabled="disabled"
                        @click="onUnassignTeam(item)"
                      >
                        <UAvatar
                          :alt="item.name || `Team #${item.id}`"
                          icon="i-lucide-users"
                          size="2xs"
                          class="bg-elevated"
                        />
                        <span class="min-w-0 flex-1 truncate text-sm">
                          {{ item.name || `Team #${item.id}` }}
                        </span>
                        <UIcon
                          v-if="!disabled"
                          name="i-lucide-x"
                          class="size-3.5 text-error shrink-0"
                        />
                      </button>
                    </div>
                  </template>
                </UPopover>
                <UTooltip
                  v-if="!disabled"
                  text="Assign team"
                  :delay-duration="0"
                >
                  <button
                    type="button"
                    class="relative z-1 inline-flex items-center justify-center size-6 rounded-full bg-elevated text-highlighted ring-2 ring-inverted/25 hover:bg-primary hover:text-inverted transition-colors"
                    aria-label="Assign team"
                    @click="open()"
                  >
                    <UIcon
                      :name="assignedTeams.length ? 'i-lucide-plus' : 'i-lucide-users'"
                      class="size-3"
                    />
                  </button>
                </UTooltip>
              </div>
            </template>
          </FormTeamsCardPicker>
        </div>
        <div
          class="flex items-center gap-1 text-xs text-muted shrink-0"
          :title="`Updated ${$dfc(lead.updatedAt)}`"
        >
          <UIcon
            name="i-lucide-clock"
            class="size-3"
          />
          {{ $dfc(lead.updatedAt, 'MMM d, yyyy') }}
        </div>
      </div>
    </div>
  </UContextMenu>

  <LeadEditFormModal
    v-if="editLead"
    v-model:open="editOpen"
    :lead="editLead"
    @success="invalidateBoard"
  />
</template>
