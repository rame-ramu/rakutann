<template>
  <BaseLayout>
    <div class="course-list-view">
      <h2 class="magic-title">あなたへの啓示</h2>
      <p class="description">{{ store.grade }}年生・{{ store.department }}へ贈る魔法の履修プランです。</p>

      <div v-if="filteredCourses.length > 0" class="course-list">
        <div 
          v-for="course in filteredCourses" 
          :key="course.id" 
          class="m-magic-result-card"
          @click="openDetail(course)"
        >
          <div class="course-header">
            <h3>{{ course.name }}</h3>
            <span class="magic-badge">{{ course.day }}{{ course.period }}限</span>
          </div>
          <div class="tags">
            <span v-for="tag in course.conditions" :key="tag" class="m-tag">#{{ tag }}</span>
          </div>
          <p class="course-desc">{{ course.description }}</p>
          <div class="click-hint">啓示を開く 🪄</div>
        </div>
      </div>
      <div v-else class="no-results">
        <p>運命の授業は見つかりませんでした。</p>
        <button @click="$router.push('/conditions')" class="m-action-btn retry-button">条件を再考する</button>
      </div>

      <!-- Detail Modal -->
      <Transition name="modal">
        <div v-if="store.selectedCourse" class="modal-overlay" @click="closeDetail">
          <div class="modal-content" @click.stop>
            <button class="m-charm-btn close-button" @click="closeDetail">
              <span class="icon">×</span>
            </button>
            <div class="modal-header">
              <span class="magic-badge-large">{{ store.selectedCourse.day }}{{ store.selectedCourse.period }}限</span>
              <h3>{{ store.selectedCourse.name }}</h3>
            </div>
            
            <div class="modal-body">
              <div class="section">
                <h4>授業の輝き</h4>
                <div class="tags">
                  <span v-for="tag in store.selectedCourse.conditions" :key="tag" class="m-tag-large">#{{ tag }}</span>
                </div>
              </div>

              <div class="section">
                <h4>秘められた内容</h4>
                <p>{{ store.selectedCourse.description }}</p>
              </div>

              <div class="section" v-if="store.selectedCourse.faculty">
                <h4>対象となる聖域</h4>
                <p>{{ store.selectedCourse.faculty.join('、') }}</p>
              </div>
            </div>

            <div class="action-container">
              <button class="m-action-btn add-button" @click="closeDetail">
                この啓示を記録する 💖
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <div class="footer-actions">
        <button @click="$router.push('/')" class="m-aux-btn restart-button">最初からやり直す</button>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseLayout from '../components/BaseLayout.vue'
import { store, mockCourses, type Course } from '../store'

const filteredCourses = computed(() => {
  return mockCourses.filter(course => {
    if (store.department && course.faculty) {
      if (!course.faculty.includes(store.department)) return false
    }
    const dayMatch = store.selectedSchedule.some(s => s.day === course.day && s.period === course.period)
    const conditionMatch = course.conditions.some(c => store.selectedConditions.includes(c))
    return dayMatch || conditionMatch
  }).sort((a, b) => {
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

.magic-title {
  font-size: 1.75rem;
  margin-bottom: 1rem;
}

.description {
  margin-bottom: 2rem;
  color: var(--magic-text-sub);
  font-weight: 700;
  font-size: 0.95rem;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.m-magic-result-card {
  padding: 1.5rem;
  border: 1px solid var(--magic-silver);
  border-radius: var(--magic-radius-md);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: white;
  position: relative;
  box-shadow: 0 4px 15px var(--magic-shadow-lavender);
}

.course-header h3 {
  margin: 0;
  color: var(--magic-text-heading);
  font-size: 1.3rem;
  font-weight: 800;
}

.magic-badge {
  background: var(--magic-lavender-bg);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--magic-text-heading);
  font-weight: 800;
  border: 1px solid var(--magic-silver);
}

.m-tag {
  color: var(--magic-text-heading);
  font-size: 0.85rem;
  font-weight: 800;
  opacity: 0.8;
}

.course-desc {
  font-size: 0.95rem;
  color: var(--magic-text-main);
  font-weight: 500;
  line-height: 1.6;
}

.click-hint {
  margin-top: 1.25rem;
  font-size: 0.8rem;
  color: var(--magic-text-sub);
  text-align: right;
  font-weight: 800;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(74, 47, 42, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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
  border-radius: var(--magic-radius-lg);
  padding: 2.5rem;
  border: 3px solid var(--magic-gold);
}

.close-button {
  position: absolute;
  top: 1.25rem;
  right: 1.5rem;
}

.magic-badge-large {
  display: inline-block;
  background: linear-gradient(135deg, var(--magic-pink-bg) 0%, var(--magic-lavender-bg) 100%);
  padding: 0.5rem 1.25rem;
  border-radius: 30px;
  font-size: 1rem;
  color: var(--magic-text-heading);
  margin-bottom: 1rem;
  font-weight: 800;
  border: 2px solid var(--magic-white);
  box-shadow: 0 4px 10px var(--magic-shadow-pink);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--magic-text-heading);
}

.section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: var(--magic-text-sub);
  font-weight: 800;
}

.m-tag-large {
  color: var(--magic-text-heading);
  font-size: 1.1rem;
  font-weight: 800;
}

.action-container {
  display: flex;
  justify-content: center;
}

.add-button {
  width: 100%;
}

.no-results {
  margin: 4rem 0;
  color: var(--magic-text-sub);
  font-weight: 700;
}

.footer-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}
</style>
