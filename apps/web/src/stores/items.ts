import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { AggregatedItem, ItemOwner, MonthSummary } from '@reparte/types'

import { http } from '../lib/http'

export const useItemsStore = defineStore('items', () => {
  const month = ref<string>(currentMonth())
  const items = ref<AggregatedItem[]>([])
  const loading = ref(false)

  function currentMonth(): string {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    return `${yyyy}-${mm}`
  }

  async function fetchMonth(target: string = month.value): Promise<void> {
    loading.value = true
    try {
      const data = await http.get<MonthSummary>(`/items?month=${encodeURIComponent(target)}`)
      month.value = data.month
      items.value = data.items
    } finally {
      loading.value = false
    }
  }

  async function setOwner(itemId: string, owner: ItemOwner): Promise<void> {
    const item = items.value.find((i) => i.id === itemId)
    if (!item) return
    const previous = item.owner
    item.owner = owner
    try {
      await http.patch(`/scans/${item.scanId}/items/${item.id}`, { owner })
    } catch (err) {
      item.owner = previous
      throw err
    }
  }

  function shiftMonth(delta: number): string {
    const [yStr, mStr] = month.value.split('-')
    const y = Number.parseInt(yStr ?? '', 10)
    const m = Number.parseInt(mStr ?? '', 10)
    const date = new Date(Date.UTC(y, m - 1 + delta, 1))
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  }

  return { month, items, loading, fetchMonth, setOwner, shiftMonth, currentMonth }
})
