<template>
  <BaseLayout>
    <div class="course-list-view">
      <h2 class="title">今日のおすすめ、見つけたよ</h2>
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
            <span v-for="tag in course.conditions" :key="tag" class="tag">✨#{{ tag }}</span>
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
      <Transition name="modal-bounce">
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
                <div class="tags-row">
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

            <button class="jewel-button" @click="closeDetail">
              <span>この授業を候補に入れる</span>
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

.title {
  margin-bottom: 0.5rem;
  color: var(--theme-text);
  font-weight: 800;
  font-size: 1.8rem;
}

.description {
  margin-bottom: 2.5rem;
  color: var(--theme-text);
  opacity: 0.7;
  font-weight: 500;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  text-align: left;
}

.course-card {
  padding: 1.5rem;
  border: 3px solid var(--theme-lavender);
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: white;
  position: relative;
  box-shadow: 0 8px 0 var(--theme-lavender);
}

.course-card:hover {
  transform: translateY(-4px);
  border-color: var(--theme-pink);
  box-shadow: 0 12px 0 var(--theme-pink);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.course-header h3 {
  margin: 0;
  color: var(--theme-text);
  font-size: 1.3rem;
  font-weight: 800;
}

.schedule-badge {
  background-color: var(--theme-cream);
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.85rem;
  color: var(--theme-text);
  font-weight: 700;
  border: 2px solid var(--theme-pink);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  color: var(--theme-jewel);
  font-size: 0.9rem;
  font-weight: 800;
}

.course-desc {
  font-size: 0.95rem;
  color: var(--theme-text);
  line-height: 1.6;
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.click-hint {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--theme-text);
  opacity: 0.4;
  text-align: right;
  font-weight: 700;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(93, 64, 55, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 450px;
  border-radius: 3rem;
  padding: 3rem 2rem;
  position: relative;
  text-align: left;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  border: 4px solid var(--theme-lavender);
}

.close-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: var(--theme-pink);
  border: none;
  font-size: 1.5rem;
  color: white;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-weight: 800;
}

.modal-header {
  margin-bottom: 2rem;
  text-align: center;
}

.schedule-badge-large {
  display: inline-block;
  background-color: var(--theme-lavender);
  padding: 0.5rem 1.2rem;
  border-radius: 2rem;
  font-size: 1rem;
  color: var(--theme-text);
  margin-bottom: 1rem;
  font-weight: 800;
  border: 3px solid white;
  box-shadow: 0 4px 10px var(--theme-shadow);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--theme-text);
  font-weight: 800;
}

.section {
  margin-bottom: 2rem;
}

.section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--theme-text);
  opacity: 0.5;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-large {
  color: var(--theme-jewel);
  font-size: 1.1rem;
  font-weight: 800;
}

.jewel-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.2rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--theme-jewel-light), var(--theme-jewel));
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 0 #e91e6344, 0 15px 25px #ff80ab44;
}

/* Transitions */
.modal-bounce-enter-active,
.modal-bounce-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-bounce-enter-from,
.modal-bounce-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(40px);
}

.no-results {
  margin: 4rem 0;
  color: var(--theme-text);
  opacity: 0.6;
}

.retry-button {
  margin-top: 1.5rem;
  padding: 0.8rem 1.6rem;
  background: white;
  border: 3px solid var(--theme-pink);
  color: var(--theme-text);
  border-radius: 2rem;
  cursor: pointer;
  font-weight: 800;
  box-shadow: 0 4px 0 var(--theme-pink);
}

.restart-button {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  background-color: var(--theme-cream);
  color: var(--theme-text);
  border: 2px solid var(--theme-pink);
  border-radius: 1.5rem;
  cursor: pointer;
  margin-top: 2rem;
  font-weight: 700;
  opacity: 0.8;
}
</style>
