<template>
  <BaseLayout>
    <div class="course-list-page">
      <h2>あなたにおすすめの授業</h2>
      <p class="recommended-info">
        {{ store.grade }}年生・{{ store.department }}向けの結果です。
      </p>

      <!-- おすすめの授業一覧 -->
      <div v-if="recommendedCourses.length > 0" class="course-grid">
        <div 
          v-for="course in recommendedCourses" 
          :key="course.id" 
          class="course-card"
          @click="showCourseDetail(course)"
        >
          <div class="course-card-header">
            <h3>{{ course.name }}</h3>
            <span class="time-badge">{{ course.day }}{{ course.period }}限</span>
          </div>
          <div class="course-tags">
            <span v-for="tag in course.conditions" :key="tag" class="tag-item">#{{ tag }}</span>
          </div>
          <p class="course-summary">{{ course.description }}</p>
          <div class="tap-guide">タップして詳細を見る</div>
        </div>
      </div>

      <!-- 結果がゼロだった場合の表示 -->
      <div v-else class="empty-state">
        <p>条件に合う授業が見つかりませんでした。</p>
        <button @click="goToConditions" class="back-to-filter-button">条件を変えてみる</button>
      </div>

      <!-- 詳細モーダル (Transitionでふわっと表示) -->
      <Transition name="modal-fade">
        <div v-if="store.selectedCourse" class="modal-backdrop" @click="hideCourseDetail">
          <div class="modal-card" @click.stop>
            <button class="modal-close-button" @click="hideCourseDetail">×</button>
            
            <div class="modal-header">
              <span class="time-badge-large">{{ store.selectedCourse.day }}{{ store.selectedCourse.period }}限</span>
              <h3>{{ store.selectedCourse.name }}</h3>
            </div>
            
            <div class="modal-content">
              <div class="detail-section">
                <h4>授業の特徴</h4>
                <div class="course-tags">
                  <span v-for="tag in store.selectedCourse.conditions" :key="tag" class="tag-item-large">#{{ tag }}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>内容</h4>
                <p>{{ store.selectedCourse.description }}</p>
              </div>

              <div class="detail-section" v-if="store.selectedCourse.faculty">
                <h4>対象学部</h4>
                <p>{{ store.selectedCourse.faculty.join('、') }}</p>
              </div>
            </div>

            <button class="add-to-candidate-button" @click="hideCourseDetail">この授業を候補に入れる</button>
          </div>
        </div>
      </Transition>

      <button @click="restartApp" class="reset-button">最初からやり直す</button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'
import { store, mockCourses, type Course } from '../store'

const router = useRouter()

/**
 * ストアの条件（学部、空き時間、こだわり条件）に基づいて
 * 表示する授業を抽出し、おすすめ順に並び替える計算プロパティ
 */
const recommendedCourses = computed(() => {
  return mockCourses.filter(course => {
    // 1. 学部が一致するかチェック（学部が判明している場合のみ）
    if (store.department && course.faculty) {
      if (!course.faculty.includes(store.department)) return false
    }

    // 2. 自分の空き時間（スケジュール）と一致するかチェック
    const isAvailableTime = store.selectedSchedule.some(
      s => s.day === course.day && s.period === course.period
    )
    
    // 3. こだわり条件（らくたん、出席なし等）が1つでも含まれるかチェック
    const hasMatchingCondition = course.conditions.some(
      c => store.selectedConditions.includes(c)
    )
    
    // 「空き時間」または「こだわり条件」のどちらかが合致すればリストに載せる
    return isAvailableTime || hasMatchingCondition

  }).sort((a, b) => {
    /**
     * 並び替えロジック（スコアリング）
     * 優先度1: 時間も条件も両方合致
     * 優先度2: 時間が合致
     * 優先度3: 条件の合致数が多い順
     */
    const aScheduleMatch = store.selectedSchedule.some(s => s.day === a.day && s.period === a.period)
    const bScheduleMatch = store.selectedSchedule.some(s => s.day === b.day && s.period === b.period)
    
    const aConditionScore = a.conditions.filter(c => store.selectedConditions.includes(c)).length
    const bConditionScore = b.conditions.filter(c => store.selectedConditions.includes(c)).length

    // 両方マッチしているものを最優先
    const aPerfect = aScheduleMatch && aConditionScore > 0
    const bPerfect = bScheduleMatch && bConditionScore > 0
    if (aPerfect && !bPerfect) return -1
    if (!aPerfect && bPerfect) return 1
    
    // 次に条件マッチ数で比較
    return bConditionScore - aConditionScore
  })
})

// 詳細画面を開く
const showCourseDetail = (course: Course) => {
  store.setSelectedCourse(course)
}

