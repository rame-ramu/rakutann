<template>
  <BaseLayout>
    <div class="course-list-view">
      <h2 class="manga-title">あなたにおすすめの授業ッ！</h2>
      <p class="description">{{ store.grade }}年生・{{ store.department }}向けの結果です。</p>

      <div v-if="filteredCourses.length > 0" class="course-list">
        <div 
          v-for="course in filteredCourses" 
          :key="course.id" 
          class="course-card manga-card"
          @click="openDetail(course)"
        >
          <div class="course-header">
            <h3>{{ course.name }}</h3>
            <span class="schedule-badge manga-schedule">{{ course.day }}{{ course.period }}限</span>
          </div>
          <div class="tags">
            <span v-for="tag in course.conditions" :key="tag" class="tag">#{{ tag }}</span>
          </div>
          <p class="course-desc">{{ course.description }}</p>
          <div class="click-hint">詳細を見る →</div>
        </div>
      </div>
      <div v-else class="no-results">
        <p class="manga-text">条件に合う授業が見つかりませんでした…</p>
        <button @click="$router.push('/conditions')" class="retry-button manga-retry">条件を変えてみる</button>
      </div>

      <!-- Detail Modal -->
      <Transition name="manga-modal">
        <div v-if="store.selectedCourse" class="modal-overlay" @click="closeDetail">
          <div class="modal-content manga-modal-content" @click.stop>
            <button class="close-button" @click="closeDetail">×</button>
            <div class="modal-header">
              <span class="schedule-badge-large manga-badge">{{ store.selectedCourse.day }}{{ store.selectedCourse.period }}限</span>
              <h3 class="manga-modal-title">{{ store.selectedCourse.name }}</h3>
            </div>
            
            <div class="modal-body">
              <div class="section">
                <h4>【 授業の特徴 】</h4>
                <div class="tags">
                  <span v-for="tag in store.selectedCourse.conditions" :key="tag" class="tag-large">#{{ tag }}</span>
                </div>
              </div>

              <div class="section">
                <h4>【 内容 】</h4>
                <p class="manga-desc">{{ store.selectedCourse.description }}</p>
              </div>

              <div class="section" v-if="store.selectedCourse.faculty">
                <h4>【 対象学部 】</h4>
                <p>{{ store.selectedCourse.faculty.join('、') }}</p>
              </div>
            </div>

            <button class="add-button manga-add-button" @click="closeDetail">この授業を候補に入れるッ！</button>
          </div>
        </div>
      </Transition>

      <button @click="$router.push('/')" class="restart-button manga-restart">最初からやり直す</button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseLayout from '../components/BaseLayout.vue'
import { store, mockCourses, type Course } from '../store'

const filteredCourses = computed(() => {
  return mockCourses.filter(course => {
    // 1. Faculty match (if department is known)
    if (store.department && course.faculty) {
      if (!course.faculty.includes(store.department)) return false
    }

    // 2. Schedule match
    const dayMatch = store.selectedSchedule.some(s => s.day === course.day && s.period === course.period)
    
    // 3. Condition match
    const conditionMatch = course.conditions.some(c => store.selectedConditions.includes(c))
    
    return dayMatch || conditionMatch
  }).sort((a, b) => {
    // Priority: both matches > schedule match > condition match
    const aScheduleMatch = store.selectedSchedule.some(s => s.day === a.day && s.period === a.period)
    const bScheduleMatch = store.selectedSchedule.some(s => s.day === b.day && s.period === b.period)
    const aConditionCount = a.conditions.filter(c => store.selectedConditions.includes(c)).length
    const bConditionCount = b.conditions.filter(c => store.selectedConditions.includes(c)).length

    if (aScheduleMatch && aConditionCount > 0 && !(bScheduleMatch && bConditionCount > 0)) return -1
    if (!(aScheduleMatch && aConditionCount > 0) && bScheduleMatch && bConditionCount > 0) return 1
    
    return bConditionCount - aConditionCount
  })
})

const openDetail = (course: Course) => {
  store.setSelectedCourse(course)
}

const closeDetail = () => {
  store.setSelectedCourse(null)
}
</script>

