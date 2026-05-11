import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Scanner } from '@reparte/types'

import { decodeJwt } from '../lib/jwt'

const STORAGE_KEY = 'reparte.token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEY))
  const userId = ref<Scanner | null>(null)

  function syncUser(): void {
    if (!token.value) {
      userId.value = null
      return
    }
    const payload = decodeJwt(token.value)
    userId.value = payload?.sub ?? null
  }

  syncUser()

  function setToken(value: string): void {
    token.value = value.trim()
    localStorage.setItem(STORAGE_KEY, token.value)
    syncUser()
  }

  function clear(): void {
    token.value = null
    userId.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { token, userId, setToken, clear }
})
