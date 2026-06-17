<template>
  <BaseLayout>
    <div class="condition-selection-page">
      <h2>どんな授業がいい？</h2>
      <p class="instruction-text">
        無理のない範囲で、あなたの希望を教えてください。<br>
        複数選んでも大丈夫です。
      </p>

      <!-- こだわり条件のボタン一覧 -->
      <div class="condition-tag-list">
        <button 
          v-for="tagName in availableConditionTags" 
          :key="tagName"
          :class="{ 'is-selected': isConditionActive(tagName) }"
          @click="toggleConditionSelection(tagName)"
          class="tag-selection-button"
        >
          <span class="tag-icon">{{ getIconForTag(tagName) }}</span>
          {{ tagName }}
        </button>
      </div>

      <!-- 次へボタン -->
      <button 
        @click="goToNextStep"
        class="navigation-next-button"
      >
        次へ進む
      </button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'
import { store } from '../store'

const router = useRouter()

// 選択肢として表示するタグのリスト
const availableConditionTags = [
  'らくたん',
  '出席なし',
  'テストなし',
  'レポートのみ',
  'オンライン',
  '面白い',
  '実用的',
  '友達ができる'
]

/**
 * タグ名に対応する絵文字を返す関数
 */
function getIconForTag(tagName: string): string {
  const iconMap: Record<string, string> = {
    'らくたん': '✨',
    '出席なし': '🛌',
    'テストなし': '📝',
    'レポートのみ': '💻',
    'オンライン': '🏠',
    '面白い': '🍿',
    '実用的': '🛠️',
    '友達ができる': '🤝'
  }
  return iconMap[tagName] || '🏷️'
}

/**
 * 特定のタグが現在選択されているかを判定する関数
 */
function isConditionActive(tagName: string): boolean {
  return store.selectedConditions.includes(tagName)
}

/**
 * タグの選択状態を切り替える関数（選択されていれば解除、されていなければ選択）
 */
function toggleConditionSelection(tagName: string) {
  store.toggleCondition(tagName)
}

/**
 * 「次へ進む」ボタンをクリックした時の処理
 */
function goToNextStep() {
  router.push('/schedule')
}
</script>

<style scoped>
.condition-selection-page {
  text-align: center;
}

h2 {
  font-size: 1.8rem;
  margin-bottom: 0.75rem;
  color: #2D3436;
  font-weight: 900;
}

.instruction-text {
  margin-bottom: 2.5rem;
  color: #4A5568;
  line-height: 1.6;
  font-weight: 700;
}

/* タグボタンの並び（フレックスボックス） */
.condition-tag-list {
  display: flex;
  /* デフォルト（スマホ）では縦に並びやすいように調整 */
  flex-wrap: wrap; 
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
}

/* PC用のレスポンシブ対応（画面幅が769px以上の場合） */
@media (min-width: 769px) {
  .condition-tag-list {
    /* PCでは横並びのレイアウトを強調し、少し大きな隙間を作る */
    gap: 1.5rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
}

/* 個別のタグボタンのスタイル */
.tag-selection-button {
  padding: 0.8rem 1.5rem;
  border: 3px solid #2D3436;
  background: white;
  border-radius: 3rem;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 800;
  color: #2D3436;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 4px 4px 0 #2D3436;
  font-family: inherit;
}

.tag-selection-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 #2D3436;
}

/* 選択中のタグのスタイル（水色になる） */
.tag-selection-button.is-selected {
  background-color: #4FB3E8; 
  color: white;
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #2D3436;
}

/* 次へ進むボタンのスタイル */
.navigation-next-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.4rem;
  font-weight: 900;
  background-color: #4FB3E8;
  color: white;
  border: 3px solid #2D3436;
  border-radius: 1.5rem;
  cursor: pointer;
  box-shadow: 5px 5px 0 #2D3436;
  transition: all 0.1s;
  font-family: inherit;
}

.navigation-next-button:hover {
  background: #75C6F0;
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 #2D3436;
}

.navigation-next-button:active {
  transform: translate(3px, 3px);
  box-shadow: 2px 2px 0 #2D3436;
}
</style>