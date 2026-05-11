<script setup lang="ts">
import { computed, onMounted } from 'vue'

import type { ScanBalance } from '@reparte/types'

import { USER_NAMES } from '../config'
import { formatBRL, formatDateTime } from '../lib/format'
import { useBalanceStore } from '../stores/balance'

const balanceStore = useBalanceStore()

function monthLabel(): string {
  const [y, m] = balanceStore.month.split('-')
  if (!y || !m) return balanceStore.month
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1))
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

async function changeMonth(delta: number): Promise<void> {
  await balanceStore.fetchBalance(balanceStore.shiftMonth(delta))
}

function payerName(s: ScanBalance): string {
  return USER_NAMES[s.paidBy]
}

function otherName(s: ScanBalance): string {
  return USER_NAMES[s.paidBy === 'user1' ? 'user2' : 'user1']
}

const verdict = computed(() => {
  const b = balanceStore.balance
  if (!b) return null
  if (b.netAmount === 0) return { text: 'Tudo certo neste mês.', color: 'muted' as const }
  const debtor = b.netDebtor ? USER_NAMES[b.netDebtor] : ''
  const creditor = b.netCreditor ? USER_NAMES[b.netCreditor] : ''
  return {
    text: `${debtor} deve ${formatBRL(b.netAmount)} para ${creditor}`,
    color: 'primary' as const,
  }
})

onMounted(async () => {
  await balanceStore.fetchBalance()
})
</script>

<template>
  <div class="px-4 py-4 max-w-2xl mx-auto pb-8">
    <div class="flex items-center justify-between mb-4">
      <UButton
        icon="i-lucide-chevron-left"
        color="neutral"
        variant="ghost"
        aria-label="Mês anterior"
        @click="changeMonth(-1)"
      />
      <div class="text-center">
        <p class="text-sm text-muted">Acerto de</p>
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

    <div
      v-if="balanceStore.loading && !balanceStore.balance"
      class="py-8 text-center text-muted"
    >
      Calculando…
    </div>

    <template v-else-if="balanceStore.balance">
      <UCard class="mb-4">
        <p class="text-xs text-muted mb-1">Resultado do mês</p>
        <p
          class="text-xl font-bold leading-tight"
          :class="verdict?.color === 'primary' ? 'text-primary' : 'text-muted'"
        >
          {{ verdict?.text }}
        </p>
        <div class="mt-3 pt-3 border-t border-default grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-muted text-xs">{{ USER_NAMES.user1 }} deve a {{ USER_NAMES.user2 }}</p>
            <p class="font-semibold">{{ formatBRL(balanceStore.balance.user1OwesUser2) }}</p>
          </div>
          <div>
            <p class="text-muted text-xs">{{ USER_NAMES.user2 }} deve a {{ USER_NAMES.user1 }}</p>
            <p class="font-semibold">{{ formatBRL(balanceStore.balance.user2OwesUser1) }}</p>
          </div>
        </div>
      </UCard>

      <div
        v-if="balanceStore.balance.scans.length === 0"
        class="py-8 text-center text-muted text-sm"
      >
        Nenhuma nota neste mês.
      </div>

      <div v-else>
        <h3 class="text-sm font-semibold mb-2 px-1">Detalhes por nota</h3>
        <div class="space-y-3">
          <UCard v-for="s in balanceStore.balance.scans" :key="s.scanId">
            <div class="flex justify-between items-start mb-2">
              <div class="min-w-0">
                <p class="font-medium truncate">{{ s.emitente }}</p>
                <p class="text-xs text-muted">{{ formatDateTime(s.createdAt) }}</p>
              </div>
              <p class="font-semibold whitespace-nowrap">{{ formatBRL(s.total) }}</p>
            </div>

            <p class="text-xs text-muted mb-2">
              <UIcon name="i-lucide-wallet" class="size-3.5 inline align-text-bottom mr-1" />
              Pago por <b>{{ payerName(s) }}</b>
            </p>

            <ul class="text-xs space-y-1 mb-3">
              <li v-if="s.ownOfPayer > 0" class="flex justify-between">
                <span class="text-muted">Itens de {{ payerName(s) }}</span>
                <span>{{ formatBRL(s.ownOfPayer) }} <span class="text-muted">(não cobra)</span></span>
              </li>
              <li v-if="s.ownOfOther > 0" class="flex justify-between">
                <span class="text-muted">Itens de {{ otherName(s) }}</span>
                <span>{{ formatBRL(s.ownOfOther) }} <span class="text-muted">(100%)</span></span>
              </li>
              <li v-if="s.sharedTotal > 0" class="flex justify-between">
                <span class="text-muted">Compartilhado</span>
                <span>{{ formatBRL(s.sharedTotal) }} <span class="text-muted">(50%)</span></span>
              </li>
              <li v-if="s.unassignedTotal > 0" class="flex justify-between text-warning">
                <span>A definir</span>
                <span>{{ formatBRL(s.unassignedTotal) }}</span>
              </li>
            </ul>

            <div class="border-t border-default pt-2 flex justify-between text-sm">
              <span class="font-medium">{{ otherName(s) }} deve a {{ payerName(s) }}</span>
              <span class="font-semibold text-primary">{{ formatBRL(s.otherOwesPayer) }}</span>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>
