<template>
  <BaseLayout>
    <div class="condition-view">
      <div v-if="store.department && !store.isHumanInfoStudent" class="unsupported-message">
        <h2>あなたに対応してません</h2>
        <p class="description">このシラバスは人間情報学部の学生のみ利用できます。</p>
        <button @click="$router.push('/')" class="next-button">学籍番号を入力し直す</button>
      </div>

      <template v-else>
        <h2>どんな授業がいい？</h2>
        <p class="description">無理のない範囲で、あなたの希望を教えてください。<br>複数選んでも大丈夫です。</p>

        <div v-for="group in tagGroups" :key="group.title" class="condition-group">
          <h3>{{ group.title }}</h3>
          <div class="tags">
            <button
              v-for="tag in group.tags"
              :key="tag"
              :class="{ active: store.selectedConditions.includes(tag) }"
              @click="store.toggleCondition(tag)"
              class="tag-button"
            >
              <span class="icon">{{ getIcon(tag) }}</span>
              {{ tag }}
            </button>
          </div>
        </div>

        <div class="teacher-filter">
          <label for="avoided-teachers">受けたくない先生</label>
          <input
            id="avoided-teachers"
            :value="store.avoidedTeachersText"
            type="text"
            placeholder="例: 山田、Suzuki"
            @input="store.setAvoidedTeachers(($event.target as HTMLInputElement).value)"
          />
        </div>

        <button 
          @click="$router.push('/schedule')"
          class="next-button"
        >
          次へ進む
        </button>
      </template>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from '../components/BaseLayout.vue'
import { store } from '../store'

const tagGroups = [
  {
    title: '成績評価',
    tags: [
      'レポート・課題重視',
      'レポート・課題あり',
      '試験あり',
      '試験重視',
      '試験なし',
      '出席点なし',
      '出席点低め',
      '出席点高め',
    ],
  },
  {
    title: '授業形態',
    tags: [
      'オンデマンド多め',
      'オンデマンド少なめ',
      'オンデマンドなし',
      'すべてオンデマンド',
      '前提履修なし',
      '前提履修あり',
    ],
  },
  {
    title: '受けたい系統',
    tags: [
      '情報・データ',
      '心理・人間',
      'ビジネス・経営',
      '語学・国際',
      'デザイン・表現',
      '健康・福祉',
      '教育・文学',
      '法律・社会',
      'その他',
    ],
  },
]

const getIcon = (tag: string) => {
  const icons: Record<string, string> = {
    'レポート・課題重視': '📝',
    'レポート・課題あり': '📄',
    '試験あり': '有',
    '試験重視': '✍️',
    '試験なし': '🚫',
    '出席点なし': '0',
    '出席点低め': '↓',
    '出席点高め': '↑',
    'オンデマンド多め': '▶',
    'オンデマンド少なめ': '◐',
    'オンデマンドなし': '□',
    'すべてオンデマンド': '◎',
    '前提履修なし': '✓',
    '前提履修あり': '要',
    '情報・データ': '💻',
    '心理・人間': '🧠',
    'ビジネス・経営': '💼',
    '語学・国際': '🌐',
    'デザイン・表現': '🎨',
    '健康・福祉': '＋',
    '教育・文学': '本',
    '法律・社会': '§',
    'その他': '…',
  }
  return icons[tag] || '🏷️'
}
</script>

<style scoped>
.condition-view {
  text-align: center;
}

.unsupported-message {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.condition-group {
  margin-bottom: 2rem;
  text-align: left;
}

.condition-group h3 {
  margin: 0 0 0.875rem;
  color: #334155;
  font-size: 1rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-start;
}

.tag-button {
  padding: 0.7rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 3rem;
  cursor: pointer;
  font-size: 0.95rem;
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

.teacher-filter {
  margin: 2.5rem 0 3rem;
  text-align: left;
}

.teacher-filter label {
  display: block;
  margin-bottom: 0.75rem;
  color: #334155;
  font-weight: 700;
}

.teacher-filter input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.875rem;
  color: #1e293b;
  font-size: 1rem;
}

.teacher-filter input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
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
