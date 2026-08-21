<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue'
import { RouterView } from 'vue-router'
import { currentUser, isAuthReady, isGuestMode } from './auth'
import { isUserDataReady } from './utils/persistence'
import LoginView from './views/LoginView.vue'
</script>

<template>
  <div
    v-if="!isAuthReady || ((currentUser || isGuestMode) && !isUserDataReady)"
    class="auth-loading"
    role="status"
    aria-live="polite"
  >
    <div class="auth-loading-card">
      <span class="auth-loading-dot" aria-hidden="true"></span>
      <p>{{ !isAuthReady ? 'ログイン状態を確認しています…' : '保存データを読み込んでいます…' }}</p>
    </div>
  </div>
  <LoginView v-else-if="!currentUser && !isGuestMode" />
  <template v-else>
    <RouterView />
  </template>
  <Analytics />
</template>

<style>
/* Global resets or base styles if needed */
body {
  margin: 0;
  padding: 0;
  background-color: var(--color-background);
}

.auth-loading {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 2rem;
}

.auth-loading-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.25rem 1.5rem;
  border: 3px solid #111827;
  border-radius: 0.7rem;
  background: #ffffff;
  box-shadow: 6px 6px 0 #111827;
}

.auth-loading-card p {
  color: #111827;
  font-weight: 900;
}

.auth-loading-dot {
  width: 1rem;
  height: 1rem;
  border: 3px solid #111827;
  border-radius: 50%;
  background: var(--comic-green);
  animation: auth-loading-pulse 0.8s ease-in-out infinite alternate;
}

@keyframes auth-loading-pulse {
  to {
    background: var(--comic-yellow);
    transform: scale(1.2);
  }
}
</style>
