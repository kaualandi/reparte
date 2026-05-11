<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useCreateScan } from '../composables/useCreateScan'

const router = useRouter()
const { submitting, error, submit } = useCreateScan()

const url = ref('')

async function confirm(): Promise<void> {
  await submit(url.value)
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
      <h2 class="text-xl font-semibold">Colar URL</h2>
    </div>

    <p class="text-sm text-muted mb-4">
      Cole abaixo o link da NFC-e (o mesmo que aparece quando você abre o QR Code no navegador).
    </p>

    <UTextarea
      v-model="url"
      :rows="4"
      placeholder="https://www4.fazenda.rj.gov.br/consultaNFCe/..."
      class="w-full font-mono text-xs"
    />

    <p v-if="error" class="text-sm text-error mt-3">{{ error }}</p>

    <UButton
      size="lg"
      class="mt-4 w-full justify-center"
      :loading="submitting"
      :disabled="submitting || url.trim().length === 0"
      @click="confirm"
    >
      Processar nota
    </UButton>
  </div>
</template>
