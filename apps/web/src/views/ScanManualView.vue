<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import type { ItemOwner, ManualItemInput, Scanner } from '@reparte/types'

import { USER_NAMES, ownerLabel } from '../config'
import { formatBRL } from '../lib/format'
import { useAuthStore } from '../stores/auth'
import { useScansStore } from '../stores/scans'

interface DraftItem {
  nome: string
  valorTotal: string
  owner: ItemOwner
}

const router = useRouter()
const auth = useAuthStore()
const scansStore = useScansStore()

const emitente = ref('Avulso')
const paidBy = ref<Scanner>(auth.userId ?? 'user1')
const items = ref<DraftItem[]>([{ nome: '', valorTotal: '', owner: 'unassigned' }])
const submitting = ref(false)
const error = ref<string | null>(null)

const payerOptions: { value: Scanner; label: string }[] = [
  { value: 'user1', label: USER_NAMES.user1 },
  { value: 'user2', label: USER_NAMES.user2 },
]

const ownerOptions: { value: ItemOwner; label: string }[] = [
  { value: 'unassigned', label: ownerLabel('unassigned') },
  { value: 'user1', label: USER_NAMES.user1 },
  { value: 'user2', label: USER_NAMES.user2 },
  { value: 'shared', label: ownerLabel('shared') },
]

function parseNumber(value: string): number {
  if (!value) return 0
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const n = Number.parseFloat(normalized)
  return Number.isFinite(n) ? n : 0
}

const total = computed(() => items.value.reduce((acc, it) => acc + parseNumber(it.valorTotal), 0))

const canSubmit = computed(() => {
  if (emitente.value.trim().length === 0) return false
  if (items.value.length === 0) return false
  return items.value.every((it) => it.nome.trim().length > 0 && parseNumber(it.valorTotal) > 0)
})

function addItem(): void {
  items.value.push({ nome: '', valorTotal: '', owner: 'unassigned' })
}

function removeItem(index: number): void {
  items.value.splice(index, 1)
  if (items.value.length === 0) addItem()
}

async function submit(): Promise<void> {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = null
  try {
    const payload: { emitente: string; paidBy: Scanner; items: ManualItemInput[] } = {
      emitente: emitente.value.trim(),
      paidBy: paidBy.value,
      items: items.value.map((it) => ({
        nome: it.nome.trim(),
        valorTotal: it.valorTotal.replace(/\./g, '').replace(',', '.'),
        owner: it.owner,
      })),
    }
    const scan = await scansStore.createManualScan(payload)
    await router.replace({ name: 'scan-detail', params: { id: scan.id } })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Falha ao salvar.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="px-4 py-4 max-w-md mx-auto pb-32">
    <div class="flex items-center gap-2 mb-4">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        aria-label="Voltar"
        @click="router.back()"
      />
      <h2 class="text-xl font-semibold">Adicionar manualmente</h2>
    </div>

    <UCard class="mb-3">
      <label class="block text-xs text-muted mb-1.5">Estabelecimento</label>
      <UInput v-model="emitente" placeholder="Padaria do João" class="w-full" />

      <div class="mt-3">
        <p class="text-xs text-muted mb-1.5">Quem pagou?</p>
        <URadioGroup
          :model-value="paidBy"
          :items="payerOptions"
          orientation="horizontal"
          @update:model-value="(value: string | number) => (paidBy = value as Scanner)"
        />
      </div>
    </UCard>

    <h3 class="text-sm font-semibold mb-2 px-1">Itens</h3>
    <div class="space-y-3">
      <UCard v-for="(item, index) in items" :key="index" :ui="{ body: 'p-3' }">
        <div class="flex gap-2 mb-2">
          <UInput
            v-model="item.nome"
            placeholder="Ex.: pão francês"
            class="flex-1"
          />
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            aria-label="Remover item"
            @click="removeItem(index)"
          />
        </div>
        <div class="flex items-center gap-2 mb-3">
          <span class="text-sm text-muted shrink-0">R$</span>
          <UInput
            v-model="item.valorTotal"
            inputmode="decimal"
            placeholder="0,00"
            class="flex-1"
          />
        </div>
        <URadioGroup
          :model-value="item.owner"
          :items="ownerOptions"
          orientation="horizontal"
          @update:model-value="(value: string | number) => (item.owner = value as ItemOwner)"
        />
      </UCard>
    </div>

    <UButton
      class="mt-3 w-full"
      color="neutral"
      variant="soft"
      icon="i-lucide-plus"
      @click="addItem"
    >
      Adicionar outro item
    </UButton>

    <div class="mt-4 flex justify-between text-sm">
      <span class="text-muted">Total</span>
      <span class="font-semibold">{{ formatBRL(total) }}</span>
    </div>

    <p v-if="error" class="text-sm text-error mt-3">{{ error }}</p>

    <UButton
      class="fixed bottom-6 left-4 right-4 mx-auto max-w-md shadow-lg"
      size="xl"
      :loading="submitting"
      :disabled="!canSubmit || submitting"
      icon="i-lucide-check"
      @click="submit"
    >
      Salvar compra
    </UButton>
  </div>
</template>
