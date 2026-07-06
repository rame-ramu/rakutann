<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue'
import { RouterView } from 'vue-router'

const feedbackFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSfjjDLxLteu9_DYHbqYuKHXf0FMBxik4trAWbOpA_a1xWXZSQ/viewform'
</script>

<template>
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
  <Analytics />
</template>

<style>
/* Global resets or base styles if needed */
body {
  margin: 0;
  padding: 0;
  background-color: var(--color-background);
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
