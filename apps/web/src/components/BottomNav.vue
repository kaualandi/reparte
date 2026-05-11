<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

interface Tab {
  to: string
  label: string
  icon: string
}

const tabs: Tab[] = [
  { to: '/', label: 'Tudo', icon: 'i-lucide-layout-grid' },
  { to: '/scans', label: 'Notas', icon: 'i-lucide-receipt' },
  { to: '/scan/new', label: 'Nova', icon: 'i-lucide-plus-circle' },
  { to: '/balance', label: 'Acerto', icon: 'i-lucide-handshake' },
]

const route = useRoute()
const router = useRouter()

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 border-t border-default bg-default pb-[env(safe-area-inset-bottom)] z-40"
  >
    <div class="flex max-w-2xl mx-auto">
      <button
        v-for="tab in tabs"
        :key="tab.to"
        class="flex-1 flex flex-col items-center gap-1 py-2 text-xs"
        :class="isActive(tab.to) ? 'text-primary' : 'text-muted'"
        @click="router.push(tab.to)"
      >
        <UIcon :name="tab.icon" class="size-6" />
        <span>{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
