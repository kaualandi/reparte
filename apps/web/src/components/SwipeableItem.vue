<script setup lang="ts">
import { computed, ref } from 'vue'

import type { AggregatedItem, ItemOwner } from '@reparte/types'

import { USER_NAMES, ownerLabel } from '../config'
import { formatBRL } from '../lib/format'

const props = defineProps<{
  item: AggregatedItem
  prevOwner: ItemOwner | null
  nextOwner: ItemOwner | null
}>()

const emit = defineEmits<{
  move: [owner: ItemOwner]
}>()

const dragX = ref(0)
const isDragging = ref(false)
let startX = 0
let startY = 0
let axis: 'h' | 'v' | null = null

const THRESHOLD = 80

function onTouchStart(e: TouchEvent): void {
  const t = e.touches[0]
  if (!t) return
  startX = t.clientX
  startY = t.clientY
  axis = null
  isDragging.value = true
}

function onTouchMove(e: TouchEvent): void {
  if (!isDragging.value) return
  const t = e.touches[0]
  if (!t) return
  const dx = t.clientX - startX
  const dy = t.clientY - startY
  if (axis === null) {
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
  }
  if (axis === 'h') {
    e.preventDefault()
    if (dx > 0 && !props.nextOwner) {
      dragX.value = Math.min(dx, 30)
    } else if (dx < 0 && !props.prevOwner) {
      dragX.value = Math.max(dx, -30)
    } else {
      dragX.value = dx
    }
  }
}

function onTouchEnd(): void {
  if (!isDragging.value) return
  isDragging.value = false
  if (axis === 'h') {
    if (dragX.value > THRESHOLD && props.nextOwner) {
      emit('move', props.nextOwner)
    } else if (dragX.value < -THRESHOLD && props.prevOwner) {
      emit('move', props.prevOwner)
    }
  }
  dragX.value = 0
  axis = null
}

const transformStyle = computed(() => ({
  transform: `translateX(${dragX.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.2s ease',
}))

const swipeHintLeft = computed(() => {
  if (!props.prevOwner) return null
  return ownerLabel(props.prevOwner)
})

const swipeHintRight = computed(() => {
  if (!props.nextOwner) return null
  return ownerLabel(props.nextOwner)
})

const scannerBadge = computed(() => USER_NAMES[props.item.scanScannedBy])
</script>

<template>
  <div class="relative overflow-hidden rounded-lg">
    <div
      class="absolute inset-y-0 left-0 flex items-center px-3 text-xs font-medium text-primary"
      :class="{ 'opacity-100': dragX > 20, 'opacity-0': dragX <= 20 }"
    >
      <UIcon name="i-lucide-arrow-right" class="size-4 mr-1" />
      <span v-if="swipeHintRight">{{ swipeHintRight }}</span>
    </div>
    <div
      class="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-primary"
      :class="{ 'opacity-100': dragX < -20, 'opacity-0': dragX >= -20 }"
    >
      <span v-if="swipeHintLeft">{{ swipeHintLeft }}</span>
      <UIcon name="i-lucide-arrow-left" class="size-4 ml-1" />
    </div>

    <div
      class="bg-elevated border border-default rounded-lg p-3 select-none"
      :style="transformStyle"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <div class="flex justify-between items-start gap-2 mb-1">
        <p class="text-sm font-medium flex-1 line-clamp-2">{{ item.nome }}</p>
        <p class="text-sm font-semibold whitespace-nowrap">{{ formatBRL(item.valorTotal) }}</p>
      </div>
      <div class="flex items-center justify-between text-xs text-muted">
        <span>{{ item.quantidade }} {{ item.unidade }} · {{ formatBRL(item.valorUnitario) }}</span>
        <UBadge color="neutral" variant="subtle" size="sm">{{ scannerBadge }}</UBadge>
      </div>
    </div>
  </div>
</template>
