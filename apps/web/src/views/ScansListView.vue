<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { formatBRL, formatDateTime } from '../lib/format'
import { useScansStore } from '../stores/scans'

const router = useRouter()
const scansStore = useScansStore()
const refreshing = ref(false)

async function refresh(): Promise<void> {
  refreshing.value = true
  try {
    await scansStore.fetchScans()
  } finally {
    refreshing.value = false
  }
}

onMounted(refresh)

function openScan(id: string): void {
  void router.push({ name: 'scan-detail', params: { id } })
}
</script>

<template>
  <div class="px-4 py-4 max-w-2xl mx-auto pb-24">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Minhas compras</h2>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="ghost"
        :loading="refreshing"
        aria-label="Atualizar"
        @click="refresh"
      />
    </div>

    <div v-if="scansStore.loading && scansStore.scans.length === 0" class="py-8 text-center text-muted">
      Carregando…
    </div>

    <div
      v-else-if="scansStore.scans.length === 0"
      class="py-12 text-center text-muted"
    >
      <UIcon name="i-lucide-scan-line" class="size-12 mx-auto mb-3" />
      <p>Nenhuma compra ainda.</p>
      <p class="text-sm">Toque em <b>Escanear</b> para começar.</p>
    </div>

    <div v-else class="space-y-3">
      <UCard
        v-for="scan in scansStore.scans"
        :key="scan.id"
        class="cursor-pointer"
        @click="openScan(scan.id)"
      >
        <div class="flex justify-between items-start gap-3">
          <div class="min-w-0">
            <p class="font-medium truncate">{{ scan.emitente }}</p>
            <p class="text-xs text-muted">{{ formatDateTime(scan.createdAt) }}</p>
            <p class="text-xs text-muted mt-1">{{ scan.itemCount }} itens</p>
          </div>
          <p class="font-semibold whitespace-nowrap">{{ formatBRL(scan.total) }}</p>
        </div>
      </UCard>
    </div>

  </div>
</template>
