<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

interface Option {
  icon: string
  title: string
  description: string
  route: string
}

const options: Option[] = [
  {
    icon: 'i-lucide-camera',
    title: 'Câmera',
    description: 'Ler o QR Code ao vivo (precisa de HTTPS ou localhost)',
    route: 'scan-new-camera',
  },
  {
    icon: 'i-lucide-image',
    title: 'Upload de imagem',
    description: 'Selecionar foto do QR Code da galeria',
    route: 'scan-new-upload',
  },
  {
    icon: 'i-lucide-link',
    title: 'Colar URL',
    description: 'Colar o link da NFC-e direto',
    route: 'scan-new-url',
  },
]
</script>

<template>
  <div class="px-4 py-4 max-w-md mx-auto">
    <div class="flex items-center gap-2 mb-4">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        @click="router.back()"
      />
      <h2 class="text-xl font-semibold">Nova compra</h2>
    </div>

    <p class="text-sm text-muted mb-4">
      Como você quer adicionar a nota?
    </p>

    <div class="space-y-3">
      <UCard
        v-for="opt in options"
        :key="opt.route"
        class="cursor-pointer hover:border-primary transition-colors"
        @click="router.push({ name: opt.route })"
      >
        <div class="flex items-center gap-3">
          <UIcon :name="opt.icon" class="size-8 text-primary shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ opt.title }}</p>
            <p class="text-xs text-muted mt-0.5">{{ opt.description }}</p>
          </div>
          <UIcon name="i-lucide-chevron-right" class="size-5 text-muted shrink-0" />
        </div>
      </UCard>
    </div>
  </div>
</template>
