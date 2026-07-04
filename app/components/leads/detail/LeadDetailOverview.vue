<script setup lang="ts">
defineProps<{
  lead: TLead
}>()

function memberRoleLabel(user?: TMaybe<TUser>) {
  const roles = (user?.userRoles ?? [])
    .map(row => row.role?.name)
    .filter(Boolean) as string[]
  if (!roles.length) return null
  return roles
    .map(name => name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '))
    .join(', ')
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
    <div class="lg:col-span-2 space-y-6">
      <UPageCard
        title="Customer"
        description="Contact information for this lead"
        variant="subtle"
      >
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-muted">
              Name
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              {{ lead.customer?.name || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Phone
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              <a
                v-if="lead.customer?.phone"
                :href="`tel:${lead.customer.phone}`"
                class="hover:text-primary transition-colors"
              >
                {{ lead.customer.phone }}
              </a>
              <span v-else>—</span>
            </dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-muted">
              Email
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              <a
                v-if="lead.customer?.email"
                :href="`mailto:${lead.customer.email}`"
                class="hover:text-primary transition-colors"
              >
                {{ lead.customer.email }}
              </a>
              <span v-else>—</span>
            </dd>
          </div>
        </dl>
      </UPageCard>

      <UPageCard
        title="Location"
        description="Preferred area or address"
        variant="subtle"
      >
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-muted">
              Area
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              {{ lead.address?.name || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Block
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              {{ lead.address?.block || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Road
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              {{ lead.address?.road || '—' }}
            </dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-muted">
              Address
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              {{ lead.address?.addressLine1 || '—' }}
            </dd>
          </div>
        </dl>
      </UPageCard>

      <UPageCard
        title="Requirements"
        description="Budget and property preferences"
        variant="subtle"
      >
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-muted">
              Budget range
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              {{ formatBudgetRange(lead.budgetMin, lead.budgetMax) }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Source
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              {{ lead.source?.name || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Property type
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              {{ lead.propertyTypeMain?.name || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Sub type
            </dt>
            <dd class="mt-1 font-medium text-highlighted">
              {{ lead.propertyTypeSub?.name || '—' }}
            </dd>
          </div>
        </dl>
      </UPageCard>
    </div>

    <div class="space-y-6">
      <UPageCard
        title="Assignment"
        variant="subtle"
        class="lg:sticky lg:top-4"
      >
        <div class="space-y-5 text-sm">
          <div>
            <p class="text-muted mb-2">
              Assigned salesmen
            </p>
            <div class="space-y-2">
              <div
                v-for="item in lead.assignable?.users"
                :key="item.id"
                class="flex items-center gap-2"
              >
                <UAvatar
                  :alt="item.user?.name"
                  :src="item.user?.avatar?.path || undefined"
                  size="xs"
                />
                <span class="font-medium text-highlighted">{{ item.user?.name }}</span>
              </div>
              <p
                v-if="!lead.assignable?.users?.length"
                class="text-muted"
              >
                —
              </p>
            </div>
          </div>

          <div>
            <p class="text-muted mb-2">
              Teams
            </p>
            <div class="space-y-2">
              <template
                v-for="item in lead.assignable?.teams"
                :key="item.id"
              >
                <UPopover
                  v-if="item.team?.members?.length"
                  mode="hover"
                  :open-delay="100"
                  :close-delay="100"
                  :content="{ align: 'start', side: 'bottom', sideOffset: 6 }"
                  :ui="{ content: 'p-3 min-w-48 max-w-64 bg-default ring ring-default shadow-lg' }"
                >
                  <div
                    class="flex items-center gap-2.5 rounded-md border border-default bg-elevated/40 px-2.5 py-2 cursor-default"
                  >
                    <div
                      class="flex items-center justify-center size-7 rounded-md bg-primary/10 shrink-0"
                    >
                      <UIcon
                        name="i-lucide-users"
                        class="size-3.5 text-primary"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-medium text-highlighted truncate">
                        {{ item.team?.name || 'Untitled team' }}
                      </p>
                      <p class="text-xs text-muted">
                        {{ item.team.members.length }}
                        {{ item.team.members.length === 1 ? 'member' : 'members' }}
                      </p>
                    </div>
                  </div>
                  <template #content>
                    <div class="space-y-2">
                      <p class="text-xs font-medium text-muted">
                        Team members
                      </p>
                      <div class="space-y-2">
                        <div
                          v-for="member in item.team.members"
                          :key="member.id"
                          class="flex items-center gap-2 min-w-0"
                        >
                          <UAvatar
                            :alt="member.user?.name"
                            :src="member.user?.avatar?.path || undefined"
                            size="xs"
                          />
                          <div class="min-w-0 flex items-baseline gap-1.5">
                            <span class="text-sm text-highlighted truncate">
                              {{ member.user?.name || 'Unknown' }}
                            </span>
                            <span
                              v-if="memberRoleLabel(member.user)"
                              class="text-[11px] text-muted shrink-0"
                            >
                              {{ memberRoleLabel(member.user) }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </UPopover>
                <div
                  v-else
                  class="flex items-center gap-2.5 rounded-md border border-default bg-elevated/40 px-2.5 py-2"
                >
                  <div
                    class="flex items-center justify-center size-7 rounded-md bg-primary/10 shrink-0"
                  >
                    <UIcon
                      name="i-lucide-users"
                      class="size-3.5 text-primary"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-highlighted truncate">
                      {{ item.team?.name || 'Untitled team' }}
                    </p>
                    <p class="text-xs text-muted">
                      0 members
                    </p>
                  </div>
                </div>
              </template>
              <p
                v-if="!lead.assignable?.teams?.length"
                class="text-muted"
              >
                —
              </p>
            </div>
          </div>

          <div class="border-t border-default pt-4 space-y-3">
            <div>
              <p class="text-muted">
                Created by
              </p>
              <p class="mt-1 font-medium text-highlighted">
                {{ lead.creator?.name || '—' }}
              </p>
            </div>
            <div>
              <p class="text-muted">
                Created
              </p>
              <p class="mt-1 font-medium text-highlighted">
                {{ $dfc(lead.createdAt) }}
              </p>
            </div>
            <div>
              <p class="text-muted">
                Last updated
              </p>
              <p class="mt-1 font-medium text-highlighted">
                {{ $dfc(lead.updatedAt) }}
              </p>
            </div>
            <div v-if="lead.boardItems?.length">
              <p class="text-muted mb-1">
                Kanban
              </p>
              <UBadge
                label="On pipeline board"
                color="primary"
                variant="subtle"
                icon="i-lucide-kanban"
              />
            </div>
          </div>
        </div>
      </UPageCard>
    </div>
  </div>
</template>
