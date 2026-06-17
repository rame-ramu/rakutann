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
  /* スマホ・PC共通の基本設定 */
  margin: 0 auto;
  padding: 1.5rem;
  min-height: 100vh;
  background-color: #FFFFFF; /* Pure white background */
  color: #2D3436;
  font-family: 'Hiragino Maru Gothic ProN', 'Rounded M+ 1c', 'Yu Gothic', 'Meiryo', sans-serif;
  line-height: 1.6;

  /* スマホ（768px以下）のデフォルト幅 */
  max-width: 480px; 
}

/* PC用のレスポンシブ対応（画面幅が769px以上の場合） */
@media (min-width: 769px) {
  .base-layout {
    /* PCではコンテンツを広く見せるために最大幅を広げる */
    max-width: 900px; 
  }
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 0.5rem;
}

.back-button {
  background: #FFF;
  border: 2px solid #2D3436;
  color: #2D3436;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-weight: 800;
  box-shadow: 3px 3px 0 #2D3436;
  transition: all 0.1s;
}

.back-button:hover {
  background: #F8F9FA;
}

.back-button:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 #2D3436;
}

.progress {
  font-weight: 800;
  font-size: 0.9rem;
  color: #FFF;
  background: #4FB3E8; /* Light Blue Theme */
  padding: 0.4rem 1.2rem;
  border-radius: 2rem;
  border: 2px solid #2D3436;
  box-shadow: 3px 3px 0 #2D3436;
}

main {
  background: white;
  padding: 2.5rem 1.5rem;
  border-radius: 2rem;
  border: 3px solid #2D3436;
  box-shadow: 6px 6px 0 rgba(45, 52, 54, 0.1);
  position: relative;
}
</style>