<style scoped>
.course-list-view {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.manga-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
  font-weight: 900;
  text-shadow: 3px 3px 0 var(--color-manga-accent-secondary);
}

.description {
  margin-bottom: 2.5rem;
  color: var(--color-text);
  font-weight: 700;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 3rem;
  text-align: left;
}

.manga-card {
  padding: 1.5rem;
  border: 4px solid var(--color-heading);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.1s;
  background: white;
  position: relative;
  box-shadow: 6px 6px 0 var(--color-manga-accent);
}

.manga-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--color-manga-accent-secondary);
  border-color: var(--color-manga-accent);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.course-header h3 {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.5rem;
  font-weight: 900;
}

.manga-schedule {
  background-color: var(--color-manga-accent-secondary);
  padding: 0.25rem 1rem;
  border: 2px solid var(--color-heading);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: white;
  font-weight: 900;
  transform: rotate(2deg);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  color: var(--color-manga-accent);
  font-size: 0.9rem;
  font-weight: 900;
  background: white;
  padding: 0.1rem 0.5rem;
  border: 2px solid var(--color-heading);
}

.course-desc {
  font-size: 0.95rem;
  color: var(--color-text);
  line-height: 1.6;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.click-hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--color-manga-accent-secondary);
  text-align: right;
  font-weight: 900;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.manga-modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 1rem;
  padding: 2.5rem;
  position: relative;
  text-align: left;
  border: 6px solid var(--color-heading);
  box-shadow: 12px 12px 0 var(--color-manga-accent);
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-manga-accent);
  border: 3px solid var(--color-heading);
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.5rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 900;
}

.modal-header {
  margin-bottom: 2rem;
}

.manga-badge {
  display: inline-block;
  background-color: var(--color-manga-accent-secondary);
  padding: 0.375rem 1rem;
  border: 3px solid var(--color-heading);
  border-radius: 0.5rem;
  font-size: 1rem;
  color: white;
  margin-bottom: 1rem;
  font-weight: 900;
  transform: rotate(-2deg);
}

.manga-modal-title {
  margin: 0;
  font-size: 2rem;
  color: var(--color-heading);
  font-weight: 900;
  line-height: 1.1;
}

.section {
  margin-bottom: 2rem;
}

.section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  color: var(--color-manga-accent);
  font-weight: 900;
}

.tag-large {
  color: var(--color-manga-accent-secondary);
  font-size: 1.125rem;
  font-weight: 900;
  margin-right: 0.75rem;
  text-decoration: underline;
  text-decoration-color: var(--color-manga-accent);
  text-decoration-thickness: 4px;
}

.manga-desc {
  font-weight: 700;
  line-height: 1.8;
}

.manga-add-button {
  width: 100%;
  padding: 1.25rem;
  background-color: var(--color-heading);
  color: white;
  border: 4px solid var(--color-manga-accent);
  border-radius: 1rem;
  font-size: 1.25rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.1s;
  box-shadow: 6px 6px 0 var(--color-manga-accent-secondary);
}

.manga-add-button:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--color-manga-accent);
  background-color: var(--color-manga-accent);
}

/* Transitions */
.manga-modal-enter-active,
.manga-modal-leave-active {
  transition: all 0.2s ease;
}

.manga-modal-enter-from,
.manga-modal-leave-to {
  opacity: 0;
  transform: scale(0.9) rotate(-2deg);
}

.no-results {
  margin: 4rem 0;
}

.manga-text {
  font-weight: 900;
  font-size: 1.2rem;
  color: var(--color-manga-accent);
}

.manga-retry {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 4px solid var(--color-heading);
  color: var(--color-manga-accent);
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 900;
  box-shadow: 4px 4px 0 var(--color-manga-accent-secondary);
}

.manga-restart {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  background-color: white;
  color: var(--color-heading);
  border: 3px solid var(--color-manga-accent-secondary);
  border-radius: 0.75rem;
  cursor: pointer;
  margin-top: 4rem;
  font-weight: 900;
  box-shadow: 4px 4px 0 var(--color-manga-accent);
}
</style>
