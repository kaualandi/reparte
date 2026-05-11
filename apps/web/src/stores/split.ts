import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Split } from '@reparte/types'

import { http } from '../lib/http'

export const useSplitStore = defineStore('split', () => {
  const split = ref<Split | null>(null)
  const loading = ref(false)

  async function fetchSplit(scanId: string): Promise<void> {
    loading.value = true
    try {
      split.value = await http.get<Split>(`/scans/${scanId}/split`)
    } finally {
      loading.value = false
    }
  }

  return { split, loading, fetchSplit }
})