// 詳細画面を閉じる
const hideCourseDetail = () => {
  store.setSelectedCourse(null)
}

// 最初からやり直す（トップへ戻る）
const restartApp = () => {
  router.push('/')
}

// 条件入力画面に戻る
const goToConditions = () => {
  router.push('/conditions')
}
</script>

<style scoped>
.course-list-page {
  text-align: center;
}

h2 {
  margin-bottom: 0.5rem;
  color: #2D3436;
  font-weight: 900;
  font-size: 1.8rem;
}

.recommended-info {
  margin-bottom: 2rem;
  color: #2D3436;
  font-weight: 800;
  background: #EBFBFF; /* Light Blue Accent */
  display: inline-block;
  padding: 0.3rem 1rem;
  border-radius: 1rem;
  border: 2px solid #2D3436;
  font-size: 0.95rem;
}

/* 授業カードのリスト表示 */
.course-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.course-card {
  padding: 1.5rem;
  border: 3px solid #2D3436;
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.1s;
  background: white;
  position: relative;
  box-shadow: 4px 4px 0 rgba(45, 52, 54, 0.1);
}

.course-card:hover {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 rgba(79, 179, 232, 0.2);
  border-color: #4FB3E8;
}

.course-card:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #2D3436;
}

.course-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.course-card-header h3 {
  margin: 0;
  color: #2D3436;
  font-size: 1.3rem;
  font-weight: 900;
}

/* 曜日・時限バッジ */
.time-badge {
  background-color: #EBFBFF;
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.85rem;
  color: #2D3436;
  font-weight: 800;
  border: 2px solid #2D3436;
}

/* タグのスタイル */
.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag-item {
  color: #2D3436;
  font-size: 0.8rem;
  font-weight: 800;
  background: #F0F9FF;
  padding: 0.2rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid #BEE3F8;
}

.course-summary {
  font-size: 0.95rem;
  color: #4A5568;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 700;
}

.tap-guide {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #718096;
  text-align: right;
  font-weight: 700;
}

/* --- モーダル (詳細表示) のスタイル --- */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(45, 52, 54, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: white;
  width: 100%;
  max-width: 440px;
  border-radius: 2rem;
  padding: 2.5rem 2rem;
  position: relative;
  text-align: left;
  box-shadow: 8px 8px 0 #2D3436;
  border: 3px solid #2D3436;
}

.modal-close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #FFF;
  border: 2px solid #2D3436;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-size: 1.5rem;
  color: #2D3436;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}

.modal-close-button:hover {
  background: #F8F9FA;
  transform: rotate(90deg);
}

.modal-header {
  margin-bottom: 1.5rem;
}

.time-badge-large {
  display: inline-block;
  background-color: #EBFBFF;
  padding: 0.4rem 1.2rem;
  border-radius: 2rem;
  font-size: 0.9rem;
  color: #2D3436;
  margin-bottom: 0.75rem;
  font-weight: 800;
  border: 2px solid #2D3436;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #2D3436;
  font-weight: 900;
  line-height: 1.2;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #718096;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tag-item-large {
  color: #4FB3E8;
  font-size: 1.1rem;
  font-weight: 800;
  margin-right: 0.75rem;
}

/* 候補に追加ボタン */
.add-to-candidate-button {
  width: 100%;
  padding: 1.25rem;
  background: #4FB3E8;
  color: white;
  border: 3px solid #2D3436;
  border-radius: 1.5rem;
  font-size: 1.25rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 4px 4px 0 #2D3436;
  transition: all 0.1s;
}

.add-to-candidate-button:hover {
  background: #75C6F0;
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 #2D3436;
}

/* モーダルの出現アニメーション */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-card {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-fade-enter-from .modal-card {
  transform: scale(0.9) translateY(20px);
}

/* その他パーツ */
.empty-state {
  margin: 4rem 0;
  color: #2D3436;
  font-weight: 800;
}

.back-to-filter-button {
  margin-top: 1.5rem;
  padding: 0.8rem 1.5rem;
  background: white;
  border: 2px solid #2D3436;
  color: #2D3436;
  border-radius: 1rem;
  cursor: pointer;
  font-weight: 800;
  box-shadow: 3px 3px 0 #2D3436;
  transition: all 0.1s;
}

.reset-button {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  background-color: #F8F9FA;
  color: #718096;
  border: 2px solid #CBD5E0;
  border-radius: 1rem;
  cursor: pointer;
  margin-top: 2rem;
  font-weight: 800;
  transition: all 0.2s;
}

.reset-button:hover {
  background-color: #EDF2F7;
  color: #2D3436;
}
</style>