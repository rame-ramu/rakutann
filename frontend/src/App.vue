<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue'
import { RouterView } from 'vue-router'
import { currentUser, isAuthReady } from './auth'
import { isUserDataReady } from './utils/persistence'
import LoginView from './views/LoginView.vue'

const feedbackFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSfjjDLxLteu9_DYHbqYuKHXf0FMBxik4trAWbOpA_a1xWXZSQ/viewform'
</script>

<template>
  <div
    v-if="!isAuthReady || (currentUser && !isUserDataReady)"
    class="auth-loading"
    role="status"
    aria-live="polite"
  >
    <div class="auth-loading-card">
      <span class="auth-loading-dot" aria-hidden="true"></span>
      <p>{{ !isAuthReady ? 'ログイン状態を確認しています…' : '保存データを読み込んでいます…' }}</p>
    </div>
  </div>
  <LoginView v-else-if="!currentUser" />
  <template v-else>
    <RouterView />
    <a
      class="feedback-button"
      :href="feedbackFormUrl"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="フィードバックフォームを別タブで開く"
    >
      フィードバック
    </a>
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

.feedback-button {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.7rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-background-soft);
  box-shadow: 3px 3px 0 var(--comic-shadow);
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.feedback-button:hover,
.feedback-button:focus-visible {
  background-color: var(--comic-yellow);
  box-shadow: 2px 2px 0 var(--comic-shadow);
  transform: translate(1px, 1px);
}

.feedback-button:focus-visible {
  outline: 3px solid var(--comic-blue);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .feedback-button {
    right: max(12px, env(safe-area-inset-right));
    bottom: max(12px, env(safe-area-inset-bottom));
    min-height: 40px;
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style>
