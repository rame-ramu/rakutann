<template>
  <BaseLayout>
    <div class="condition-view">
      <h2 class="magic-title">どんな魔法が必要？</h2>
      <p class="description">限界を乗り越えるための希望を選んでください。<br>カードをタップして魔法をセットしましょう。✨</p>

      <div class="cards-grid">
        <div 
          v-for="tag in availableTags" 
          :key="tag"
          :class="{ active: store.selectedConditions.includes(tag) }"
          @click="store.toggleCondition(tag)"
          class="m-card-item"
        >
          <div class="card-corners"></div>
          <div class="card-watermark">❂</div>
          <div class="card-top-icon">{{ getIcon(tag) }}</div>
          <div class="card-title">{{ tag }}</div>
          <div class="card-footer">
            <div class="card-divider"></div>
            <div class="card-sub">{{ getSubText(tag) }}</div>
          </div>
        </div>
      </div>

      <div class="action-container">
        <button 
          @click="$router.push('/schedule')"
          class="m-action-btn next-button"
        >
          魔法を確定する <span>→</span>
        </button>
      </div>
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
    'らくたん': '🌸',
    '出席なし': '☁️',
    'テストなし': '💎',
    'レポートのみ': '📜',
    'オンライン': '🔮',
    '面白い': '🍿',
    '実用的': '🛠️',
    '友達ができる': '🤝'
  }
  return icons[tag] || '🏷️'
}

const getSubText = (tag: string) => {
  const subs: Record<string, string> = {
    'らくたん': 'EASY PASS',
    '出席なし': 'FREE TIME',
    'テストなし': 'NO EXAM',
    'レポートのみ': 'WRITING',
    'オンライン': 'REMOTE',
    '面白い': 'EXCITING',
    '実用的': 'SKILLS',
    '友達ができる': 'NETWORK'
  }
  return subs[tag] || 'MAGIC'
}
</script>

<style scoped>
.condition-view {
  text-align: center;
}

.magic-title {
  font-size: 1.75rem;
  margin-bottom: 1rem;
}

.description {
  margin-bottom: 2.5rem;
  color: var(--magic-text-sub);
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.6;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem; /* Slightly reduced for more compact fit if needed, or keep for spacing */
  margin-bottom: 4rem;
  padding: 0; /* Removed padding to use full width */
}

.action-container {
  display: flex;
  justify-content: center;
}

.next-button {
  width: 100%;
  max-width: 320px;
}
</style>
