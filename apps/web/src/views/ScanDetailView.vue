<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import type { ItemOwner, Scanner } from '@reparte/types'

import { USER_NAMES, ownerLabel } from '../config'
import { formatBRL, formatDateTime } from '../lib/format'
import { useScansStore } from '../stores/scans'

const props = defineProps<{ id: string }>()

const router = useRouter()
const scansStore = useScansStore()
const deleting = ref(false)

const ownerOptions: { value: ItemOwner; label: string }[] = [
  { value: 'user1', label: ownerLabel('user1') },
  { value: 'user2', label: ownerLabel('user2') },
  { value: 'shared', label: ownerLabel('shared') },
]

const payerOptions: { value: Scanner; label: string }[] = [
  { value: 'user1', label: USER_NAMES.user1 },
  { value: 'user2', label: USER_NAMES.user2 },
]

async function setPaidBy(value: Scanner): Promise<void> {
  await scansStore.updatePaidBy(props.id, value)
}

onMounted(async () => {
  await scansStore.fetchScan(props.id)
})

async function setOwner(itemId: string, owner: ItemOwner): Promise<void> {
  await scansStore.updateItemOwner(props.id, itemId, owner)
}

async function remove(): Promise<void> {
  if (!confirm('Excluir essa compra? Essa ação não pode ser desfeita.')) return
  deleting.value = true
  try {
    await scansStore.deleteScan(props.id)
    await router.replace({ name: 'scans-list' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="px-4 py-4 max-w-2xl mx-auto pb-32">
    <div class="flex items-center gap-2 mb-4">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        @click="router.push({ name: 'scans-list' })"
      />
      <h2 class="text-xl font-semibold flex-1 truncate">
        {{ scansStore.currentScan?.emitente ?? 'Carregando…' }}
      </h2>
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        :loading="deleting"
        aria-label="Excluir"
        @click="remove"
      />
    </div>

    <UCard v-if="scansStore.currentScan" class="mb-4">
      <div class="flex justify-between text-sm">
        <div>
          <p class="text-muted">{{ formatDateTime(scansStore.currentScan.createdAt) }}</p>
          <p class="text-muted text-xs mt-1">CNPJ {{ scansStore.currentScan.cnpj }}</p>
        </div>
        <p class="font-semibold text-lg">{{ formatBRL(scansStore.currentScan.total) }}</p>
      </div>
      <div class="mt-3 pt-3 border-t border-default">
        <p class="text-xs text-muted mb-1.5">Quem pagou esta nota?</p>
        <URadioGroup
          :model-value="scansStore.currentScan.paidBy"
          :items="payerOptions"
          orientation="horizontal"
          @update:model-value="(value: string | number) => setPaidBy(value as Scanner)"
        />
      </div>
    </UCard>

    <div v-if="scansStore.currentScan" class="space-y-2">
      <UCard
        v-for="item in scansStore.currentScan.items"
        :key="item.id"
        :ui="{ body: 'p-3' }"
      >
        <div class="flex justify-between items-start gap-2 mb-2">
          <p class="font-medium text-sm flex-1">{{ item.nome }}</p>
          <p class="font-semibold whitespace-nowrap">{{ formatBRL(item.valorTotal) }}</p>
        </div>
        <p class="text-xs text-muted mb-2">
          {{ item.quantidade }} {{ item.unidade }} · {{ formatBRL(item.valorUnitario) }}
        </p>
        <URadioGroup
          :model-value="item.owner"
          :items="ownerOptions"
          orientation="horizontal"
          @update:model-value="(value: string | number) => setOwner(item.id, value as ItemOwner)"
        />
      </UCard>
    </div>

    <UButton
      v-if="scansStore.currentScan"
      class="fixed bottom-6 left-4 right-4 mx-auto max-w-md shadow-lg"
      size="xl"
      icon="i-lucide-calculator"
      @click="router.push({ name: 'scan-split', params: { id } })"
    >
      Ver racha
    </UButton>
  </div>
</template>
