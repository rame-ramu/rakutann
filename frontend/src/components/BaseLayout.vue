<template>
  <div class="base-layout">
    <header v-if="$route.name !== 'student-id'">
      <button @click="$router.back()" class="back-button">← 戻る</button>
      <div class="progress">Step {{ currentStep }} / 4</div>
    </header>
    <main>
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentStep = computed(() => {
  switch (route.name) {
    case 'student-id': return 1
    case 'conditions': return 2
    case 'schedule': return 3
    case 'results': return 4
    default: return 1
  }
})
</script>

<style scoped>
.base-layout {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background-color: #f8fafc;
  color: #334155;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.back-button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1rem;
}

.progress {
  font-weight: bold;
  color: #94a3b8;
}

main {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
</style>
