<template>
  <BaseLayout>
    <div class="schedule-view">
      <section class="today-overview" aria-label="今日の時間割">
        <div class="today-date">{{ formattedToday }}</div>

        <div
          class="next-class-card"
          :class="{ muted: nextClassStatus.kind !== 'next' && nextClassStatus.kind !== 'current' }"
        >
          <p class="next-label">{{ nextClassStatus.label }}</p>
          <template v-if="nextClassStatus.course">
            <h3>{{ displayCourseName(nextClassStatus.course.name) }}</h3>
            <p class="next-meta">
              {{ nextClassStatus.period }}限　{{ nextClassStatus.startTime }}開始
            </p>
            <p v-if="getCourseRoom(nextClassStatus.course)" class="next-room">
              {{ getCourseRoom(nextClassStatus.course) }}
            </p>
          </template>
        </div>

        <div class="today-list-card">
          <h3>今日の時間割</h3>
          <div v-if="todayDay" class="today-list">
            <button
              v-for="slot in todaySchedule"
              :key="slot.period"
              class="today-row"
              :class="{ empty: !slot.course }"
              type="button"
              :disabled="!slot.course"
              @click="slot.course && openCourseDetail(slot.course)"
            >
              <span class="today-period">{{ slot.period }}限</span>
              <span class="today-course">{{
                slot.course ? displayCourseName(slot.course.name) : '空き'
              }}</span>
              <span v-if="slot.course && getCourseRoom(slot.course)" class="today-room">{{
                getCourseRoom(slot.course)
              }}</span>
            </button>
          </div>
          <p v-else class="today-empty">今日は授業がありません</p>
        </div>
      </section>

      <h2>いつ空いてる？</h2>
      <p class="description">
        授業を入れたい曜日と時間を選んでください。<br />何個選んでも大丈夫です。
      </p>

      <div class="table-container">
        <table id="schedule-period-table">
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
                role="button"
                tabindex="0"
                :aria-label="getCellAriaLabel(day, period)"
                :class="{
                  selected: isSelected(day, period),
                  locked: getCandidateCourses(day, period).length > 0,
                }"
                @click="handleCellClick(day, period)"
                @keydown.enter.prevent="handleCellClick(day, period)"
                @keydown.space.prevent="handleCellClick(day, period)"
              >
                <FriendAvatarStack
                  v-if="getFriendsInSlot(day, period).length > 0"
                  class="slot-friend-avatars"
                  :friends="getFriendsInSlot(day, period)"
                  :max="3"
                />
                <div class="cell-content">
                  <div v-if="getCandidateCourses(day, period).length > 0" class="candidate-slot">
                    <span
                      v-for="course in getCandidateCourses(day, period).slice(0, 2)"
                      :key="course.id"
                      class="slot-course"
                    >
                      <span class="slot-course-name">{{ displayCourseName(course.name) }}</span>
                      <small v-if="getCourseRoom(course)" class="classroom-badge">
                        {{ getCourseRoom(course) }}
                      </small>
                    </span>
                  </div>
                  <div v-else-if="isSelected(day, period)" class="check">✓</div>
                  <div v-else class="empty-slot">追加</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <button
          type="button"
          class="show-additional-periods-button"
          aria-controls="schedule-period-table"
          :aria-expanded="showAdditionalPeriods"
          @click="toggleAdditionalPeriods"
        >
          {{ showAdditionalPeriods ? '追加時間を閉じる' : 'さらに時間を追加' }}
        </button>
      </div>

      <div class="selection-info">
        <p v-if="selectedAddSlotCount > 0">
          授業を追加ボタンで <strong>{{ selectedAddSlotCount }}つ</strong> のコマを選択中
        </p>
        <p v-else class="hint">マスをタップして選択してください</p>
      </div>

      <button
        :disabled="store.selectedSchedule.length === 0 && !store.includeUnscheduledCourses"
        @click="$router.push('/results')"
        class="next-button"
      >
        結果を見る
      </button>

      <div v-if="store.candidateCourses.length > 0" class="registered-section">
        <h3>登録済みの授業</h3>
        <div class="registered-list">
          <div v-for="course in store.candidateCourses" :key="course.id" class="registered-item">
            <button
              type="button"
              class="registered-main"
              @mousedown="startClassroomPress(course)"
              @mouseup="cancelClassroomPress"
              @mouseleave="cancelClassroomPress"
              @touchstart.passive="startClassroomPress(course)"
              @touchend="cancelClassroomPress"
              @touchcancel="cancelClassroomPress"
              @click="openCourseDetail(course)"
            >
              <span>{{ formatScheduleWithTime(course) }}</span>
              <p>{{ displayCourseName(course.name) }}</p>
              <small>{{
                getCourseRoom(course) ? `教室 ${getCourseRoom(course)}` : '長押しで教室番号を登録'
              }}</small>
              <FriendAvatarStack
                v-if="getFriendsForCourse(course.id).length > 0"
                :friends="getFriendsForCourse(course.id)"
              />
            </button>
            <button class="registered-remove" @click="store.removeCandidateCourse(course.id)">
              登録解除
            </button>
          </div>
        </div>
      </div>

      <Transition name="modal">
        <div
          v-if="detailCourse"
          class="modal-overlay"
          @click="closeCourseDetail"
          @keydown.esc.stop="closeCourseDetail"
        >
          <div
            ref="detailDialog"
            class="course-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-detail-title"
            tabindex="-1"
            @click.stop
            @keydown.tab="trapDetailFocus"
          >
            <button
              class="close-button"
              type="button"
              aria-label="授業詳細を閉じる"
              @click="closeCourseDetail"
            >
              ×
            </button>
            <span class="detail-schedule">{{ formatScheduleWithTime(detailCourse) }}</span>
            <h3 id="schedule-detail-title">{{ displayCourseName(detailCourse.name) }}</h3>
            <section class="detail-section" aria-labelledby="registered-syllabus-heading">
              <h4 id="registered-syllabus-heading">シラバス情報</h4>
              <CourseSyllabusDetails :course="detailCourse" />
            </section>
            <label class="detail-field">
              <span>教室</span>
              <input
                :value="selectedCourseRoom"
                type="text"
                placeholder="例: 8号棟203"
                @input="updateSelectedCourseRoom"
              />
            </label>
            <label class="detail-field">
              <span>個人メモ（自分だけ）</span>
              <textarea
                :value="selectedCourseMemo"
                rows="4"
                maxlength="120"
                placeholder="次回は教科書を持っていく"
                @input="updateSelectedCourseMemo"
              />
            </label>
            <SharedMemoPanel v-if="currentUser" :course="detailCourse" />
          </div>
        </div>
      </Transition>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { currentUser } from '../auth'
