<script setup lang="ts">
import { ref, computed } from 'vue'
import { courses } from '../data/courses'

// ステップ管理: 0 = 学籍番号入力, 1 = 検索・結果表示
const step = ref(0)

// --- ステップ 0: 学籍番号入力 ---
const studentId = ref('')
const faculty = computed(() => {
  if (studentId.value.length < 3) return null
  const code = studentId.value.charAt(2).toUpperCase()
  switch (code) {
    case 'L': return '文学部'
    case 'E': return '経済学部'
    case 'S': return '理学部'
    default: return '不明な学部'
  }
})
const grade = computed(() => {
  if (studentId.value.length < 2) return null
  const year = parseInt(studentId.value.substring(0, 2))
  if (isNaN(year)) return null
  const currentYear = 26
  const diff = currentYear - year + 1
  return diff > 0 && diff <= 4 ? `${diff}年生` : '学外者'
})
const isIdValid = computed(() => studentId.value.length >= 6)

const nextStep = () => {
  if (isIdValid.value) step.value = 1
}

// --- ステップ 1: 検索条件 & 結果表示 ---
const days = ['月', '火', '水', '木', '金']
const periods = [1, 2, 3, 4, 5]
const tagOptions = ['テストなし', '出席なし', 'レポートのみ', 'オンライン']

const selectedDay = ref('')
const selectedPeriod = ref<number | null>(null)
const selectedTags = ref<string[]>([])
const searchQuery = ref('')
const hasSearched = ref(false)

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

const canSearch = computed(() => selectedDay.value !== '' && selectedPeriod.value !== null)

// コースのフィルタリング
const filteredCourses = computed(() => {
  if (!hasSearched.value) return []
  
  return courses.filter(course => {
    if (faculty.value && faculty.value !== '不明な学部' && course.faculty !== faculty.value) return false
    if (course.day !== selectedDay.value) return false
    if (course.period !== selectedPeriod.value) return false
    
    if (selectedTags.value.length > 0) {
      if (!selectedTags.value.every(tag => course.tags.includes(tag))) return false
    }
    
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchName = course.name.toLowerCase().includes(q)
      const matchInstructor = course.instructor.toLowerCase().includes(q)
      const matchDesc = course.description.toLowerCase().includes(q)
      if (!matchName && !matchInstructor && !matchDesc) return false
    }
    
    return true
  })
})

const performSearch = () => {
  if (canSearch.value) {
    hasSearched.value = true
    // 検索ボタンを押したときに結果までスクロールさせるなどの処理も可能
  }
}

const goBack = () => {
  step.value = 0
  hasSearched.value = false
}
</script>

