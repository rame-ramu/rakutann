<template>
  <BaseLayout>
    <div class="schedule-view">
      <h2>いつ空いてる？</h2>
      <p class="description">授業を入れたい曜日と時間を選んでください。<br>何個選んでも大丈夫です。</p>

      <div class="table-container">
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
              >
                <div class="cell-content">
                  <div v-if="isSelected(day, period)" class="check">✓</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="selection-info">
        <p v-if="store.selectedSchedule.length > 0">
          <strong>{{ store.selectedSchedule.length }}つ</strong> のコマを選択中
        </p>
        <p v-else class="hint">マスをタップして選択してください</p>
      </div>

      <button 
        :disabled="store.selectedSchedule.length === 0"
        @click="$router.push('/results')"
        class="next-button"
      >
        結果を見る
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

.table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 1.5rem;
  border: 1px solid #e2e8f0;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0.5rem;
}

th {
  padding: 0.5rem;
  color: #64748b;
  font-weight: 700;
  font-size: 1.1rem;
}

td {
  background: white;
  border: 1px solid #e2e8f0;
  height: 3.5rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

td.period-label {
  background: none;
  border: none;
  width: 3rem;
  cursor: default;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.period-label .num {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.period-label .unit {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
}

td:not(.period-label):hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

td.selected {
  background-color: #3b82f6;
  border-color: #3b82f6;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.check {
  color: white;
  font-weight: bold;
  font-size: 1.25rem;
}

.selection-info {
  margin-bottom: 2rem;
  height: 1.5rem;
}

.selection-info p {
  margin: 0;
  color: #475569;
}

.selection-info .hint {
  color: #94a3b8;
  font-size: 0.9rem;
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

.next-button:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

.next-button:not(:disabled):hover {
  background-color: #2563eb;
  transform: translateY(-2px);
}
</style>
