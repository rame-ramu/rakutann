<template>
  <BaseLayout>
    <div class="schedule-view">
      <h2 class="manga-title">いつ空いてる？</h2>
      <p class="description">授業を入れたい曜日と時間を選んでください。<br>何個選んでも大丈夫です。</p>

      <div class="table-container manga-panel">
        <table>
          <thead>
            <tr>
              <th></th>
              <th v-for="day in days" :key="day">{{ day }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="period in periods" :key="period">
              <td class="period-label">
                <span class="num">{{ period }}</span>
                <span class="unit">限</span>
              </td>
              <td 
                v-for="day in days" 
                :key="day"
                :class="{ selected: isSelected(day, period) }"
                @click="store.toggleSchedule(day, period)"
                class="schedule-cell"
              >
                <div class="cell-content">
                  <div v-if="isSelected(day, period)" class="check">必</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="selection-info manga-badge-container">
        <p v-if="store.selectedSchedule.length > 0" class="manga-badge">
          <strong>{{ store.selectedSchedule.length }}つ</strong> のコマを選択中ッ！
        </p>
        <p v-else class="hint">マスをタップして選択してください</p>
      </div>

      <button 
        :disabled="store.selectedSchedule.length === 0"
        @click="$router.push('/results')"
        class="next-button manga-button"
      >
        結果!!
      </button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from '../components/BaseLayout.vue'
import { store } from '../store'

const days = ['月', '火', '水', '木', '金']
const periods = [1, 2, 3, 4, 5]

const isSelected = (day: string, period: number) => {
  return store.selectedSchedule.some(s => s.day === day && s.period === period)
}
</script>

<style scoped>
.schedule-view {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.manga-title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
  font-weight: 900;
  text-shadow: 3px 3px 0 var(--color-manga-accent-secondary);
}

.description {
  margin-bottom: 2.5rem;
  color: var(--color-text);
  line-height: 1.6;
  font-weight: 700;
}

.manga-panel {
  background: white;
  padding: 1rem;
  border-radius: 1rem;
  border: 4px solid var(--color-manga-accent);
  box-shadow: 8px 8px 0 var(--color-manga-accent-secondary);
  margin-bottom: 3rem;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0.5rem;
}

th {
  padding: 0.5rem;
  color: var(--color-heading);
  font-weight: 900;
  font-size: 1.2rem;
}

.schedule-cell {
  background: white;
  border: 3px solid var(--color-heading);
  height: 4.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.1s;
  position: relative;
}

.schedule-cell:hover {
  background-color: #fef2f2;
  border-color: var(--color-manga-accent);
}

.schedule-cell.selected {
  background-color: var(--color-manga-accent-secondary);
  border-color: var(--color-heading);
  transform: scale(1.05) rotate(1deg);
  box-shadow: 4px 4px 0 var(--color-heading);
  z-index: 5;
}

td.period-label {
  background: none;
  border: none;
  width: 3.5rem;
  cursor: default;
}

.period-label .num {
  font-size: 1.75rem;
  font-weight: 900;
  color: var(--color-heading);
  line-height: 1;
}

.period-label .unit {
  font-size: 0.8rem;
  color: var(--color-text);
  font-weight: 900;
}

.check {
  color: white;
  font-weight: 900;
  font-size: 1.5rem;
}

.selection-info {
  margin-bottom: 2.5rem;
  height: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.manga-badge {
  background: var(--color-manga-accent);
  padding: 0.5rem 1.5rem;
  border: 3px solid var(--color-heading);
  border-radius: 0.5rem;
  font-weight: 900;
  color: white;
  transform: rotate(-2deg);
  box-shadow: 4px 4px 0 var(--color-manga-accent-secondary);
}

.hint {
  color: var(--color-text-muted);
  font-weight: 700;
}

.manga-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.5rem;
  font-weight: 900;
  background-color: var(--color-heading);
  color: white;
  border: 4px solid var(--color-manga-accent);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.1s;
  box-shadow: 6px 6px 0 var(--color-manga-accent-secondary);
}

.manga-button:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--color-manga-accent);
}

.manga-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--color-manga-accent);
}

.manga-button:disabled {
  background-color: #e4e4e7;
  color: #a1a1aa;
  border-color: #d4d4d8;
  box-shadow: none;
  cursor: not-allowed;
}
</style>
