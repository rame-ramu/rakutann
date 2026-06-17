<template>
  <BaseLayout>
    <div class="schedule-selection-page">
      <h2>いつ空いてる？</h2>
      <p class="instruction-text">
        授業を入れたい曜日と時間を選んでください。<br>
        何個選んでも大丈夫です。
      </p>

      <!-- 曜日と時限の選択テーブル -->
      <div class="schedule-grid-container">
        <table class="schedule-table">
          <thead>
            <tr>
              <!-- 左上の空白セル -->
              <th></th>
              <th v-for="dayName in availableDays" :key="dayName">{{ dayName }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="periodNumber in availablePeriods" :key="periodNumber">
              <!-- 行の先頭（時限ラベル） -->
              <td class="period-label-cell">
                <span class="period-num">{{ periodNumber }}</span>
                <span class="period-unit">限</span>
              </td>
              
              <!-- 各コマのセル -->
              <td 
                v-for="dayName in availableDays" 
                :key="dayName"
                :class="{ 'is-selected': isTimeSlotSelected(dayName, periodNumber) }"
                @click="handleTimeSlotClick(dayName, periodNumber)"
              >
                <div class="cell-inner-content">
                  <!-- 選択されている時だけチェックマークを表示 -->
                  <div v-if="isTimeSlotSelected(dayName, periodNumber)" class="selection-check">✓</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 現在の選択状況を表示 -->
      <div class="selection-status-area">
        <p v-if="store.selectedSchedule.length > 0" class="status-active">
          <strong>{{ store.selectedSchedule.length }}つ</strong> のコマを選択中
        </p>
        <p v-else class="status-hint">マスをタップして選択してください</p>
      </div>

      <!-- 結果画面へのボタン（1つ以上選択されていないと押せません） -->
      <button 
        :disabled="!isAnyTimeSlotSelected"
        @click="goToResultsPage"
        class="show-results-button"
      >
        結果を見る
      </button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'
import { store } from '../store'

const router = useRouter()

// テーブルに表示する曜日と時限の定義
const availableDays = ['月', '火', '水', '木', '金']
const availablePeriods = [1, 2, 3, 4, 5]

/**
 * 1つ以上のコマが選択されているかどうかを判定する計算プロパティ
 */
const isAnyTimeSlotSelected = computed(() => {
  return store.selectedSchedule.length > 0
})

/**
 * 特定の曜日・時限が現在選択されているかを判定する関数
 */
function isTimeSlotSelected(day: string, period: number): boolean {
  return store.selectedSchedule.some(
    slot => slot.day === day && slot.period === period
  )
}

/**
 * コマがクリックされた時の処理（選択・解除を切り替える）
 */
function handleTimeSlotClick(day: string, period: number) {
  store.toggleSchedule(day, period)
}

/**
 * 結果表示ページへ移動する関数
 */
function goToResultsPage() {
  router.push('/results')
}
</script>

<style scoped>
.schedule-selection-page {
  text-align: center;
}

h2 {
  font-size: 1.8rem;
  margin-bottom: 0.75rem;
  color: #2D3436;
  font-weight: 900;
}

.instruction-text {
  margin-bottom: 2rem;
  color: #4A5568;
  line-height: 1.6;
  font-weight: 700;
}

/* スケジュール表のコンテナ */
.schedule-grid-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
  background: #FFFFFF;
  padding: 1rem;
  border-radius: 1.5rem;
  border: 3px solid #2D3436;
}

.schedule-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0.5rem;
}

.schedule-table th {
  padding: 0.5rem;
  color: #2D3436;
  font-weight: 900;
  font-size: 1.1rem;
}

/* 各コマのセルスタイル */
.schedule-table td {
  background: white;
  border: 2px solid #2D3436;
  height: 3.5rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.1s;
  position: relative;
  box-shadow: 2px 2px 0 #2D3436;
}

/* 時限（1限、2限...）のラベルセル */
.period-label-cell {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  width: 3rem;
  cursor: default !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.period-num {
  font-size: 1.4rem;
  font-weight: 900;
  color: #2D3436;
  line-height: 1;
}

.period-unit {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 800;
}

/* ホバー時の挙動 */
.schedule-table td:not(.period-label-cell):hover {
  background-color: #F8F9FA;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 #2D3436;
}

/* 選択済みセルのスタイル（水色になる） */
.schedule-table td.is-selected {
  background-color: #4FB3E8; 
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #2D3436;
}

.selection-check {
  color: white;
  font-weight: 900;
  font-size: 1.4rem;
}

/* 選択状況メッセージエリア */
.selection-status-area {
  margin-bottom: 2rem;
  height: 1.5rem;
}

.status-active {
  margin: 0;
  color: #2D3436;
  font-weight: 800;
}

.status-hint {
  color: #718096;
  font-size: 0.9rem;
  font-weight: 700;
}

/* 結果を見るボタン */
.show-results-button {
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

.show-results-button:disabled {
  background-color: #CBD5E0;
  box-shadow: 3px 3px 0 #2D3436;
  color: #718096;
  cursor: not-allowed;
  opacity: 0.8;
}

.show-results-button:not(:disabled):hover {
  background: #75C6F0;
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 #2D3436;
}

.show-results-button:active:not(:disabled) {
  transform: translate(3px, 3px);
  box-shadow: 2px 2px 0 #2D3436;
}
</style>