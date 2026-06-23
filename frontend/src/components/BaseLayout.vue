<template>
  <div class="base-layout" :class="{ wide: route.name === 'results' }">
    <header v-if="$route.name !== 'student-id'">
      <div class="nav-buttons">
        <button @click="goFixedBack" class="back-button">← 固定戻り</button>
        <button @click="goFixedForward" class="back-button" :disabled="!canGoFixedForward">
          固定進み →
        </button>
      </div>
      <div class="progress">Step {{ currentStep }} / 4</div>
    </header>
    <main>
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const currentStep = computed(() => {
  switch (route.name) {
    case 'student-id': return 1
    case 'conditions': return 2
    case 'schedule': return 3
    case 'results': return 4
    default: return 1
  }
})

const canGoFixedForward = computed(() => route.name !== 'results')

const goFixedBack = () => {
  switch (route.name) {
    case 'conditions':
      router.push('/')
      break
    case 'schedule':
      router.push('/conditions')
      break
    case 'results':
      router.push('/schedule')
      break
    default:
      router.push('/')
      break
  }
}

const goFixedForward = () => {
  switch (route.name) {
    case 'student-id':
      router.push('/conditions')
      break
    case 'conditions':
      router.push('/schedule')
      break
    case 'schedule':
      router.push('/results')
      break
  }
}
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

.base-layout.wide {
  max-width: 1180px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.nav-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.back-button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1rem;
}

.back-button:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
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
