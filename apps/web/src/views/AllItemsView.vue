<script setup lang="ts">
import { computed, onMounted } from 'vue'

import type { AggregatedItem, ItemOwner } from '@reparte/types'

import SwipeableItem from '../components/SwipeableItem.vue'
import { ownerLabel } from '../config'
import { formatBRL, formatDateTime } from '../lib/format'
import { useItemsStore } from '../stores/items'

const itemsStore = useItemsStore()

const COLUMN_ORDER: ItemOwner[] = ['unassigned', 'user1', 'shared', 'user2']
const COLUMN_ICON: Record<ItemOwner, string> = {
  unassigned: 'i-lucide-help-circle',
  user1: 'i-lucide-user',
  shared: 'i-lucide-users',
  user2: 'i-lucide-user',
}

function prevOwner(owner: ItemOwner): ItemOwner | null {
  const idx = COLUMN_ORDER.indexOf(owner)
  return idx > 0 ? (COLUMN_ORDER[idx - 1] ?? null) : null
}
function nextOwner(owner: ItemOwner): ItemOwner | null {
  const idx = COLUMN_ORDER.indexOf(owner)
  return idx >= 0 && idx < COLUMN_ORDER.length - 1 ? (COLUMN_ORDER[idx + 1] ?? null) : null
}

interface GroupedColumn {
  owner: ItemOwner
  total: number
  groups: { scanId: string; emitente: string; createdAt: string; items: AggregatedItem[] }[]
}

const columns = computed<GroupedColumn[]>(() => {
  const result: GroupedColumn[] = COLUMN_ORDER.map((owner) => ({ owner, total: 0, groups: [] }))
  for (const item of itemsStore.items) {
    const col = result.find((c) => c.owner === item.owner)
    if (!col) continue
    const value = parseFloat(item.valorTotal.replace(/\./g, '').replace(',', '.'))
    if (Number.isFinite(value)) col.total += value
    let group = col.groups.find((g) => g.scanId === item.scanId)
    if (!group) {
      group = {
        scanId: item.scanId,
        emitente: item.scanEmitente,
        createdAt: item.scanCreatedAt,
        items: [],
      }
      col.groups.push(group)
    }
    group.items.push(item)
  }
  return result
})

function monthLabel(): string {
  const [y, m] = itemsStore.month.split('-')
  if (!y || !m) return itemsStore.month
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1))
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

async function changeMonth(delta: number): Promise<void> {
  await itemsStore.fetchMonth(itemsStore.shiftMonth(delta))
}

async function move(item: AggregatedItem, owner: ItemOwner): Promise<void> {
  await itemsStore.setOwner(item.id, owner)
}

onMounted(async () => {
  await itemsStore.fetchMonth()
})
</script>

<template>
  <div class="pt-2 pb-4">
    <div class="px-4 flex items-center justify-between mb-3">
      <UButton
        icon="i-lucide-chevron-left"
        color="neutral"
        variant="ghost"
        aria-label="Mês anterior"
        @click="changeMonth(-1)"
      />
      <div class="text-center">
        <p class="text-sm text-muted">Tudo em</p>
        <p class="text-base font-semibold capitalize">{{ monthLabel() }}</p>
      </div>
      <UButton
        icon="i-lucide-chevron-right"
        color="neutral"
        variant="ghost"
        aria-label="Próximo mês"
        @click="changeMonth(1)"
      />
    </div>

    <div v-if="itemsStore.loading && itemsStore.items.length === 0" class="py-8 text-center text-muted">
      Carregando…
    </div>

    <div
      v-else
      class="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pb-2"
      style="scroll-padding: 16px"
    >
      <section
        v-for="col in columns"
        :key="col.owner"
        class="snap-start shrink-0 w-[85vw] max-w-sm"
      >
        <header class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <UIcon :name="COLUMN_ICON[col.owner]" class="size-5 text-primary" />
            <p class="font-semibold">{{ ownerLabel(col.owner) }}</p>
            <UBadge color="neutral" variant="subtle" size="sm">{{ col.groups.reduce((acc, g) => acc + g.items.length, 0) }}</UBadge>
          </div>
          <p class="text-sm font-semibold">{{ formatBRL(col.total) }}</p>
        </header>

        <div
          v-if="col.groups.length === 0"
          class="border border-dashed border-default rounded-lg p-6 text-center text-xs text-muted"
        >
          Vazio — arraste itens das outras colunas pra cá.
        </div>

        <div v-else class="space-y-4">
          <div v-for="group in col.groups" :key="group.scanId">
            <div class="flex items-baseline justify-between mb-1.5 px-1">
              <p class="text-xs font-medium text-muted truncate">{{ group.emitente }}</p>
              <p class="text-xs text-muted shrink-0 ml-2">{{ formatDateTime(group.createdAt) }}</p>
            </div>
            <div class="space-y-2">
              <SwipeableItem
                v-for="item in group.items"
                :key="item.id"
                :item="item"
                :prev-owner="prevOwner(col.owner)"
                :next-owner="nextOwner(col.owner)"
                @move="(owner) => move(item, owner)"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <p class="text-xs text-muted text-center mt-3 px-4">
      Arraste o item para a esquerda ou direita para movê-lo entre as colunas.
    </p>
  </div>
</template>
