<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { courses } from '../data/courses'

const route = useRoute()
const router = useRouter()

const studentId = computed(() => route.query.id as string || '')

const faculty = computed(() => {
  if (studentId.value.length < 3) return '不明な学部'
  const code = studentId.value.charAt(2).toUpperCase()
  switch (code) {
    case 'L': return '文学部'
    case 'E': return '経済学部'
    case 'S': return '理学部'
    default: return '不明な学部'
  }
})

const grade = computed(() => {
  if (studentId.value.length < 2) return ''
  const year = parseInt(studentId.value.substring(0, 2))
  if (isNaN(year)) return ''
  const currentYear = 26
  const diff = currentYear - year + 1
  return diff > 0 && diff <= 4 ? `${diff}年生` : '学外者'
})

// おすすめの授業（学部に合わせる）
const recommendedCourses = computed(() => {
  return courses.filter(c => c.faculty === faculty.value).slice(0, 3)
})

// 5x5の時間割データ（サンプル）
const days = ['月', '火', '水', '木', '金']
const periods = [1, 2, 3, 4, 5]

const goToSearch = () => {
  router.push({ path: '/selection', query: { faculty: faculty.value } })
}

const logout = () => {
  router.push('/')
}
</script>

<template>
  <div class="dashboard-container">
    <div class="card header-card">
      <div class="user-info">
        <h1 class="welcome-text">{{ studentId }} さんのマイページ</h1>
        <p class="user-subtext">{{ faculty }} {{ grade }}</p>
      </div>
      <button @click="logout" class="logout-button">ログアウト</button>
    </div>

    <div class="grid-layout">
      <!-- 左側：時間割 -->
      <div class="card timetable-card">
        <h2 class="section-title">あなたの時間割</h2>
        <div class="timetable-wrapper">
          <table class="timetable">
            <thead>
              <tr>
                <th></th>
                <th v-for="day in days" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in periods" :key="p">
                <td class="period-label">{{ p }}限</td>
                <td v-for="day in days" :key="day" class="timetable-cell">
                  <!-- サンプルとして月2に心理学を入れる -->
                  <div v-if="day === '月' && p === 2" class="course-entry">
                    <span class="course-mini-name">心理学概論</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 右側：おすすめとアクション -->
      <div class="side-content">
        <div class="card recommend-card">
          <h2 class="section-title">おすすめの授業</h2>
          <div class="recommend-list">
            <div v-for="course in recommendedCourses" :key="course.id" class="recommend-item">
              <span class="recommend-name">{{ course.name }}</span>
              <span class="recommend-instructor">{{ course.instructor }}</span>
            </div>
          </div>
        </div>

        <button @click="goToSearch" class="search-trigger-button">
          <span class="plus-icon">＋</span> 新しく授業を探す
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
}

.card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text {
  font-size: 20px;
  margin: 0;
}

.user-subtext {
  color: #666;
  font-size: 14px;
  margin: 4px 0 0 0;
}

.logout-button {
  background: none;
  border: 1px solid #ddd;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: #888;
}

.grid-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

@media (max-width: 800px) {
  .grid-layout {
    grid-template-columns: 1fr;
  }
}

.section-title {
  font-size: 18px;
  margin-bottom: 16px;
  font-weight: bold;
  border-left: 4px solid var(--primary-color);
  padding-left: 10px;
}

/* 時間割スタイル */
.timetable-wrapper {
  overflow-x: auto;
}

.timetable {
  width: 100%;
  border-collapse: separate;
  border-spacing: 4px;
  table-layout: fixed;
}

.timetable th {
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  font-weight: normal;
}

.period-label {
  width: 40px;
  font-size: 12px;
  color: #888;
  text-align: right;
  padding-right: 8px;
}

.timetable-cell {
  height: 60px;
  background-color: #f8f9fa;
  border-radius: 6px;
  vertical-align: middle;
}

.course-entry {
  background-color: #eef6ff;
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.course-mini-name {
  font-size: 11px;
  color: var(--primary-color);
  font-weight: bold;
  text-align: center;
}

/* おすすめリスト */
.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommend-item {
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.recommend-item:last-child {
  border-bottom: none;
}

.recommend-name {
  display: block;
  font-size: 14px;
  font-weight: bold;
}

.recommend-instructor {
  font-size: 12px;
  color: #888;
}

.search-trigger-button {
  width: 100%;
  padding: 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.search-trigger-button:hover {
  transform: translateY(-2px);
}

.plus-icon {
  margin-right: 4px;
}
</style>
