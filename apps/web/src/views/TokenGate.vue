<script setup lang="ts">
import { ref } from "vue";

import { decodeJwt } from "../lib/jwt";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const input = ref("");
const error = ref<string | null>(null);

function save(): void {
  const trimmed = input.value.trim();
  if (!trimmed) {
    error.value = "Cole um token válido";
    return;
  }
  const payload = decodeJwt(trimmed);
  if (!payload) {
    error.value =
      "Token inválido — formato JWT esperado, sub deve ser user1 ou user2";
    return;
  }
  error.value = null;
  auth.setToken(trimmed);
}
</script>

<template>
  <div class="px-4 py-6 max-w-md mx-auto">
    <h2 class="text-xl font-semibold mb-2">Primeiro acesso</h2>
    <p class="text-sm text-muted mb-4">
      Cole abaixo o token JWT gerado no setup da API. Ele fica salvo neste
      dispositivo.
    </p>
    <UTextarea
      v-model="input"
      :rows="6"
      placeholder="eyJhbGciOiJIUzI1NiIs..."
      class="w-full font-mono text-xs"
    />
    <p v-if="error" class="text-sm text-error mt-2">{{ error }}</p>
    <UButton class="mt-4 w-full" size="lg" @click="save">Salvar token</UButton>
  </div>
</template>
