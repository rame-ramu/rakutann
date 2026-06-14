<template>
  <BaseLayout>
    <div class="condition-view">
      <h2>どんな授業がいい？</h2>
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
        class="next-button"
      >
        次へ進む
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

h2 {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
  color: #1e293b;
}

.description {
  margin-bottom: 2.5rem;
  color: #64748b;
  line-height: 1.6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3.5rem;
}

.tag-button {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 3rem;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-button:hover {
  border-color: #cbd5e1;
  background-color: #f8fafc;
}

.tag-button.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.next-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.next-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
}
</style>
