<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'

const route = useRoute()
</script>

<template>
  <div
    class="base-layout"
    :class="{ wide: route.name === 'results', medium: route.name === 'conditions' }"
  >
    <AppHeader />
    <main>
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.base-layout {
  width: 100%;
  max-width: 820px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 1.5rem 2rem 2rem;
  color: var(--color-text);
  font-family: inherit;
}

.base-layout.wide {
  max-width: 1180px;
}

.base-layout.medium {
  max-width: 980px;
}

main {
  position: relative;
  min-width: 0;
  padding: 2rem;
  border: 4px solid var(--color-border);
  border-radius: 0.6rem;
  background: #ffffff;
  box-shadow: 10px 10px 0 var(--comic-shadow);
}

main::before {
  position: absolute;
  inset: 10px;
  border: 2px dashed rgba(17, 24, 39, 0.2);
  content: '';
  pointer-events: none;
}

@media (max-width: 640px) {
  .base-layout {
    padding: 0.5rem 0;
  }

  main {
    padding: 1rem;
    border-width: 3px;
    box-shadow: 5px 5px 0 var(--comic-shadow);
  }

  main::before {
    inset: 6px;
  }
}
</style>