import BaseLayout from '../components/BaseLayout.vue'
import CourseSyllabusDetails from '../components/CourseSyllabusDetails.vue'
import FriendAvatarStack from '../components/FriendAvatarStack.vue'
import SharedMemoPanel from '../components/SharedMemoPanel.vue'
import { CLASS_TIMES, getPeriodTime } from '../constants/classTimes'
import { getFriendsForCourse, getFriendsInSlot } from '../friends'
import { store, type Course } from '../store'
import {
  COURSE_DAYS,
  COURSE_PERIODS,
  formatCourseSchedule,
  getCourseScheduleSlots,
} from '../utils/courseSchedule'
import { trapDialogFocus } from '../utils/dialogFocus'

const days = [...COURSE_DAYS]
const defaultPeriods = COURSE_PERIODS.filter((period) => period <= 5)
const additionalPeriods = COURSE_PERIODS.filter((period) => period > 5)
const additionalPeriodSet = new Set<number>(additionalPeriods)
const todayPeriods = [1, 2, 3, 4, 5]
const weekDays = ['日', '月', '火', '水', '木', '金', '土']
let classroomPressTimer: number | undefined
let clockTimer: number | undefined
const now = ref(new Date())
const detailCourse = ref<Course | null>(null)
const detailDialog = ref<HTMLElement | null>(null)
const additionalPeriodsVisibility = ref<boolean | null>(null)
let detailTrigger: HTMLElement | null = null