<template>
  <div class="app-content">
    <!-- ステップ 0: ログイン風画面 -->
    <div v-if="step === 0" class="card text-center">
      <h1 class="title">こんにちは。</h1>
      <p class="description">学籍番号を入力してください。</p>
      
      <div class="input-group">
        <input 
          v-model="studentId" 
          type="text" 
          placeholder="例: 23L1234" 
          class="student-input"
          maxlength="8"
        />
      </div>

      <div v-if="faculty && grade" class="result-box">
        あなたは <span class="highlight">{{ faculty }} {{ grade }}</span> ですね。
      </div>

      <button :disabled="!isIdValid" @click="nextStep" class="next-button">
        つぎへ
      </button>
    </div>

    <!-- ステップ 1: 検索 & 結果 -->
    <div v-else class="main-container">
      <div class="card search-card">
        <h1 class="title">いつ、どんな授業がいい？</h1>
        <p class="subtitle">{{ faculty }}の授業を探します</p>

        <div class="section">
          <h2 class="section-title">曜日</h2>
          <div class="button-group">
            <button 
              v-for="day in days" 
              :key="day"
              :class="{ active: selectedDay === day }"
              @click="selectedDay = day; hasSearched = false"
              class="select-button"
            >
              {{ day }}
            </button>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">時限</h2>
          <div class="button-group">
            <button 
              v-for="p in periods" 
              :key="p"
              :class="{ active: selectedPeriod === p }"
              @click="selectedPeriod = p; hasSearched = false"
              class="select-button"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">こだわり条件（複数選択可）</h2>
          <div class="tag-group">
            <button 
              v-for="tag in tagOptions" 
              :key="tag"
              :class="{ active: selectedTags.includes(tag) }"
              @click="toggleTag(tag); hasSearched = false"
              class="tag-button"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">キーワードで検索</h2>
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="例: 心理学、プログラミング" 
              class="search-input"
              @input="hasSearched = false"
            />
          </div>
        </div>

        <button 
          :disabled="!canSearch" 
          @click="performSearch"
          class="next-button"
        >
          この条件で検索する
        </button>
        <div class="text-center">
          <button @click="goBack" class="back-link">もどる</button>
        </div>
      </div>

      <!-- 検索結果セクション -->
      <div v-if="hasSearched" class="results-section">
        <h2 class="results-title">検索結果 ({{ filteredCourses.length }}件)</h2>
        
        <div v-if="filteredCourses.length > 0" class="course-list">
          <div v-for="course in filteredCourses" :key="course.id" class="course-card">
            <div class="course-header">
              <h3 class="course-name">{{ course.name }}</h3>
              <span class="instructor">{{ course.instructor }}</span>
            </div>
            <p class="course-description">{{ course.description }}</p>
            <div class="tag-list">
              <span v-for="tag in course.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            
            <div class="comments-section" v-if="course.comments.length > 0">
              <div class="comments-title">学生の口コミ</div>
              <div v-for="comment in course.comments" :key="comment.id" class="comment">
                <span class="comment-author">{{ comment.author }}:</span>
                <span class="comment-content">「{{ comment.content }}」</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="no-results card">
          <p>条件に合う授業が見つかりませんでした。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-content {
  width: 100%;
}

.text-center {
  text-align: center;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  margin-bottom: 8px;
}

.description, .subtitle {
  color: #666;
  margin-bottom: 24px;
  font-size: 14px;
}

.input-group {
  margin-bottom: 20px;
}

.student-input {
  width: 100%;
  padding: 12px;
  font-size: 18px;
  border: 2px solid #ddd;
  border-radius: 8px;
  box-sizing: border-box;
  text-align: center;
  transition: border-color 0.3s;
}

.student-input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.result-box {
  margin-top: 10px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f1f9e8;
  border-radius: 8px;
  color: #444;
}

.highlight {
  font-weight: bold;
  color: var(--primary-color);
}

.next-button {
  width: 100%;
  padding: 14px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.3s;
  margin-bottom: 16px;
}

.next-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 検索画面用 */
.section {
  margin-bottom: 20px;
  text-align: left;
}

.section-title {
  font-size: 16px;
  margin-bottom: 10px;
  font-weight: bold;
}

.button-group {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.select-button {
  flex: 1;
  padding: 10px 0;
  border: 2px solid #eee;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.select-button.active {
  border-color: var(--primary-color);
  background-color: #f1f9e8;
  color: var(--primary-color);
  font-weight: bold;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-button {
  padding: 8px 16px;
  border: 2px solid #eee;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tag-button.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.search-box {
  margin-top: 8px;
}

.search-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 16px;
}

.search-input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.back-link {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
}

/* 結果表示用 */
.results-section {
  margin-top: 30px;
}

.results-title {
  font-size: 18px;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid var(--primary-color);
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.course-name {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.instructor {
  font-size: 14px;
  color: #666;
}

.course-description {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  margin-bottom: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.tag {
  font-size: 11px;
  background: #f0f0f0;
  color: #666;
  padding: 2px 8px;
  border-radius: 4px;
}

.comments-section {
  border-top: 1px solid #eee;
  padding-top: 12px;
}

.comments-title {
  font-size: 13px;
  font-weight: bold;
  color: #888;
  margin-bottom: 8px;
}

.comment {
  font-size: 13px;
  margin-bottom: 4px;
  line-height: 1.4;
}

.comment-author {
  font-weight: bold;
  margin-right: 4px;
}

.comment-content {
  color: #555;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
}
</style>
