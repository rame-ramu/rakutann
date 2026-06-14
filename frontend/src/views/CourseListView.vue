<template>
  <BaseLayout>
    <div class="course-list-view">
      <h2>あなたにおすすめの授業</h2>
      <p class="description">{{ store.grade }}年生・{{ store.department }}向けの結果です。</p>

      <div v-if="filteredCourses.length > 0" class="course-list">
        <div 
          v-for="course in filteredCourses" 
          :key="course.id" 
          class="course-card"
          @click="openDetail(course)"
        >
          <div class="course-header">
            <h3>{{ course.name }}</h3>
            <span class="schedule-badge">{{ course.day }}{{ course.period }}限</span>
          </div>
          <div class="tags">
            <span v-for="tag in course.conditions" :key="tag" class="tag">#{{ tag }}</span>
          </div>
          <p class="course-desc">{{ course.description }}</p>
          <div class="click-hint">タップして詳細を見る</div>
        </div>
      </div>
      <div v-else class="no-results">
        <p>条件に合う授業が見つかりませんでした。</p>
        <button @click="$router.push('/conditions')" class="retry-button">条件を変えてみる</button>
      </div>

      <!-- Detail Modal -->
      <Transition name="modal">
        <div v-if="store.selectedCourse" class="modal-overlay" @click="closeDetail">
          <div class="modal-content" @click.stop>
            <button class="close-button" @click="closeDetail">×</button>
            <div class="modal-header">
              <span class="schedule-badge-large">{{ store.selectedCourse.day }}{{ store.selectedCourse.period }}限</span>
              <h3>{{ store.selectedCourse.name }}</h3>
            </div>
            
            <div class="modal-body">
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

              <div class="section" v-if="store.selectedCourse.faculty">
                <h4>対象学部</h4>
                <p>{{ store.selectedCourse.faculty.join('、') }}</p>
              </div>
            </div>

            <button class="add-button" @click="closeDetail">この授業を候補に入れる</button>
          </div>
        </div>
      </Transition>

      <button @click="$router.push('/')" class="restart-button">最初からやり直す</button>
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
}

h2 {
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.description {
  margin-bottom: 2rem;
  color: #64748b;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.course-card {
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  position: relative;
}

.course-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.course-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.25rem;
}

.schedule-badge {
  background-color: #f1f5f9;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
}

.course-desc {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.click-hint {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: right;
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
  max-width: 500px;
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
</style>
