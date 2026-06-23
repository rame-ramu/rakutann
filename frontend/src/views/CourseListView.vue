<template>
  <BaseLayout>
    <div class="course-list-view">
      <div class="page-heading">
        <div>
          <h2>あなたにおすすめの授業</h2>
          <p class="description">{{ store.grade }}年生・{{ store.department }}向けの結果です。</p>
        </div>
        <div class="result-count">{{ filteredCourses.length }}件</div>
      </div>

      <div class="results-layout">
        <aside class="candidate-panel">
          <div class="panel-header">
            <h3>選んだ授業</h3>
            <span>{{ store.candidateCourses.length }}件</span>
          </div>

          <div v-if="store.candidateCourses.length > 0" class="candidate-list">
            <div v-for="course in store.candidateCourses" :key="course.id" class="candidate-item">
              <div>
                <span class="candidate-schedule">{{ formatScheduleWithTime(course) }}</span>
                <p>{{ displayCourseName(course.name) }}</p>
              </div>
              <button class="remove-button" @click="store.removeCandidateCourse(course.id)">外す</button>
            </div>
          </div>
          <p v-else class="empty-preview">授業詳細から候補に入れるとここに表示されます。</p>

          <button
            :disabled="store.candidateCourses.length === 0"
            class="confirm-button"
            @click="router.push('/schedule')"
          >
            この候補で決定
          </button>
        </aside>

        <div class="results-main">
          <div v-if="filteredCourses.length > 0" class="course-list">
            <div
              v-for="course in filteredCourses"
              :key="course.id"
              class="course-card"
              :class="{ chosen: isCandidate(course.id) }"
              @click="openDetail(course)"
            >
              <div class="course-header">
                <div>
                  <h3>{{ displayCourseName(course.name) }}</h3>
                  <p class="teacher">{{ course.instructor }}</p>
                </div>
                <span class="schedule-badge">{{ formatSchedule(course) }}</span>
              </div>
              <div class="score-row">
                <span>レポート {{ course.reportPercent }}%</span>
                <span>試験 {{ course.examPercent }}%</span>
                <span>出席 {{ course.attendancePercent }}%</span>
                <span>{{ course.onDemandLabel }}</span>
              </div>
              <div class="tags">
                <span v-for="tag in visibleTags(course)" :key="tag" class="tag">#{{ tag }}</span>
              </div>
              <div class="match-line">{{ getMatchSummary(course) }}</div>
              <div class="click-hint">{{ isCandidate(course.id) ? '候補に追加済み' : 'タップして詳細を見る' }}</div>
            </div>
          </div>
          <div v-else class="no-results">
            <p>条件に合う授業が見つかりませんでした。</p>
            <button @click="$router.push('/conditions')" class="retry-button">条件を変えてみる</button>
          </div>
        </div>
      </div>

      <!-- Detail Modal -->
      <Transition name="modal">
        <div v-if="store.selectedCourse" class="modal-overlay" @click="closeDetail">
          <div class="modal-content" @click.stop>
            <button class="close-button" @click="closeDetail">×</button>
            <div class="modal-header">
              <span class="schedule-badge-large">{{ formatScheduleWithTime(store.selectedCourse) }}</span>
              <h3>{{ store.selectedCourse.name }}</h3>
              <p>{{ store.selectedCourse.instructor }}</p>
            </div>
            
            <div class="modal-body">
              <div class="section">
                <h4>シラバス情報</h4>
                <dl class="detail-grid">
                  <div>
                    <dt>開講学期</dt>
                    <dd>{{ store.selectedCourse.semester }}</dd>
                  </div>
                  <div>
                    <dt>曜日・時限</dt>
                    <dd>{{ formatScheduleWithTime(store.selectedCourse) }}</dd>
                  </div>
                  <div>
                    <dt>単位数</dt>
                    <dd>{{ store.selectedCourse.credits }}単位</dd>
                  </div>
                  <div>
                    <dt>授業形態</dt>
                    <dd>{{ store.selectedCourse.classFormat }}</dd>
                  </div>
                  <div>
                    <dt>出席割合</dt>
                    <dd>{{ store.selectedCourse.attendancePercent }}%</dd>
                  </div>
                  <div>
                    <dt>レポート・課題</dt>
                    <dd>{{ store.selectedCourse.reportPercent }}%</dd>
                  </div>
                  <div>
                    <dt>試験</dt>
                    <dd>{{ store.selectedCourse.examPercent }}%</dd>
                  </div>
                  <div>
                    <dt>オンデマンド</dt>
                    <dd>{{ store.selectedCourse.onDemandLabel }}（{{ store.selectedCourse.onDemandPercent }}%）</dd>
                  </div>
                  <div>
                    <dt>前提履修</dt>
                    <dd>{{ store.selectedCourse.prerequisiteLabel }}</dd>
                  </div>
                </dl>
              </div>

              <div class="section">
                <h4>授業の特徴</h4>
                <div class="tags">
                  <span v-for="tag in store.selectedCourse.conditions" :key="tag" class="tag-large">#{{ tag }}</span>
                </div>
              </div>

              <div class="section">
                <h4>内容</h4>
                <p>{{ store.selectedCourse.description }}</p>
              </div>

              <div class="section">
                <h4>タグが付いた理由</h4>
                <ul class="reason-list">
                  <li v-for="item in store.selectedCourse.tagReasons" :key="item.tag">
                    <strong>#{{ item.tag }}</strong> {{ item.reason }}
                  </li>
                </ul>
              </div>
            </div>

            <button class="add-button" @click="addCandidate(store.selectedCourse)">
              {{ isCandidate(store.selectedCourse.id) ? '候補に追加済み' : 'この授業を候補に入れる' }}
            </button>
          </div>
        </div>
      </Transition>

      <button @click="$router.push('/')" class="restart-button">最初からやり直す</button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'
