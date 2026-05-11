<script setup lang="ts">
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

import { isLikelyNFeUrl, useCreateScan } from '../composables/useCreateScan'

const router = useRouter()
const { submitting, error, submit } = useCreateScan()

const video = useTemplateRef<HTMLVideoElement>('video')
const detectedUrl = ref<string | null>(null)
const cameraError = ref<string | null>(null)
let controls: IScannerControls | null = null
const reader = new BrowserMultiFormatReader()

async function start(): Promise<void> {
  cameraError.value = null
  detectedUrl.value = null
  try {
    if (!video.value) return
    controls = await reader.decodeFromVideoDevice(undefined, video.value, (result) => {
      if (!result) return
      const text = result.getText()
      if (!isLikelyNFeUrl(text)) return
      detectedUrl.value = text
      controls?.stop()
      controls = null
    })
  } catch (err) {
    cameraError.value =
      err instanceof Error
        ? `Não foi possível abrir a câmera: ${err.message}`
        : 'Não foi possível abrir a câmera.'
  }
}

function stop(): void {
  controls?.stop()
  controls = null
}

async function confirm(): Promise<void> {
  if (!detectedUrl.value) return
  await submit(detectedUrl.value)
  if (error.value) await start()
}

function retry(): void {
  detectedUrl.value = null
  void start()
}

onMounted(() => {
  void start()
})

onBeforeUnmount(stop)
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
      <h2 class="text-xl font-semibold">Escanear cupom</h2>
    </div>

    <div class="relative aspect-square w-full bg-black rounded-lg overflow-hidden">
      <video ref="video" class="w-full h-full object-cover" autoplay playsinline muted />
      <div
        v-if="detectedUrl"
        class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-white text-center"
      >
        <UIcon name="i-lucide-check-circle" class="size-12 text-emerald-400 mb-2" />
        <p class="text-sm">QR Code detectado</p>
      </div>
    </div>

    <p v-if="cameraError" class="text-sm text-error mt-3">{{ cameraError }}</p>
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
      <UButton
        size="lg"
        color="neutral"
        variant="ghost"
        class="w-full justify-center"
        :disabled="submitting"
        @click="retry"
      >
        Escanear outro
      </UButton>
    </div>

    <p class="text-xs text-muted mt-4">
      A câmera só funciona em HTTPS ou localhost. Aponte para o QR Code do cupom da SEFAZ-RJ.
    </p>
  </div>
</template>
