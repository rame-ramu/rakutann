<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { courses } from '../data/courses'

const route = useRoute()
const router = useRouter()

// 基本データ
const days = ['月', '火', '水', '木', '金']
const periods = [1, 2, 3, 4, 5]
const tagOptions = ['テストなし', '出席なし', 'レポートのみ', 'オンライン']

// 検索状態（クエリパラメータから初期化）
const faculty = computed(() => route.query.faculty as string || '不明な学部')
const selectedDay = ref(route.query.day as string || '')
const selectedPeriod = ref<number | null>(route.query.period ? parseInt(route.query.period as string) : null)
const selectedTags = ref<string[]>((route.query.tags as string || '').split(',').filter(t => t !== ''))
const searchQuery = ref(route.query.q as string || '')

// モーダル表示用の状態
const selectedCourseForModal = ref<any>(null)

// タグの切り替え
const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

// 検索の実行（URLを更新して再検索）
const updateSearch = () => {
  router.replace({
    path: '/confirmation',
    query: {
      faculty: faculty.value,
      day: selectedDay.value,
      period: selectedPeriod.value,
      tags: selectedTags.value.join(','),
      q: searchQuery.value
    }
  })
}

// モーダル操作
const openModal = (course: any) => {
  selectedCourseForModal.value = course
}

const closeModal = () => {
  selectedCourseForModal.value = null
}

// クエリパラメータの変更を監視して、フィルタリング用の値を更新
const displayFaculty = computed(() => route.query.faculty as string)
const displayDay = computed(() => route.query.day as string)
const displayPeriod = computed(() => parseInt(route.query.period as string))
const displayTags = computed(() => (route.query.tags as string || '').split(',').filter(t => t !== ''))
const displayKeyword = computed(() => route.query.q as string || '')

// コースのフィルタリング
const filteredCourses = computed(() => {
  return courses.filter(course => {
    if (displayFaculty.value && displayFaculty.value !== '不明な学部' && course.faculty !== displayFaculty.value) return false
    if (course.day !== displayDay.value) return false
    if (course.period !== displayPeriod.value) return false
    
    if (displayTags.value.length > 0) {
      if (!displayTags.value.every(tag => course.tags.includes(tag))) return false
    }
    
    if (displayKeyword.value) {
      const q = displayKeyword.value.toLowerCase()
      const matchName = course.name.toLowerCase().includes(q)
      const matchInstructor = course.instructor.toLowerCase().includes(q)
      const matchDesc = course.description.toLowerCase().includes(q)
      if (!matchName && !matchInstructor && !matchDesc) return false
    }
    
    return true
  })
})

const goBackToTop = () => {
  router.push('/')
}
</script>

<template>
  <div class="results-page">
    <aside class="sidebar">
      <h1 class="sidebar-title">検索条件</h1>
      
      <div class="filter-group">
        <div class="section">
          <h2 class="section-title">曜日</h2>
          <div class="mini-button-group">
            <button 
              v-for="day in days" 
              :key="day"
              :class="{ active: selectedDay === day }"
              @click="selectedDay = day"
              class="mini-select-button"
            >
              {{ day }}
            </button>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">時限</h2>
          <div class="mini-button-group">
            <button 
              v-for="p in periods" 
              :key="p"
              :class="{ active: selectedPeriod === p }"
              @click="selectedPeriod = p"
              class="mini-select-button"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">こだわり条件</h2>
          <div class="mini-tag-group">
            <button 
              v-for="tag in tagOptions" 
              :key="tag"
              :class="{ active: selectedTags.includes(tag) }"
              @click="toggleTag(tag)"
              class="mini-tag-button"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">キーワード</h2>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="キーワード入力" 
            class="mini-search-input"
          />
        </div>

        <button 
          :disabled="!selectedDay || !selectedPeriod" 
          @click="updateSearch"
          class="update-button"
        >
          この条件で再検索
        </button>

        <button @click="goBackToTop" class="home-link">
          トップへ戻る
        </button>
      </div>
    </aside>

    <main class="main-content">
      <div class="content-header">
        <h2 class="results-count">
          <span class="faculty-badge">{{ faculty }}</span>
          <span class="count-text">{{ filteredCourses.length }} 件見つかりました</span>
        </h2>
      </div>

      <div v-if="filteredCourses.length > 0" class="course-list">
        <div 
          v-for="course in filteredCourses" 
          :key="course.id" 
          class="course-card"
          @click="openModal(course)"
        >
          <div class="course-header">
            <h3 class="course-name">{{ course.name }}</h3>
            <div class="course-meta">
              <span class="instructor">{{ course.instructor }}</span>
              <span class="schedule-badge">{{ course.day }}曜 {{ course.period }}限</span>
            </div>
          </div>
          <p class="course-description line-clamp">{{ course.description }}</p>
          <div class="tag-list">
            <span v-for="tag in course.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          
          <div class="card-footer">
            <span class="detail-link">詳しく見る</span>
          </div>
        </div>
      </div>
      
      <div v-else class="no-results-card">
        <p>条件に合う授業が見つかりませんでした。</p>
        <p class="no-results-hint">左の条件を変えてみてください。</p>
      </div>
    </main>

    <!-- 授業詳細モーダル -->
    <Transition name="modal">
      <div v-if="selectedCourseForModal" class="modal-mask" @click="closeModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <div class="modal-header-top">
              <div class="modal-badges">
                <span class="modal-faculty">{{ selectedCourseForModal.faculty }}</span>
                <span class="modal-schedule">{{ selectedCourseForModal.day }}曜 {{ selectedCourseForModal.period }}限</span>
              </div>
              <button class="modal-close-button" @click="closeModal">&times;</button>
            </div>
            <h2 class="modal-course-name">{{ selectedCourseForModal.name }}</h2>
            <p class="modal-instructor">{{ selectedCourseForModal.instructor }}</p>
          </div>

          <div class="modal-body">
            <div class="modal-section">
              <h4 class="modal-section-title">授業の概要</h4>
              <p class="modal-description">{{ selectedCourseForModal.description }}</p>
            </div>

            <div class="modal-section">
              <h4 class="modal-section-title">条件・タグ</h4>
              <div class="tag-list">
                <span v-for="tag in selectedCourseForModal.tags" :key="tag" class="tag large">{{ tag }}</span>
              </div>
            </div>

            <div class="modal-section" v-if="selectedCourseForModal.comments.length > 0">
              <h4 class="modal-section-title">学生からの口コミ ({{ selectedCourseForModal.comments.length }})</h4>
              <div class="modal-comments">
                <div v-for="comment in selectedCourseForModal.comments" :key="comment.id" class="modal-comment">
                  <div class="modal-comment-header">
                    <span class="modal-comment-author">{{ comment.author }}</span>
                  </div>
                  <p class="modal-comment-content">「{{ comment.content }}」</p>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="modal-bottom-close" @click="closeModal">とじる</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.results-page {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  position: sticky;
  top: 20px;
}