import { store, mockCourses, type Course } from '../store'

const router = useRouter()

const avoidedTeachers = computed(() => {
  return store.avoidedTeachersText
    .split(/[、,\\s]+/)
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
})

const isAvoidedTeacher = (course: Course) => {
  const instructor = course.instructor.toLowerCase()
  return avoidedTeachers.value.some((name) => instructor.includes(name))
}

const isScheduleMatch = (course: Course) => {
  if (course.period === null) return false
  return store.selectedSchedule.some((s) => s.day === course.day && s.period === course.period)
}

const isLockedSchedule = (course: Course) => {
  return store.candidateCourses.some(
    (candidate) => candidate.day === course.day && candidate.period === course.period,
  )
}

const conditionCount = (course: Course) => {
  return course.conditions.filter((condition) => store.selectedConditions.includes(condition)).length
}

const courseScore = (course: Course) => {
  const conditionScore = conditionCount(course) * 10
  const scheduleScore = isScheduleMatch(course) ? 3 : 0
  return conditionScore + scheduleScore
}

const filteredCourses = computed(() => {
  return mockCourses
    .filter((course) => isScheduleMatch(course) && !isLockedSchedule(course) && !isAvoidedTeacher(course))
    .sort((a, b) => {
      const scoreDiff = courseScore(b) - courseScore(a)
      if (scoreDiff !== 0) return scoreDiff
      return conditionCount(b) - conditionCount(a)
    })
})

const openDetail = (course: Course) => {
  store.setSelectedCourse(course)
}

const closeDetail = () => {
  store.setSelectedCourse(null)
}

const addCandidate = (course: Course | null) => {
  if (!course) return
  store.addCandidateCourse(course)
  store.setSelectedCourse(null)
}

const isCandidate = (courseId: string) => {
  return store.candidateCourses.some((course) => course.id === courseId)
}

const formatSchedule = (course: Course) => {
  if (course.period === null || course.day === '他') return `${course.day}`
  return `${course.day}${course.period}限`
}

const formatScheduleWithTime = (course: Course) => {
  if (course.period === null || course.day === '他') return `${course.day}`
  return `${formatSchedule(course)} ${getPeriodTime(course.period)}`
}

const displayCourseName = (name: string) => {
  return name.split('／')[0]
}

const getPeriodTime = (period: number) => {
  const periodTimes: Record<number, string> = {
    1: '9:30〜11:00',
    2: '11:10〜12:40',
    3: '13:30〜15:00',
    4: '15:10〜16:40',
    5: '16:50〜18:20',
  }
  return periodTimes[period] || ''
}

const visibleTags = (course: Course) => {
  const selectedTags = course.conditions.filter((condition) => store.selectedConditions.includes(condition))
  const otherTags = course.conditions.filter((condition) => !store.selectedConditions.includes(condition))
  return [...selectedTags, ...otherTags].slice(0, 5)
}

