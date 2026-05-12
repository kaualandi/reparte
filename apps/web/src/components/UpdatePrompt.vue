<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()

async function applyUpdate() {
  await updateServiceWorker(true)
}
</script>

<template>
  <div
    v-if="needRefresh"
    class="border-b border-default bg-primary-50 dark:bg-primary-950 px-4 py-2 flex items-center justify-between gap-3"
  >
    <span class="text-sm text-primary-700 dark:text-primary-200">
      Nova versão disponível
    </span>
    <UButton size="xs" color="primary" variant="solid" @click="applyUpdate">
      Atualizar
    </UButton>
  </div>
</template>