interface TodayScheduleSlot {
  period: number
  course: Course | null
}

interface NextClassStatus {
  kind: 'next' | 'current' | 'done' | 'none'
  label: string
  course: Course | null
  period: number | null
  startTime: string
}

const formattedToday = computed(() => {
  const date = now.value
  return `${date.getMonth() + 1}月${date.getDate()}日（${weekDays[date.getDay()]}）`
})

const todayDay = computed(() => {
  const day = weekDays[now.value.getDay()] || ''
  return days.some((candidate) => candidate === day) ? day : ''
})

const isSelected = (day: string, period: number) => {
  return store.selectedSchedule.some((s) => s.day === day && s.period === period)
}

const getCandidateCourses = (day: string, period: number) => {
  return store.candidateCourses.filter((course: Course) =>
    getCourseScheduleSlots(course).some((slot) => slot.day === day && slot.period === period),
  )
}

const hasAdditionalPeriodData = computed(() => {
  const isAdditionalPeriod = (period: number) => additionalPeriodSet.has(period)
  return (
    store.selectedSchedule.some((slot) => isAdditionalPeriod(slot.period)) ||
    store.candidateCourses.some((course) =>
      getCourseScheduleSlots(course).some((slot) => isAdditionalPeriod(slot.period)),
    )
  )
})

const showAdditionalPeriods = computed(
  () => additionalPeriodsVisibility.value ?? hasAdditionalPeriodData.value,
)

const toggleAdditionalPeriods = () => {
  additionalPeriodsVisibility.value = !showAdditionalPeriods.value
}

const periods = computed(() =>
  showAdditionalPeriods.value || hasAdditionalPeriodData.value
    ? [...defaultPeriods, ...additionalPeriods]
    : defaultPeriods,
)

const selectedAddSlotCount = computed(() => {
  return store.selectedSchedule.filter(
    (slot) => getCandidateCourses(slot.day, slot.period).length === 0,
  ).length
})

const todaySchedule = computed<TodayScheduleSlot[]>(() => {
  if (!todayDay.value) {
    return []
  }

  const day = todayDay.value
  return todayPeriods.map((period) => ({
    period,
    course: getCandidateCourses(day, period)[0] || null,
  }))
})

const todayCourses = computed(() => {
  return todaySchedule.value
    .filter((slot): slot is { period: number; course: Course } => Boolean(slot.course))
    .sort((a, b) => a.period - b.period)
})

const minutesFromTime = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const currentMinutes = computed(() => now.value.getHours() * 60 + now.value.getMinutes())

