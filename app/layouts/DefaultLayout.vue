<template>
  <div class="bg-white dark:bg-neutral-900 dark:text-white h-screen flex overflow-hidden">
    <aside class="w-64 flex-none bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex flex-col">
      <div class="p-4 flex-none">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/assets/img/logo.png" alt="Maxwell CRM" class="h-10" />
        </NuxtLink>
      </div>
      <nav class="flex-1 overflow-auto">
        <ul class="space-y-2 p-2 h-[1200px]">
          <li>
            <NuxtLink
              to="/"
              class="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <span>Home</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/users"
              class="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <span>Users</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/roles"
              class="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <span>Roles</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/permissions"
              class="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <span>Permissions</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="p-2 flex-none">Account</div>
    </aside>
    <div class="flex-1 flex flex-col overflow-hidden">
      <header
        class="flex-none flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800"
      >
        <div>
          <h1>Maxwell CRM</h1>
        </div>
        <div>
          <ColorMode />
        </div>
      </header>
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