.sidebar-title {
  font-size: 18px;
  margin-bottom: 20px;
  font-weight: bold;
  color: #333;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
  font-weight: bold;
}

.mini-button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-select-button {
  flex: 1;
  min-width: 40px;
  padding: 6px 0;
  border: 1px solid #eee;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.mini-select-button.active {
  border-color: var(--primary-color);
  background-color: #f1f9e8;
  color: var(--primary-color);
  font-weight: bold;
}

.mini-tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-tag-button {
  padding: 4px 10px;
  border: 1px solid #eee;
  background: white;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
}

.mini-tag-button.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.mini-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.update-button {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.update-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.home-link {
  width: 100%;
  margin-top: 12px;
  padding: 8px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
}

.main-content {
  flex-grow: 1;
}

.content-header {
  margin-bottom: 20px;
}

.faculty-badge {
  background: var(--primary-color);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  margin-right: 12px;
}

.count-text {
  font-size: 18px;
  color: #444;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.course-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  margin-top: auto;
  text-align: right;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.detail-link {
  font-size: 13px;
  color: var(--primary-color);
  font-weight: bold;
}

.course-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-name {
  font-size: 17px;
  margin: 0;
  color: #333;
  font-weight: bold;
}

.instructor {
  font-size: 13px;
  color: #888;
}

.schedule-badge {
  font-size: 12px;
  background: #f0f4f8;
  color: #555;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.course-description {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 16px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.tag {
  font-size: 11px;
  background: #f5f7fa;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
}

.no-results-card {
  background: white;
  padding: 60px 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.no-results-hint {
  color: #999;
  font-size: 14px;
  margin-top: 8px;
}

/* モーダルスタイル */
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
}

.modal-container {
  width: 600px;
  max-width: 90%;
  max-height: 85vh;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 24px;
  background: #f8fbff;
  border-bottom: 1px solid #eef2f7;
}

.modal-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal-badges {
  display: flex;
  gap: 8px;
}

.modal-faculty {
  font-size: 12px;
  background: var(--primary-color);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
}

.modal-schedule {
  font-size: 12px;
  background: #333;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.modal-close-button {
  background: none;
  border: none;
  font-size: 28px;
  color: #aaa;
  cursor: pointer;
  line-height: 1;
}

.modal-course-name {
  font-size: 22px;
  margin: 0 0 8px 0;
  color: #333;
}

.modal-instructor {
  font-size: 15px;
  color: #666;
  margin: 0;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-section {
  margin-bottom: 24px;
}

.modal-section-title {
  font-size: 15px;
  font-weight: bold;
  color: #444;
  margin-bottom: 12px;
  border-left: 4px solid var(--primary-color);
  padding-left: 10px;
}

.modal-description {
  font-size: 15px;
  color: #555;
  line-height: 1.7;
}

.tag.large {
  padding: 6px 14px;
  font-size: 13px;
  background: #eef6ff;
  color: var(--primary-color);
}

.modal-comments {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-comment {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 10px;
}

.modal-comment-header {
  margin-bottom: 6px;
}

.modal-comment-author {
  font-weight: bold;
  font-size: 14px;
  color: #666;
}

.modal-comment-content {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  margin: 0;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  text-align: center;
}

.modal-bottom-close {
  width: 100%;
  padding: 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: bold;
  color: #666;
  cursor: pointer;
}

/* トランジション */
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}
.modal-enter-from .modal-container { transform: scale(0.9); }
.modal-leave-to .modal-container { transform: scale(0.9); }

@media (max-width: 900px) {
  .results-page {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    position: relative;
    top: 0;
    box-sizing: border-box;
  }
}
</style>
