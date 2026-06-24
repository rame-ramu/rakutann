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
                <span class="time">{{ getPeriodTime(period) }}</span>
              </td>
              <td 
                v-for="day in days" 
                :key="day"
                :class="{ selected: isSelected(day, period), locked: getCandidateCourses(day, period).length > 0 }"
                @click="store.toggleSchedule(day, period)"
              >
                <div class="cell-content">
                  <div v-if="getCandidateCourses(day, period).length > 0" class="candidate-slot">
                    <span
                      v-for="course in getCandidateCourses(day, period).slice(0, 2)"
                      :key="course.id"
                    >
                      {{ displayCourseName(course.name) }}
                      <small v-if="store.classrooms[course.id]">{{ store.classrooms[course.id] }}</small>
                    </span>
                  </div>
                  <div v-else-if="isSelected(day, period)" class="check">✓</div>
                  <div v-else class="empty-slot">
                    追加
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="selection-info">
        <p v-if="selectedAddSlotCount > 0">
          追加ボタンで <strong>{{ selectedAddSlotCount }}つ</strong> のコマを選択中
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

      <div v-if="store.candidateCourses.length > 0" class="registered-section">
        <h3>登録済みの授業</h3>
        <div class="registered-list">
          <div
            v-for="course in store.candidateCourses"
            :key="course.id"
            class="registered-item"
            @mousedown="startClassroomPress(course)"
            @mouseup="cancelClassroomPress"
            @mouseleave="cancelClassroomPress"
            @touchstart.passive="startClassroomPress(course)"
            @touchend="cancelClassroomPress"
            @touchcancel="cancelClassroomPress"
          >
            <div>
              <span>{{ course.day }}{{ course.period }}限 {{ course.period ? getPeriodTime(course.period) : '' }}</span>
              <p>{{ displayCourseName(course.name) }}</p>
              <small>{{ store.classrooms[course.id] ? `教室 ${store.classrooms[course.id]}` : '長押しで教室番号を登録' }}</small>
            </div>
            <button @click.stop="store.removeCandidateCourse(course.id)">登録解除</button>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseLayout from '../components/BaseLayout.vue'
import { store, type Course } from '../store'

const days = ['月', '火', '水', '木', '金']
const periods = [1, 2, 3, 4, 5]
const periodTimes: Record<number, string> = {
  1: '9:30〜11:00',
  2: '11:10〜12:40',
  3: '13:30〜15:00',
  4: '15:10〜16:40',
  5: '16:50〜18:20',
}
let classroomPressTimer: number | undefined

const isSelected = (day: string, period: number) => {
  return store.selectedSchedule.some(s => s.day === day && s.period === period)
}

const getCandidateCourses = (day: string, period: number) => {
  return store.candidateCourses.filter((course: Course) => course.day === day && course.period === period)
}

const selectedAddSlotCount = computed(() => {
  return store.selectedSchedule.filter((slot) => getCandidateCourses(slot.day, slot.period).length === 0).length
})

const displayCourseName = (name: string) => {
  return name.split('／')[0]
}

const getPeriodTime = (period: number) => {
  return periodTimes[period] || ''
}

const startClassroomPress = (course: Course) => {
  cancelClassroomPress()
  classroomPressTimer = window.setTimeout(() => {
    const current = store.classrooms[course.id] || ''
    const classroom = window.prompt(`${displayCourseName(course.name)}の教室番号`, current)
    if (classroom !== null) {
      store.setClassroom(course.id, classroom)
    }
  }, 600)
}

const cancelClassroomPress = () => {
  if (classroomPressTimer !== undefined) {
    window.clearTimeout(classroomPressTimer)
    classroomPressTimer = undefined
  }
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

.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

td.period-label {
  background: none;
  border: none;
  width: 4.6rem;
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

.period-label .time {
  margin-top: 0.15rem;
  color: #64748b;
  font-size: 0.52rem;
  font-weight: 700;
  white-space: nowrap;
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

td.locked {
  background-color: #0f766e;
  border-color: #0f766e;
  cursor: not-allowed;
}

td.locked:hover {
  background-color: #0f766e;
  border-color: #0f766e;
}

.check {
  color: white;
  font-weight: bold;
  font-size: 1.25rem;
}

.candidate-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1.15;
  width: 100%;
  padding: 0 0.25rem;
}

.candidate-slot span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.candidate-slot small {
  display: block;
  margin-top: 0.12rem;
  font-size: 0.58rem;
  font-weight: 800;
  opacity: 0.9;
}

.empty-slot {
  color: #cbd5e1;
  font-size: 0.75rem;
  font-weight: 700;
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

.registered-section {
  margin-top: 2rem;
  text-align: left;
}

.registered-section h3 {
  margin: 0 0 1rem;
  color: #334155;
  font-size: 1rem;
}

.registered-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.registered-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  user-select: none;
}

.registered-item span {
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 800;
}

.registered-item p {
  margin: 0.25rem 0 0;
  color: #0f172a;
  font-weight: 700;
  line-height: 1.4;
}

.registered-item small {
  display: block;
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
}

.registered-item button {
  padding: 0.6rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: white;
  color: #64748b;
  cursor: pointer;
  font-weight: 700;
}
</style>
