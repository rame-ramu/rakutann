<template>
  <BaseLayout>
    <div class="schedule-view">
      <h2 class="title">いつ空いてる？</h2>
      <p class="description">授業を入れたい曜日と時間を選んでください。<br>何個選んでも大丈夫です。</p>

      <div class="grid-container">
        <div class="schedule-grid">
          <div class="grid-header"></div>
          <div v-for="day in days" :key="day" class="grid-header day-label">{{ day }}</div>
          
          <template v-for="period in periods" :key="period">
            <div class="period-label">
              <span class="num">{{ period }}</span>
              <span class="unit">限</span>
            </div>
            <div 
              v-for="day in days" 
              :key="`${day}-${period}`"
              class="grid-cell"
              :class="{ active: isSelected(day, period) }"
              @click="store.toggleSchedule(day, period)"
            >
              <div class="cell-inner">
                <span v-if="isSelected(day, period)" class="check">✨</span>
              </div>
            </div>
          </template>
        </div>
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
        class="jewel-button"
      >
        <span>結果を見る</span>
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

.title {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--theme-text);
  font-weight: 800;
}

.description {
  margin-bottom: 2.5rem;
  color: var(--theme-text);
  opacity: 0.7;
  line-height: 1.6;
  font-weight: 500;
}

.grid-container {
  background: white;
  padding: 1.5rem 1rem;
  border-radius: 2.5rem;
  border: 3px solid var(--theme-lavender);
  margin-bottom: 2rem;
  box-shadow: 0 10px 20px var(--theme-shadow);
}

.schedule-grid {
  display: grid;
  grid-template-columns: 40px repeat(5, 1fr);
  gap: 10px;
}

.grid-header {
  font-weight: 800;
  color: var(--theme-text);
  padding-bottom: 0.5rem;
  font-size: 1rem;
}

.period-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.period-label .num {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--theme-text);
  line-height: 1;
}

.period-label .unit {
  font-size: 0.7rem;
  color: var(--theme-text);
  opacity: 0.5;
  font-weight: 700;
}

.grid-cell {
  aspect-ratio: 1;
  background: var(--theme-cream);
  border: 3px solid transparent;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-cell:hover {
  transform: scale(1.05);
  background-color: white;
  border-color: var(--theme-pink);
}

.grid-cell.active {
  background-color: var(--theme-lavender);
  border-color: var(--theme-jewel);
  transform: scale(1.1);
  box-shadow: 0 8px 20px var(--theme-shadow);
}

.check {
  font-size: 1.2rem;
  animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
  0% { transform: scale(0) rotate(-45deg); }
  100% { transform: scale(1) rotate(0); }
}

.selection-info {
  margin-bottom: 2.5rem;
  height: 1.5rem;
  font-weight: 700;
  color: var(--theme-text);
}

.selection-info .hint {
  opacity: 0.5;
  font-size: 0.9rem;
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
}

.jewel-button:disabled {
  background: #e2e8f0;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.6;
}

.jewel-button:not(:disabled):hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.jewel-button:not(:disabled):active {
  transform: translateY(4px);
  box-shadow: 0 4px 0 #e91e6344, 0 8px 15px #ff80ab44;
}
</style>
