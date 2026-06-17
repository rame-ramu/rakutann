<template>
  <BaseLayout>
    <div class="schedule-view">
      <h2 class="magic-title">運命の時間帯</h2>
      <p class="description">魔法を発動させたい曜日と時間を選んでください。<br>白いマスをタップして聖域を決めましょう。</p>

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
                class="magic-cell"
              >
                <div class="cell-content">
                  <div v-if="isSelected(day, period)" class="check">💖</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="selection-info">
        <p v-if="store.selectedSchedule.length > 0">
          <strong>{{ store.selectedSchedule.length }}つの聖域</strong> を選択中
        </p>
        <p v-else class="hint">タップして聖域を有効化してください</p>
      </div>

      <div class="action-container">
        <button 
          :disabled="store.selectedSchedule.length === 0"
          @click="$router.push('/results')"
          class="m-action-btn next-button"
        >
          結果を召喚する <span>🪄</span>
        </button>
      </div>
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

.magic-title {
  font-size: 1.75rem;
  margin-bottom: 1rem;
}

.description {
  margin-bottom: 2rem;
  color: var(--magic-text-sub);
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.6;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.4);
  padding: 0.75rem;
  border-radius: var(--magic-radius-md);
  border: 2px solid var(--magic-silver);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0.4rem;
}

th {
  padding: 0.4rem;
  color: var(--magic-text-heading);
  font-weight: 800;
  font-size: 1rem;
}

.magic-cell {
  background: white;
  border: 1px solid var(--magic-silver);
  height: 3.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

td.period-label {
  background: none;
  border: none;
  width: 2.5rem;
  cursor: default;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.period-label .num {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--magic-text-heading);
  line-height: 1;
}

.period-label .unit {
  font-size: 0.7rem;
  color: var(--magic-text-sub);
  font-weight: 800;
}

.magic-cell.selected {
  background: linear-gradient(135deg, var(--magic-pink-bg) 0%, var(--magic-white) 100%);
  border-color: var(--magic-pink-accent);
  box-shadow: 0 4px 15px var(--magic-shadow-pink);
}

.selection-info {
  margin-bottom: 2rem;
  height: 1.5rem;
}

.selection-info p {
  margin: 0;
  color: var(--magic-text-main);
  font-weight: 800;
}

.selection-info .hint {
  color: var(--magic-text-sub);
  font-size: 0.85rem;
  font-weight: 700;
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
