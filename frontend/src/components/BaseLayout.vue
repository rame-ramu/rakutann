<template>
  <div class="base-layout">
    <Sparkles />
    <Mascot :message="mascotMessage" />
    
    <header v-if="$route.name !== 'student-id'">
      <button @click="$router.back()" class="back-button">← もどる</button>
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
import Sparkles from './Sparkles.vue'
import Mascot from './Mascot.vue'

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

const mascotMessage = computed(() => {
  switch (route.name) {
    case 'student-id': return 'おつかれさま！今日は楽単日和だよ。ゆっくり進もうね。'
    case 'conditions': return 'どんな授業がいいかな？いっしょに考えよう。'
    case 'schedule': return '予定をあてはめてみよう。無理しすぎないでね。'
    case 'results': return 'あなたにぴったりの授業が見つかったよ！'
    default: return 'ゆっくりしていってね。'
  }
})
</script>

<style scoped>
.base-layout {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 1.5rem;
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  z-index: 10;
}

.back-button {
  background: white;
  border: 2px solid var(--theme-pink);
  color: var(--theme-text);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 4px 0 var(--theme-pink);
  transition: all 0.2s;
}

.back-button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--theme-pink);
}

.progress {
  font-weight: 800;
  color: var(--theme-jewel);
  background: white;
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  border: 2px solid var(--theme-lavender);
}

main {
  background: white;
  padding: 2.5rem 2rem;
  border-radius: 2.5rem;
  box-shadow: 0 15px 35px var(--theme-shadow);
  border: 4px solid var(--theme-lavender);
  z-index: 5;
  flex-grow: 1;
  margin-bottom: 2rem;
}
</style>
