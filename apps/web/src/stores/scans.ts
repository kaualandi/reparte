import { defineStore } from 'pinia'
import { ref } from 'vue'

import type {
  ItemOwner,
  ManualScanRequest,
  Scan,
  Scanner,
  ScanListEntry,
  ScanWithItems,
} from '@reparte/types'

import { http } from '../lib/http'
import { useAuthStore } from './auth'

export const useScansStore = defineStore('scans', () => {
  const scans = ref<ScanListEntry[]>([])
  const currentScan = ref<ScanWithItems | null>(null)
  const loading = ref(false)

  async function fetchScans(): Promise<void> {
    loading.value = true
    try {
      scans.value = await http.get<ScanListEntry[]>('/scans')
    } finally {
      loading.value = false
    }
  }

  async function fetchScan(id: string): Promise<void> {
    loading.value = true
    try {
      currentScan.value = await http.get<ScanWithItems>(`/scans/${id}`)
    } finally {
      loading.value = false
    }
  }

  async function createScan(qrCodeUrl: string): Promise<ScanWithItems> {
    const auth = useAuthStore()
    if (!auth.userId) throw new Error('Not authenticated')
    const created = await http.post<ScanWithItems>('/scans', {
      qrCodeUrl,
      scannedBy: auth.userId,
    })
    currentScan.value = created
    return created
  }

  async function createManualScan(payload: Omit<ManualScanRequest, 'scannedBy'>): Promise<ScanWithItems> {
    const auth = useAuthStore()
    if (!auth.userId) throw new Error('Not authenticated')
    const created = await http.post<ScanWithItems>('/scans/manual', {
      ...payload,
      scannedBy: auth.userId,
    })
    currentScan.value = created
    return created
  }

  async function updateItemOwner(
    scanId: string,
    itemId: string,
    owner: ItemOwner,
  ): Promise<void> {
    if (currentScan.value && currentScan.value.id === scanId) {
      const item = currentScan.value.items.find((i) => i.id === itemId)
      if (item) item.owner = owner
    }
    try {
      await http.patch(`/scans/${scanId}/items/${itemId}`, { owner })
    } catch (err) {
      if (currentScan.value && currentScan.value.id === scanId) {
        await fetchScan(scanId)
      }
      throw err
    }
  }

  async function updatePaidBy(scanId: string, paidBy: Scanner): Promise<void> {
    if (currentScan.value && currentScan.value.id === scanId) {
      currentScan.value.paidBy = paidBy
    }
    try {
      await http.patch<Scan>(`/scans/${scanId}`, { paidBy })
    } catch (err) {
      if (currentScan.value && currentScan.value.id === scanId) {
        await fetchScan(scanId)
      }
      throw err
    }
  }

  async function deleteScan(id: string): Promise<void> {
    await http.delete(`/scans/${id}`)
    scans.value = scans.value.filter((s) => s.id !== id)
    if (currentScan.value?.id === id) currentScan.value = null
  }

  return {
    scans,
    currentScan,
    loading,
    fetchScans,
    fetchScan,
    createScan,
    createManualScan,
    updateItemOwner,
    updatePaidBy,
    deleteScan,
  }
})
