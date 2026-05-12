<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import BottomNav from './components/BottomNav.vue'
import { USER_NAMES } from './config'
import { useAuthStore } from './stores/auth'
import TokenGate from './views/TokenGate.vue'

const auth = useAuthStore()
const route = useRoute()

const greeting = computed(() => {
  if (!auth.userId) return 'Reparte'
  return `Reparte · ${USER_NAMES[auth.userId]}`
})

const showBottomNav = computed(() => {
  if (!auth.token) return false
  return ['all-items', 'scans-list', 'scan-new', 'balance'].includes(String(route.name))
})
</script>

<template>
  <UApp>
    <div class="h-full flex flex-col">
      <header
        class="border-b border-default px-4 flex items-center justify-between bg-default"
        style="
          padding-top: max(0.75rem, env(safe-area-inset-top));
          padding-bottom: 0.75rem;
          padding-left: max(1rem, env(safe-area-inset-left));
          padding-right: max(1rem, env(safe-area-inset-right));
        "
      >
        <h1 class="text-lg font-semibold">{{ greeting }}</h1>
        <UButton
          v-if="auth.token"
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          aria-label="Sair"
          @click="auth.clear()"
        />
      </header>
      <main class="flex-1 min-h-0 overflow-y-auto">
        <TokenGate v-if="!auth.token" />
        <RouterView v-else />
      </main>
      <BottomNav v-if="showBottomNav" />
    </div>
  </UApp>
</template>
