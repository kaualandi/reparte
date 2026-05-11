<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { USER_NAMES } from '../config'
import { formatBRL } from '../lib/format'
import { useScansStore } from '../stores/scans'
import { useSplitStore } from '../stores/split'

const props = defineProps<{ id: string }>()

const router = useRouter()
const scansStore = useScansStore()
const splitStore = useSplitStore()

onMounted(async () => {
  await Promise.all([
    splitStore.fetchSplit(props.id),
    scansStore.currentScan?.id === props.id ? Promise.resolve() : scansStore.fetchScan(props.id),
  ])
})

const sharedItems = computed(() =>
  scansStore.currentScan?.items.filter((i) => i.owner === 'shared') ?? [],
)
</script>

<template>
  <div class="px-4 py-4 max-w-2xl mx-auto pb-8">
    <div class="flex items-center gap-2 mb-4">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        aria-label="Voltar"
        @click="router.push({ name: 'scan-detail', params: { id } })"
      />
      <h2 class="text-xl font-semibold flex-1">Racha</h2>
      <UButton
        icon="i-lucide-home"
        color="neutral"
        variant="ghost"
        aria-label="Início"
        @click="router.push({ name: 'all-items' })"
      />
    </div>

    <div v-if="splitStore.loading || !splitStore.split" class="py-8 text-center text-muted">
      Calculando…
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <UCard>
          <p class="text-sm text-muted">{{ USER_NAMES.user1 }} deve</p>
          <p class="text-2xl font-bold mt-1">{{ formatBRL(splitStore.split.deveUser1) }}</p>
          <p class="text-xs text-muted mt-2">
            {{ formatBRL(splitStore.split.totalUser1) }} próprio + metade dos compartilhados
          </p>
        </UCard>
        <UCard>
          <p class="text-sm text-muted">{{ USER_NAMES.user2 }} deve</p>
          <p class="text-2xl font-bold mt-1">{{ formatBRL(splitStore.split.deveUser2) }}</p>
          <p class="text-xs text-muted mt-2">
            {{ formatBRL(splitStore.split.totalUser2) }} próprio + metade dos compartilhados
          </p>
        </UCard>
      </div>

      <UCard>
        <p class="text-sm text-muted">Total compartilhado</p>
        <p class="text-xl font-semibold mt-1">{{ formatBRL(splitStore.split.totalShared) }}</p>
        <p class="text-xs text-muted mt-1">
          Dividido meio a meio entre {{ USER_NAMES.user1 }} e {{ USER_NAMES.user2 }}
        </p>
      </UCard>

      <div v-if="sharedItems.length > 0">
        <h3 class="text-sm font-semibold mb-2">Itens compartilhados</h3>
        <UCard :ui="{ body: 'p-0' }">
          <ul class="divide-y divide-default">
            <li
              v-for="item in sharedItems"
              :key="item.id"
              class="flex justify-between p-3 text-sm"
            >
              <span class="truncate">{{ item.nome }}</span>
              <span class="font-medium whitespace-nowrap">{{ formatBRL(item.valorTotal) }}</span>
            </li>
          </ul>
        </UCard>
      </div>
    </div>
  </div>
</template>
