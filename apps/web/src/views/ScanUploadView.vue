<script setup lang="ts">
import { BrowserMultiFormatReader } from '@zxing/browser'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { isLikelyNFeUrl, useCreateScan } from '../composables/useCreateScan'

const router = useRouter()
const { submitting, error, submit } = useCreateScan()

const reader = new BrowserMultiFormatReader()
const decoding = ref(false)
const decodeError = ref<string | null>(null)
const detectedUrl = ref<string | null>(null)
const previewUrl = ref<string | null>(null)

async function onFileChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return

  decodeError.value = null
  detectedUrl.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
  decoding.value = true

  try {
    const result = await reader.decodeFromImageUrl(previewUrl.value)
    const text = result.getText()
    if (!isLikelyNFeUrl(text)) {
      decodeError.value = 'QR Code lido, mas não parece ser uma NFC-e da SEFAZ.'
      return
    }
    detectedUrl.value = text
  } catch {
    decodeError.value = 'Não consegui ler um QR Code nessa imagem. Tente outra foto mais nítida.'
  } finally {
    decoding.value = false
  }
}

async function confirm(): Promise<void> {
  if (!detectedUrl.value) return
  await submit(detectedUrl.value)
}
</script>

<template>
  <div class="px-4 py-4 max-w-md mx-auto">
    <div class="flex items-center gap-2 mb-3">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        @click="router.back()"
      />
      <h2 class="text-xl font-semibold">Upload de imagem</h2>
    </div>

    <p class="text-sm text-muted mb-4">
      Selecione uma foto onde o QR Code da NFC-e apareça nítido.
    </p>

    <label
      class="block border-2 border-dashed border-default rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
    >
      <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
      <UIcon name="i-lucide-upload" class="size-10 text-muted mx-auto mb-2" />
      <p class="text-sm font-medium">Toque para escolher uma imagem</p>
      <p class="text-xs text-muted mt-1">JPG, PNG ou WEBP</p>
    </label>

    <div
      v-if="previewUrl"
      class="mt-4 rounded-lg overflow-hidden bg-black aspect-square flex items-center justify-center"
    >
      <img :src="previewUrl" alt="Pré-visualização" class="max-w-full max-h-full object-contain" />
    </div>

    <p v-if="decoding" class="text-sm text-muted mt-3">Lendo QR Code…</p>
    <p v-if="decodeError" class="text-sm text-error mt-3">{{ decodeError }}</p>
    <p v-if="error" class="text-sm text-error mt-3">{{ error }}</p>

    <div v-if="detectedUrl" class="mt-4 space-y-3">
      <p class="text-xs text-muted break-all">{{ detectedUrl }}</p>
      <UButton
        size="lg"
        class="w-full justify-center"
        :loading="submitting"
        :disabled="submitting"
        @click="confirm"
      >
        Confirmar e processar
      </UButton>
    </div>
  </div>
</template>
