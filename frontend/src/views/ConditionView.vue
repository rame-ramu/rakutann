<template>
  <BaseLayout>
    <div class="condition-view">
      <h2 class="title">どんな授業がいい？</h2>
      <p class="description">無理のない範囲で、あなたの希望を教えてください。<br>複数選んでも大丈夫です。</p>

      <div class="tags">
        <button 
          v-for="tag in availableTags" 
          :key="tag"
          :class="{ active: store.selectedConditions.includes(tag) }"
          @click="store.toggleCondition(tag)"
          class="tag-button"
        >
          <span class="icon">{{ getIcon(tag) }}</span>
          {{ tag }}
        </button>
      </div>

      <button 
        @click="$router.push('/schedule')"
        class="jewel-button"
      >
        <span>次へ進む</span>
      </button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from '../components/BaseLayout.vue'
import { store } from '../store'

const availableTags = [
  'らくたん',
  '出席なし',
  'テストなし',
  'レポートのみ',
  'オンライン',
  '面白い',
  '実用的',
  '友達ができる'
]

const getIcon = (tag: string) => {
  const icons: Record<string, string> = {
    'らくたん': '✨',
    '出席なし': '🛌',
    'テストなし': '📝',
    'レポートのみ': '💻',
    'オンライン': '🏠',
    '面白い': '🍿',
    '実用的': '🛠️',
    '友達ができる': '🤝'
  }
  return icons[tag] || '🏷️'
}
</script>

<style scoped>
.condition-view {
  text-align: center;
}

.title {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--theme-text);
  font-weight: 800;
}

.description {
  margin-bottom: 3rem;
  color: var(--theme-text);
  opacity: 0.7;
  line-height: 1.8;
  font-weight: 500;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  justify-content: center;
  margin-bottom: 4rem;
}

.tag-button {
  padding: 0.8rem 1.6rem;
  border: 3px solid var(--theme-pink);
  background: white;
  border-radius: 3rem;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--theme-text);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  box-shadow: 0 4px 0 var(--theme-pink);
}

.tag-button:hover {
  transform: translateY(-2px);
  background-color: var(--theme-cream);
}

.tag-button.active {
  background-color: var(--theme-lavender);
  border-color: var(--theme-jewel);
  color: var(--theme-text);
  transform: scale(1.1);
  box-shadow: 0 6px 0 var(--theme-jewel-light);
}

.jewel-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--theme-jewel-light), var(--theme-jewel));
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 0 #e91e6344, 0 15px 25px #ff80ab44;
  position: relative;
  overflow: hidden;
}

.jewel-button:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.jewel-button:active {
  transform: translateY(4px);
  box-shadow: 0 4px 0 #e91e6344, 0 8px 15px #ff80ab44;
}
</style>
