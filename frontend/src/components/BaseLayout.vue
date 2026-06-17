<template>
  <div class="base-layout">
    <!-- Magical background decorations -->
    <div class="magic-bg-item deco-1">🎀</div>
    <div class="magic-bg-item deco-2">⭐</div>
    <div class="magic-bg-item deco-3">💖</div>
    <div class="magic-bg-item deco-4">💎</div>

    <header v-if="$route.name !== 'student-id'">
      <div class="back-charm-container">
        <button @click="$router.back()" class="m-charm-btn" title="戻る">
          <span class="icon">←</span>
        </button>
      </div>
      <div class="header-right">
        <div class="progress-badge">Step {{ currentStep }} / 4</div>
        <button class="m-aux-btn">ヘルプ</button>
      </div>
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
  max-width: 800px; /* Increased from 600px */
  margin: 0 auto;
  padding: 0.75rem 0.5rem 5rem 0.5rem; /* Reduced horizontal padding */
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem; /* Slightly reduced */
  padding: 0.5rem 0.75rem;
}

.back-charm-container {
  padding-top: 5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-badge {
  font-weight: 800;
  color: var(--magic-text-sub);
  font-size: 0.8rem;
  background: var(--glass-bg);
  padding: 0.4rem 1rem;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

main {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 2rem 1rem; /* Reduced horizontal and vertical padding */
  border-radius: var(--magic-radius-lg);
  border: 1px solid var(--glass-border);
  box-shadow: 0 20px 50px var(--magic-shadow-pink);
  position: relative;
  z-index: 1;
}

.magic-bg-item {
  position: fixed;
  z-index: 0;
  font-size: 2.2rem; /* Slightly smaller */
  animation: magic-float-complex 8s infinite ease-in-out;
  opacity: 0.2; /* More subtle */
}

.deco-1 { top: 10%; left: -20px; animation-delay: 0s; }
.deco-2 { top: 2%; right: -15px; animation-delay: 2s; font-size: 2.5rem; }
.deco-3 { bottom: 8%; left: -10px; animation-delay: 1s; }
.deco-4 { bottom: 15%; right: -20px; animation-delay: 3s; }

@keyframes magic-float-complex {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
  50% { transform: translateY(-30px) rotate(15deg) scale(1.1); }
}
</style>
