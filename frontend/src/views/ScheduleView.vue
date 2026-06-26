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
                      class="slot-course"
                    >
                      <span class="slot-course-name">{{ displayCourseName(course.name) }}</span>
                      <small v-if="store.classrooms[course.id]" class="classroom-badge">
                        {{ store.classrooms[course.id] }}
                      </small>
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
          授業を追加ボタンで <strong>{{ selectedAddSlotCount }}つ</strong> のコマを選択中
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
  color: #111827;
  font-weight: 900;
  text-shadow: 2px 2px 0 var(--comic-yellow);
}

.description {
  margin-bottom: 2.5rem;
  color: #111827;
  font-weight: 700;
  line-height: 1.6;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
  background: #fffdf4;
  padding: 1rem;
  border-radius: 0.7rem;
  border: 4px solid #111827;
  box-shadow: 7px 7px 0 #111827;
}

table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0.5rem;
}

th:first-child {
  width: 7.5rem;
}

th {
  padding: 0.5rem;
  color: #111827;
  font-weight: 900;
  font-size: 1.1rem;
}

td {
  background: white;
  border: 3px solid #111827;
  height: 3.5rem;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

td.period-label {
  background: none;
  border: none;
  width: 7.5rem;
  cursor: default;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.2rem;
  flex-wrap: wrap;
}

.period-label .num {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.period-label .unit {
  font-size: 0.9rem;
  color: #111827;
  font-weight: 900;
}

.period-label .time {
  flex-basis: 100%;
  margin-top: 0.1rem;
  color: #111827;
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

td:not(.period-label):hover {
  border-color: #111827;
  background-color: #fff8ad;
  box-shadow: 4px 4px 0 #111827;
}

td.selected {
  background-color: var(--comic-green);
  border-color: #111827;
  transform: scale(1.05);
  box-shadow: 4px 4px 0 #111827;
}

td.locked {
  background-color: #d4d4d8;
  border-color: #111827;
  cursor: not-allowed;
}

td.locked:hover {
  background-color: #d4d4d8;
  border-color: #111827;
}

.check {
  color: #111827;
  font-weight: bold;
  font-size: 1.25rem;
}

.candidate-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  color: #111827;
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1.15;
  width: 100%;
  min-width: 0;
  padding: 0 0.25rem;
}

.slot-course {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.12rem;
  max-width: 100%;
  min-width: 0;
}

.slot-course-name {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow-wrap: anywhere;
}

.classroom-badge {
  display: inline-flex;
  max-width: 100%;
  min-height: 1rem;
  align-items: center;
  justify-content: center;
  padding: 0.05rem 0.25rem;
  border: 1px solid #111827;
  border-radius: 999px;
  background: var(--comic-yellow);
  color: #111827;
  font-size: 0.58rem;
  font-weight: 900;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-slot {
  color: #111827;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.selection-info {
  margin-bottom: 2rem;
  height: 1.5rem;
}

.selection-info p {
  margin: 0;
  color: #111827;
  font-weight: 800;
}

.selection-info .hint {
  color: #111827;
  font-size: 0.9rem;
}

.next-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.25rem;
  font-weight: 900;
  background-color: var(--comic-green);
  color: white;
  border: 4px solid #111827;
  border-radius: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 7px 7px 0 #111827;
}

.next-button:disabled {
  background-color: #d1d5db;
  color: #6b7280;
  cursor: not-allowed;
  box-shadow: 4px 4px 0 #111827;
}

.next-button:not(:disabled):hover {
  background-color: #008a8a;
  transform: translate(-2px, -2px);
  box-shadow: 9px 9px 0 #111827;
}

.registered-section {
  margin-top: 2rem;
  text-align: left;
}

.registered-section h3 {
  margin: 0 0 1rem;
  color: #111827;
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
  border: 3px solid #111827;
  border-radius: 0.65rem;
  background: white;
  box-shadow: 4px 4px 0 #111827;
  user-select: none;
}

.registered-item span {
  color: var(--comic-green);
  font-size: 0.8rem;
  font-weight: 800;
}

.registered-item p {
  margin: 0.25rem 0 0;
  color: #111827;
  font-weight: 700;
  line-height: 1.4;
}

.registered-item small {
  display: block;
  margin-top: 0.35rem;
  color: #111827;
  font-size: 0.75rem;
  font-weight: 700;
}

.registered-item button {
  padding: 0.6rem 0.8rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: white;
  color: #111827;
  cursor: pointer;
  font-weight: 700;
}

@media (max-width: 640px) {
  h2 {
    font-size: 1.45rem;
  }

  .description {
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .table-container {
    padding: 0.4rem;
    border-width: 3px;
    box-shadow: 5px 5px 0 #111827;
  }

  table {
    border-spacing: 0.25rem;
  }

  th:first-child,
  td.period-label {
    width: 3.65rem;
  }

  th {
    padding: 0.25rem;
    font-size: 0.9rem;
  }

  td {
    height: 3rem;
    border-width: 2px;
    border-radius: 0.45rem;
  }

  td.selected {
    transform: none;
    box-shadow: 2px 2px 0 #111827;
  }

  .period-label .num {
    font-size: 1rem;
  }

  .period-label .unit {
    font-size: 0.7rem;
  }

  .period-label .time {
    font-size: 0.52rem;
    white-space: normal;
    line-height: 1.15;
  }

  .empty-slot {
    font-size: 0;
  }

  .empty-slot::before {
    content: "+";
    font-size: 1rem;
    font-weight: 900;
  }

  .candidate-slot {
    font-size: 0.55rem;
    padding: 0 0.1rem;
    gap: 0.1rem;
  }

  .slot-course {
    gap: 0.08rem;
  }

  .classroom-badge {
    max-width: 2.7rem;
    min-height: 0.82rem;
    padding: 0 0.18rem;
    font-size: 0.48rem;
  }

  .selection-info {
    margin-bottom: 1.25rem;
    font-size: 0.85rem;
  }

  .next-button {
    padding: 1rem;
    border-width: 3px;
    font-size: 1.05rem;
    box-shadow: 5px 5px 0 #111827;
  }

  .registered-item {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.75rem;
    border-width: 2px;
    box-shadow: 3px 3px 0 #111827;
  }

  .registered-item p {
    font-size: 0.9rem;
    overflow-wrap: anywhere;
  }

  .registered-item button {
    width: 100%;
    padding: 0.55rem 0.7rem;
    border-width: 2px;
  }
}
</style>
