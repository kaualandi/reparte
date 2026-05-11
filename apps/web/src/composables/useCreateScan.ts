import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useScansStore } from '../stores/scans'

const SEFAZ_HINT = /(?:fazenda\..*\.gov\.br|nfce|nfe|portalsped)/i

export function isLikelyNFeUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    return SEFAZ_HINT.test(trimmed)
  } catch {
    return false
  }
}

export function useCreateScan() {
  const router = useRouter()
  const scansStore = useScansStore()
  const submitting = ref(false)
  const error = ref<string | null>(null)

  async function submit(qrCodeUrl: string): Promise<void> {
    error.value = null
    if (!isLikelyNFeUrl(qrCodeUrl)) {
      error.value = 'URL inválida — esperado um link de NFC-e da SEFAZ.'
      return
    }
    submitting.value = true
    try {
      const scan = await scansStore.createScan(qrCodeUrl.trim())
      await router.replace({ name: 'scan-detail', params: { id: scan.id } })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao processar nota.'
    } finally {
      submitting.value = false
    }
  }

  return { submitting, error, submit }
}