const formatRemainingTime = (minutes: number) => {
  if (minutes < 60) {
    return `あと${minutes}分`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `あと${hours}時間${remainingMinutes}分` : `あと${hours}時間`
}

const nextClassStatus = computed<NextClassStatus>(() => {
  if (!todayDay.value || todayCourses.value.length === 0) {
    return {
      kind: 'none',
      label: '今日は授業がありません',
      course: null,
      period: null,
      startTime: '',
    }
  }

  for (const slot of todayCourses.value) {
    const time = CLASS_TIMES[slot.period]
    if (!time) continue

    const start = minutesFromTime(time.start)
    const end = minutesFromTime(time.end)

    if (currentMinutes.value >= start && currentMinutes.value < end) {
      return {
        kind: 'current',
        label: '現在の授業',
        course: slot.course,
        period: slot.period,
        startTime: time.start,
      }
    }

    if (currentMinutes.value < start) {
      const minutesLeft = Math.max(0, Math.ceil(start - currentMinutes.value))
      return {
        kind: 'next',
        label: `次の授業まで ${formatRemainingTime(minutesLeft)}`,
        course: slot.course,
        period: slot.period,
        startTime: time.start,
      }
    }
  }

  return {
    kind: 'done',
    label: '今日の授業は終了しました',
    course: null,
    period: null,
    startTime: '',
  }
})

const selectedCourseRoom = computed(() => {
  return detailCourse.value ? store.getCourseRoom(detailCourse.value.id) : ''
})

const selectedCourseMemo = computed(() => {
  return detailCourse.value ? store.getCourseMemo(detailCourse.value.id) : ''
})

const displayCourseName = (name: string) => {
  return name.split('／')[0]
}

const formatScheduleWithTime = (course: Course) => {
  const schedule = formatCourseSchedule(course)
  const periodTime = course.period === null ? '' : getPeriodTime(course.period)
  return periodTime ? `${schedule} ${periodTime}` : schedule
}

const getCourseRoom = (course: Course) => {
  return store.getCourseRoom(course.id)
}

const handleCellClick = (day: string, period: number) => {
  const course = getCandidateCourses(day, period)[0]
  if (course) {
    openCourseDetail(course)
    return
  }

  store.toggleSchedule(day, period)
}

const getCellAriaLabel = (day: string, period: number) => {
  const courses = getCandidateCourses(day, period)
  if (courses.length > 0) {
    return `${day}曜日${period}限、登録済み、${courses
      .map((course) => displayCourseName(course.name))
      .join('、')}。授業詳細を開く`
  }
  return `${day}曜日${period}限、${isSelected(day, period) ? '選択中。選択を解除' : '空き。選択する'}`
}

const openCourseDetail = (course: Course) => {
  detailTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  detailCourse.value = course
  void nextTick(() => detailDialog.value?.focus())
}

const closeCourseDetail = () => {
  detailCourse.value = null
  void nextTick(() => detailTrigger?.focus())
}

const trapDetailFocus = (event: KeyboardEvent) => {
  trapDialogFocus(event, detailDialog.value)
}

const updateSelectedCourseRoom = (event: Event) => {
  if (!detailCourse.value) return
  store.setCourseRoom(detailCourse.value.id, (event.target as HTMLInputElement).value)
}

const updateSelectedCourseMemo = (event: Event) => {
  if (!detailCourse.value) return
  store.setCourseMemo(detailCourse.value.id, (event.target as HTMLTextAreaElement).value)
}

const startClassroomPress = (course: Course) => {
  cancelClassroomPress()
  classroomPressTimer = window.setTimeout(() => {
    const current = store.getCourseRoom(course.id)
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

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onUnmounted(() => {
  cancelClassroomPress()
  if (clockTimer !== undefined) {
    window.clearInterval(clockTimer)
  }
})
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

.today-overview {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
  text-align: left;
}

.today-date {
  color: #111827;
  font-size: 1.25rem;
  font-weight: 900;
}

.next-class-card,
.today-list-card {
  border: 4px solid #111827;
  border-radius: 0.7rem;
  background: white;
  box-shadow: 7px 7px 0 #111827;
}

.next-class-card {
  padding: 1.4rem;
  background: #fffdf4;
}

.next-class-card.muted {
  background: white;
}

.next-label {
  margin: 0;
  color: var(--comic-green);
  font-size: 1.05rem;
  font-weight: 900;
}

.next-class-card.muted .next-label {
  color: #111827;
}

.next-class-card h3 {
  margin: 0.35rem 0 0;
  color: #111827;
  font-size: 1.75rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.next-meta {
  margin: 0.25rem 0 0;
  color: #111827;
  font-weight: 900;
}

.next-room {
  margin: 0.2rem 0 0;
  color: #111827;
  font-size: 0.95rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.today-list-card {
  padding: 1rem;
  background: #fffdf4;
}

.today-list-card h3 {
  margin: 0 0 0.75rem;
  color: #111827;
  font-size: 1rem;
  font-weight: 900;
}

.today-list {
  display: grid;
  gap: 0.5rem;
}

.today-row {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: white;
  color: #111827;
  cursor: pointer;
  text-align: left;
}

.today-row:disabled {
  cursor: default;
}

.today-row.empty {
  background: #f3f4f6;
}

.today-period {
  color: var(--comic-green);
  font-weight: 900;
  white-space: nowrap;
}

.today-course {
  min-width: 0;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.today-room {
  max-width: 9rem;
  padding: 0.12rem 0.45rem;
  border: 2px solid #111827;
  border-radius: 999px;
  background: var(--comic-yellow);
  color: #111827;
  font-size: 0.72rem;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.today-empty {
  margin: 0;
  color: #111827;
  font-weight: 900;
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

.show-additional-periods-button {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.8rem 1rem;
  border: 3px dashed #111827;
  border-radius: 0.6rem;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  font-weight: 900;
  transition:
    background 0.15s,
    transform 0.15s;
}

.show-additional-periods-button:hover,
.show-additional-periods-button:focus-visible {
  background: var(--comic-yellow);
  outline: none;
  transform: translateY(-1px);
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

.slot-friend-avatars {
  position: absolute;
  top: -0.85rem;
  left: 50%;
  z-index: 2;
  transform: translateX(-50%);
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
  cursor: pointer;
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

.registered-remove {
  padding: 0.6rem 0.8rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: white;
  color: #111827;
  cursor: pointer;
  font-weight: 700;
}

.registered-main {
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.registered-main:focus-visible {
  outline: 3px solid var(--comic-green);
  outline-offset: 4px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
}

.course-detail-modal {
  position: relative;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
  border: 4px solid #111827;
  border-radius: 0.7rem;
  background: white;
  box-shadow: 10px 10px 0 #111827;
  text-align: left;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  border: none;
  background: transparent;
  color: #111827;
  cursor: pointer;
  font-size: 2rem;
  line-height: 1;
}

.detail-schedule {
  display: inline-block;
  margin-bottom: 0.75rem;
  padding: 0.25rem 0.65rem;
  border: 3px solid #111827;
  border-radius: 999px;
  background: var(--comic-yellow);
  color: #111827;
  font-size: 0.85rem;
  font-weight: 900;
}

.course-detail-modal h3 {
  margin: 0 2rem 1.25rem 0;
  color: #111827;
  font-size: 1.4rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.detail-section {
  margin-bottom: 1.25rem;
  padding-top: 1rem;
  border-top: 3px dashed #111827;
}

.detail-section h4 {
  margin: 0 0 0.75rem;
  color: #111827;
  font-size: 1rem;
  font-weight: 900;
}

.detail-field {
  display: block;
  margin-top: 1rem;
}

.detail-field span {
  display: block;
  margin-bottom: 0.35rem;
  color: #111827;
  font-weight: 900;
}

.detail-field input,
.detail-field textarea {
  width: 100%;
  padding: 0.75rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: #fffdf4;
  color: #111827;
  font-weight: 700;
}

.detail-field textarea {
  resize: vertical;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  h2 {
    font-size: 1.45rem;
  }

  .description {
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .today-overview {
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .today-date {
    font-size: 1.05rem;
  }

  .next-class-card,
  .today-list-card {
    border-width: 3px;
    box-shadow: 5px 5px 0 #111827;
  }

  .next-class-card {
    padding: 1rem;
  }

  .next-label {
    font-size: 0.95rem;
  }

  .next-class-card h3 {
    font-size: 1.25rem;
  }

  .today-row {
    grid-template-columns: 3.25rem minmax(0, 1fr);
    gap: 0.45rem;
    padding: 0.6rem;
    border-width: 2px;
  }

  .today-room {
    grid-column: 2;
    justify-self: start;
    max-width: 100%;
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
    content: '+';
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

  .modal-overlay {
    align-items: stretch;
    padding: 0.75rem;
  }

  .course-detail-modal {
    max-height: calc(100vh - 1.5rem);
    padding: 1.25rem;
    border-width: 3px;
    box-shadow: 5px 5px 0 #111827;
    overflow-y: auto;
  }

  .course-detail-modal h3 {
    font-size: 1.15rem;
  }

  .detail-field input,
  .detail-field textarea {
    border-width: 2px;
  }
}
</style>
