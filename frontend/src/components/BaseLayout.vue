<template>
  <div class="base-layout" :class="{ wide: route.name === 'results', medium: route.name === 'conditions' }">
    <header v-if="$route.name !== 'student-id'">
      <div class="nav-buttons">
        <button @click="goFixedBack" class="back-button">← 戻る</button>
        <button @click="goFixedForward" class="back-button" :disabled="!canGoFixedForward">
          次へ →
        </button>
        <button @click="deleteSavedData" class="delete-save-button">保存データを削除する</button>
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
import { clearPersistedState, resumePersistence } from '../utils/persistence'

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

const deleteSavedData = async () => {
  if (window.confirm('保存された時間割やお気に入りをすべて削除しますか？')) {
    clearPersistedState()
    try {
      await router.push('/')
    } finally {
      resumePersistence()
    }
  }
}
</script>

<style scoped>
.base-layout {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  color: var(--color-text);
  font-family: inherit;
}

.base-layout.wide {
  max-width: 1180px;
}

.base-layout.medium {
  max-width: 980px;
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
  background: #fffdf4;
  border: 3px solid var(--color-border);
  border-radius: 0.7rem;
  color: #111827;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 900;
  padding: 0.55rem 0.8rem;
  box-shadow: 4px 4px 0 var(--comic-shadow);
  transition: transform 0.15s, box-shadow 0.15s;
}

.back-button:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--comic-shadow);
}

.back-button:disabled {
  color: #6b7280;
  background: #e5e7eb;
  cursor: not-allowed;
  box-shadow: 2px 2px 0 var(--comic-shadow);
}

.delete-save-button {
  background: #fffdf4;
  border: 3px solid #111827;
  border-radius: 0.7rem;
  color: #b91c1c;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 900;
  padding: 0.55rem 0.8rem;
  box-shadow: 4px 4px 0 var(--comic-shadow);
  transition: transform 0.15s, box-shadow 0.15s;
}

.delete-save-button:hover {
  background: #fee2e2;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--comic-shadow);
}

.progress {
  background: var(--comic-yellow);
  border: 3px solid var(--color-border);
  border-radius: 999px;
  color: #111827;
  font-weight: 900;
  padding: 0.4rem 0.9rem;
  box-shadow: 3px 3px 0 var(--comic-shadow);
}

main {
  min-width: 0;
  background: #ffffff;
  padding: 2rem;
  border: 4px solid var(--color-border);
  border-radius: 0.6rem;
  box-shadow: 10px 10px 0 var(--comic-shadow);
  position: relative;
}

main::before {
  content: "";
  position: absolute;
  inset: 10px;
  border: 2px dashed rgba(17, 24, 39, 0.2);
  pointer-events: none;
}

@media (max-width: 640px) {
  .base-layout {
    padding: 0.5rem 0;
  }

  header {
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .nav-buttons {
    width: 100%;
  }

  .back-button {
    flex: 1 1 0;
    min-width: 0;
    padding: 0.55rem 0.5rem;
    font-size: 0.9rem;
  }

  .delete-save-button {
    flex: 1 1 100%;
    padding: 0.55rem 0.5rem;
    font-size: 0.85rem;
  }

  .progress {
    padding: 0.3rem 0.75rem;
    font-size: 0.85rem;
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
