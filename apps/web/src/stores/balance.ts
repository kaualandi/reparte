import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { MonthlyBalance } from '@reparte/types'

import { http } from '../lib/http'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const useBalanceStore = defineStore('balance', () => {
  const month = ref<string>(currentMonth())
  const balance = ref<MonthlyBalance | null>(null)
  const loading = ref(false)

  async function fetchBalance(target: string = month.value): Promise<void> {
    loading.value = true
    try {
      const data = await http.get<MonthlyBalance>(`/balance?month=${encodeURIComponent(target)}`)
      month.value = data.month
      balance.value = data
    } finally {
      loading.value = false
    }
  }

  function shiftMonth(delta: number): string {
    const [yStr, mStr] = month.value.split('-')
    const y = Number.parseInt(yStr ?? '', 10)
    const m = Number.parseInt(mStr ?? '', 10)
    const date = new Date(Date.UTC(y, m - 1 + delta, 1))
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  }

  return { month, balance, loading, fetchBalance, shiftMonth }
})