const getMatchSummary = (course: Course) => {
  const count = conditionCount(course)
  const schedule = isScheduleMatch(course) ? '曜日時限も一致' : 'タグで推薦'
  return `希望タグ ${count}件一致・${schedule}`
}
</script>

<style scoped>
.course-list-view {
  text-align: left;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

h2 {
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.description {
  margin: 0;
  color: #64748b;
}

.result-count {
  flex: 0 0 auto;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 800;
}

.results-layout {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  text-align: left;
}

.course-card {
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  position: relative;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}

.course-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.course-card.chosen {
  border-color: #0f766e;
  background: #f0fdfa;
  box-shadow: 0 0 0 3px rgb(15 118 110 / 0.12);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.course-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
  line-height: 1.45;
}

.schedule-badge {
  background-color: #f1f5f9;
  padding: 0.3rem 0.6rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  color: #475569;
  font-weight: 800;
  line-height: 1;
  text-align: right;
  white-space: nowrap;
}

.teacher {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
}

.score-row span {
  min-width: 0;
  padding: 0.55rem 0.5rem;
  border-radius: 0.5rem;
  background: #f8fafc;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.85rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 700;
}

.match-line {
  margin-top: 0.75rem;
  color: #0f766e;
  font-size: 0.85rem;
  font-weight: 700;
}

.click-hint {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: right;
}

.candidate-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: white;
  box-shadow: 0 4px 14px rgb(15 23 42 / 0.06);
}

.panel-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0;
  min-width: 6rem;
}

.panel-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
}

.panel-header span {
  color: #0f766e;
  font-weight: 800;
}

.candidate-list {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(220px, 1fr);
  gap: 0.65rem;
  margin-bottom: 0;
  overflow-x: auto;
  padding-bottom: 0.15rem;
}

.candidate-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  background: #f8fafc;
}

.candidate-item p {
  margin: 0.25rem 0 0;
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.35;
}

.candidate-schedule {
  color: #2563eb;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.35;
}

.remove-button {
  padding: 0.45rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: white;
  color: #64748b;
  cursor: pointer;
  font-weight: 700;
}

.empty-preview {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
  font-size: 0.9rem;
}

.confirm-button {
  width: auto;
  min-width: 9rem;
  padding: 1rem;
  border: none;
  border-radius: 0.75rem;
  background: #0f766e;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
}

.confirm-button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 680px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  border-radius: 1.5rem;
  padding: 2.5rem;
  position: relative;
  text-align: left;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.close-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.modal-header {
  margin-bottom: 2rem;
}

.schedule-badge-large {
  display: inline-block;
  background-color: #f1f5f9;
  padding: 0.375rem 1rem;
  border-radius: 2rem;
  font-size: 1rem;
  color: #475569;
  margin-bottom: 1rem;
  font-weight: 600;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.75rem;
  color: #0f172a;
}

.modal-header p {
  margin: 0.75rem 0 0;
  color: #64748b;
}

.section {
  margin-bottom: 2rem;
}

.section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #64748b;
  font-weight: 600;
}

.tag-large {
  color: #3b82f6;
  font-size: 1.125rem;
  font-weight: 600;
  margin-right: 0.75rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.875rem;
  margin: 0;
}

.detail-grid div {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
}

.detail-grid dt {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.detail-grid dd {
  margin: 0;
  color: #0f172a;
  font-weight: 700;
}

.reason-list {
  padding-left: 1.25rem;
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.reason-list strong {
  color: #2563eb;
}

.add-button {
  width: 100%;
  padding: 1.25rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-button:hover {
  background-color: #2563eb;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from .modal-content {
  transform: scale(0.9) translateY(20px);
}

.no-results {
  margin: 4rem 0;
  color: #64748b;
}

.retry-button {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: none;
  border: 2px solid #3b82f6;
  color: #3b82f6;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
}

.restart-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  background-color: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  margin-top: 2rem;
}

@media (max-width: 900px) {
  .course-list {
    grid-template-columns: 1fr;
  }

  .candidate-panel {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .panel-header {
    align-items: flex-start;
    min-width: 0;
  }

  .candidate-list {
    grid-auto-columns: minmax(210px, 80%);
  }

  .confirm-button {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .page-heading {
    flex-direction: column;
  }

  .course-header {
    flex-direction: column;
  }

  .score-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
