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
              <button class="remove-button" @click="store.removeCandidateCourse(course.id)">
                外す
              </button>
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

        <section class="name-search-panel" aria-labelledby="name-search-title">
          <div class="name-search-header">
            <div>
              <h3 id="name-search-title">授業名で探す</h3>
              <p>{{ nameSearchScopeText }}</p>
            </div>
            <span>{{ nameSearchResults.length }}件</span>
          </div>

          <input
            v-model="nameSearchQuery"
            class="name-search-input"
            type="search"
            placeholder="例: 情報検索、心理学、Information"
            :disabled="!canUseNameSearch"
          />

          <p v-if="!store.selectedSemester" class="name-search-message">
            条件画面で前期か後期を選ぶと検索できます。
          </p>
          <p v-else-if="selectedNameSearchSlotCount === 0" class="name-search-message">
            時間割画面で授業を入れたい曜日・時限を選ぶと検索できます。
          </p>
          <div
            v-else-if="normalizedNameQuery && nameSearchResults.length > 0"
            class="name-search-results"
          >
            <div
              v-for="{ course } in nameSearchResults"
              :key="course.id"
              class="name-search-result"
              :class="{
                chosen: isCandidate(course.id),
                'friend-match': getFriendsForCourse(course.id).length > 0,
              }"
              role="button"
              tabindex="0"
              @click="openDetail(course)"
              @keydown.enter="openDetail(course)"
            >
              <div class="name-result-main">
                <span class="candidate-schedule">{{ formatScheduleWithTime(course) }}</span>
                <h4>{{ displayCourseName(course.name) }}</h4>
                <p>{{ course.instructor }}</p>
                <div v-if="getFriendsForCourse(course.id).length > 0" class="friend-match-line">
                  <FriendAvatarStack :friends="getFriendsForCourse(course.id)" />
                  <strong>友達もこの授業を登録しています</strong>
                </div>
              </div>
              <button
                class="inline-add-button"
                type="button"
                :disabled="isCandidate(course.id) || !canRegisterCourse(course)"
                @click.stop="addCandidate(course)"
              >
                {{ getNameSearchActionLabel(course) }}
              </button>
            </div>
          </div>
          <p v-else-if="normalizedNameQuery" class="name-search-message">
            選択中の曜日・時限で、名前が近い授業は見つかりませんでした。
          </p>
        </section>

        <div class="results-main">
          <div v-if="filteredCourses.length > 0" class="course-list">
            <div
              v-for="course in filteredCourses"
              :key="course.id"
              class="course-card"
              :class="{
                chosen: isCandidate(course.id),
                'friend-match': getFriendsForCourse(course.id).length > 0,
              }"
              @click="openDetail(course)"
            >
              <div class="course-header">
                <div>
                  <h3>{{ displayCourseName(course.name) }}</h3>
                  <p class="teacher">{{ course.instructor }}</p>
                </div>
                <div class="course-friend-badges">
                  <FriendAvatarStack
                    v-if="getFriendsForCourse(course.id).length > 0"
                    :friends="getFriendsForCourse(course.id)"
                  />
                  <span class="schedule-badge">{{ formatSchedule(course) }}</span>
                </div>
              </div>
              <div class="score-row">
                <span>レポート {{ course.reportPercent }}%</span>
                <span>試験 {{ course.examPercent }}%</span>
                <span>態度 {{ course.attendancePercent }}%</span>
                <span>{{ course.onDemandLabel }}</span>
              </div>
              <div class="tags">
                <span v-for="tag in visibleTags(course)" :key="tag" class="tag">#{{ tag }}</span>
              </div>
              <div class="match-line">{{ getMatchSummary(course) }}</div>
              <div class="click-hint">
                {{ isCandidate(course.id) ? '候補に追加済み' : 'タップして詳細を見る' }}
              </div>
            </div>
          </div>
          <div v-else class="no-results">
            <p>条件に合う授業が見つかりませんでした。</p>
            <button @click="$router.push('/conditions')" class="retry-button">
              条件を変えてみる
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Modal -->
      <Transition name="modal">
        <div v-if="store.selectedCourse" class="modal-overlay" @click="closeDetail">
          <div class="modal-content" @click.stop>
            <button class="close-button" @click="closeDetail">×</button>
            <div class="modal-header">
              <span class="schedule-badge-large">{{
                formatScheduleWithTime(store.selectedCourse)
              }}</span>
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
                    <dt>態度割合</dt>
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
                    <dd>
                      {{ store.selectedCourse.onDemandLabel }}（{{
                        store.selectedCourse.onDemandPercent
                      }}%）
                    </dd>
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
                  <span v-for="tag in store.selectedCourse.conditions" :key="tag" class="tag-large"
                    >#{{ tag }}</span
                  >
                </div>
              </div>

              <div
                v-if="getFriendsForCourse(store.selectedCourse.id).length > 0"
                class="section friend-course-section"
              >
                <h4>この授業を登録している友達</h4>
                <div class="friend-match-line">
                  <FriendAvatarStack
                    :friends="getFriendsForCourse(store.selectedCourse.id)"
                    :max="4"
                  />
                  <strong>
                    {{
                      getFriendsForCourse(store.selectedCourse.id)
                        .map((friend) => friend.displayName)
                        .join('、')
                    }}
                  </strong>
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
              {{
                isCandidate(store.selectedCourse.id) ? '候補に追加済み' : 'この授業を候補に入れる'
              }}
            </button>
          </div>
        </div>
      </Transition>

      <button @click="$router.push('/')" class="restart-button">最初からやり直す</button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'
import FriendAvatarStack from '../components/FriendAvatarStack.vue'
import { getPeriodTime } from '../constants/classTimes'
import { getFriendsForCourse } from '../friends'
import { store, mockCourses, type Course } from '../store'

const router = useRouter()
const nameSearchQuery = ref('')

interface NameSearchResult {
  course: Course
  score: number
}

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

const isSemesterMatch = (course: Course) => {
  if (!store.selectedSemester) return true
  return course.semester.includes(store.selectedSemester) || course.semester.includes('通年')
}

const isScheduleMatch = (course: Course) => {
  if (course.period === null) return false
  return store.selectedSchedule.some((s) => s.day === course.day && s.period === course.period)
}

const isGradeMatch = (course: Course) => {
  if (store.grade === null) return true
  return course.years.includes(store.grade)
}

const isLockedSchedule = (course: Course) => {
  return store.candidateCourses.some(
    (candidate) => candidate.day === course.day && candidate.period === course.period,
  )
}

const conditionCount = (course: Course) => {
  return course.conditions.filter((condition) => store.selectedConditions.includes(condition))
    .length
}

const courseScore = (course: Course) => {
  const conditionScore = conditionCount(course) * 10
  const scheduleScore = isScheduleMatch(course) ? 3 : 0
  return conditionScore + scheduleScore
}

const filteredCourses = computed(() => {
  return mockCourses
    .filter(
      (course) =>
        isGradeMatch(course) &&
        isSemesterMatch(course) &&
        isScheduleMatch(course) &&
        !isLockedSchedule(course) &&
        !isAvoidedTeacher(course),
    )
    .sort((a, b) => {
      const scoreDiff = courseScore(b) - courseScore(a)
      if (scoreDiff !== 0) return scoreDiff
      return conditionCount(b) - conditionCount(a)
    })
})

const normalizedNameQuery = computed(() => normalizeSearchText(nameSearchQuery.value))
const selectedNameSearchSlotCount = computed(() => store.selectedSchedule.length)

const canUseNameSearch = computed(() => {
  return Boolean(store.selectedSemester && selectedNameSearchSlotCount.value > 0)
})

const nameSearchScopeText = computed(() => {
  if (!store.selectedSemester) return '前期/後期を選ぶと名前で検索できます。'
  if (selectedNameSearchSlotCount.value === 0) {
    return `${store.selectedSemester}の授業を、選択した曜日・時限に絞って検索します。`
  }
  return `${store.selectedSemester}・選択中の${selectedNameSearchSlotCount.value}コマに合う授業だけを名前で検索します。`
})

const nameSearchResults = computed<NameSearchResult[]>(() => {
  const query = normalizedNameQuery.value
  if (!canUseNameSearch.value || !query) return []

  return mockCourses
    .filter((course) => isSemesterMatch(course) && isScheduleMatch(course))
    .map((course) => ({ course, score: getCourseNameScore(course, query) }))
    .filter((result) => result.score >= 45)
    .sort((a, b) => {
      const scoreDiff = b.score - a.score
      if (scoreDiff !== 0) return scoreDiff
      return displayCourseName(a.course.name).localeCompare(displayCourseName(b.course.name), 'ja')
    })
    .slice(0, 12)
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
  return name.split('／')[0] ?? name
}

const normalizeSearchText = (value: string) => {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[、，,\s／/()（）［］[\]「」『』・:：-]/g, '')
}

const levenshteinDistance = (a: string, b: string) => {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  const current = Array.from({ length: b.length + 1 }, () => 0)

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      )
    }
    previous.splice(0, previous.length, ...current)
  }

  return previous[b.length] ?? 0
}

const closestEditSimilarity = (query: string, target: string) => {
  if (!query || !target) return 0
  if (target.length <= query.length) {
    const distance = levenshteinDistance(query, target)
    return 1 - distance / Math.max(query.length, target.length)
  }

  let best = 0
  const windowSizes = [query.length, query.length + 1, query.length + 2]
  for (const size of windowSizes) {
    if (size > target.length) continue
    for (let index = 0; index <= target.length - size; index += 1) {
      const piece = target.slice(index, index + size)
      const distance = levenshteinDistance(query, piece)
      const similarity = 1 - distance / Math.max(query.length, piece.length)
      best = Math.max(best, similarity)
    }
  }
  return best
}

const subsequenceScore = (query: string, target: string) => {
  let queryIndex = 0
  for (const character of target) {
    if (character === query[queryIndex]) {
      queryIndex += 1
      if (queryIndex === query.length) {
        return 55 + (query.length / target.length) * 10
      }
    }
  }
  return 0
}

const getTextNameScore = (query: string, target: string) => {
  if (!target) return 0
  if (target === query) return 120
  if (target.startsWith(query)) return 100 + (query.length / target.length) * 10
  if (target.includes(query)) return 80 + (query.length / target.length) * 10
  if (query.includes(target)) return 70

  const similarity = closestEditSimilarity(query, target)
  const editScore = similarity >= 0.55 ? similarity * 70 : 0
  return Math.max(subsequenceScore(query, target), editScore)
}

const getCourseNameScore = (course: Course, query: string) => {
  const names = [course.name, displayCourseName(course.name), ...course.name.split(/[／/]/)].map(
    normalizeSearchText,
  )

  return Math.max(...names.map((name) => getTextNameScore(query, name)))
}

const canRegisterCourse = (course: Course) => {
  return course.period !== null && course.day !== '他'
}

const getNameSearchActionLabel = (course: Course) => {
  if (isCandidate(course.id)) return '登録済み'
  if (!canRegisterCourse(course)) return '時間未定'
  return '登録'
}

const visibleTags = (course: Course) => {
  const selectedTags = course.conditions.filter((condition) =>
    store.selectedConditions.includes(condition),
  )
  const otherTags = course.conditions.filter(
    (condition) => !store.selectedConditions.includes(condition),
  )
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
  color: #111827;
  font-weight: 900;
  text-shadow: 2px 2px 0 var(--comic-yellow);
}

.description {
  margin: 0;
  color: #111827;
  font-weight: 700;
}

.result-count {
  flex: 0 0 auto;
  padding: 0.45rem 0.8rem;
  border: 3px solid #111827;
  border-radius: 999px;
  background: var(--comic-yellow);
  color: #111827;
  font-weight: 900;
  box-shadow: 3px 3px 0 #111827;
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
  border: 3px solid #111827;
  border-radius: 0.65rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  position: relative;
  box-shadow: 5px 5px 0 #111827;
}

.course-card.friend-match,
.name-search-result.friend-match {
  border-color: var(--comic-green);
  background: #ecfeff;
  box-shadow: 5px 5px 0 var(--comic-green);
}

.course-friend-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.friend-match-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.55rem;
  color: #047857;
  font-size: 0.75rem;
}

.friend-course-section {
  border-color: var(--comic-green);
  background: #ecfeff;
}

.course-card:hover {
  border-color: #111827;
  transform: translate(-2px, -2px);
  box-shadow: 7px 7px 0 #111827;
}

.course-card.chosen {
  border-color: #111827;
  background: #e7fffb;
  box-shadow:
    5px 5px 0 #111827,
    inset 0 0 0 4px var(--comic-green);
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
  color: #111827;
  font-size: 1.1rem;
  line-height: 1.45;
}

.schedule-badge {
  background-color: var(--comic-yellow);
  padding: 0.3rem 0.6rem;
  border: 2px solid #111827;
  border-radius: 0.45rem;
  font-size: 0.8rem;
  color: #111827;
  font-weight: 900;
  line-height: 1;
  text-align: right;
  white-space: nowrap;
}

.teacher {
  margin: 0.35rem 0 0;
  color: #111827;
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
  border: 2px solid #111827;
  border-radius: 0.45rem;
  background: #fffbe6;
  color: #111827;
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
  padding: 0.32rem 0.6rem;
  border: 3px solid #111827;
  border-radius: 999px;
  background: var(--comic-green);
  color: white;
  font-size: 0.8rem;
  font-weight: 900;
  box-shadow: 2px 2px 0 #111827;
}

.match-line {
  margin-top: 0.75rem;
  color: var(--comic-green);
  font-size: 0.85rem;
  font-weight: 700;
}

.click-hint {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #111827;
  text-align: right;
}

.candidate-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 4px solid #111827;
  border-radius: 0.65rem;
  background: white;
  box-shadow: 7px 7px 0 #111827;
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
  color: #111827;
  font-size: 1.1rem;
}

.panel-header span {
  color: var(--comic-green);
  font-weight: 900;
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
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: #fffbe6;
}

.candidate-item p {
  margin: 0.25rem 0 0;
  color: #111827;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.35;
}

.candidate-schedule {
  color: var(--comic-green);
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.35;
}

.remove-button {
  padding: 0.45rem 0.65rem;
  border: 3px solid #111827;
  border-radius: 0.45rem;
  background: white;
  color: #111827;
  cursor: pointer;
  font-weight: 700;
}

.empty-preview {
  margin: 0;
  color: #111827;
  line-height: 1.6;
  font-size: 0.9rem;
}

.confirm-button {
  width: auto;
  min-width: 9rem;
  padding: 1rem;
  border: 4px solid #111827;
  border-radius: 0.65rem;
  background: var(--comic-green);
  color: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 900;
  box-shadow: 5px 5px 0 #111827;
}

.confirm-button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.name-search-panel {
  display: grid;
  gap: 1rem;
  padding: 1.1rem;
  border: 4px solid #111827;
  border-radius: 0.65rem;
  background: #fffdf4;
  box-shadow: 7px 7px 0 #111827;
}

.name-search-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.name-search-header h3 {
  margin: 0;
  color: #111827;
  font-size: 1.1rem;
}

.name-search-header p {
  margin: 0.35rem 0 0;
  color: #111827;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.5;
}

.name-search-header span {
  flex: 0 0 auto;
  padding: 0.35rem 0.7rem;
  border: 3px solid #111827;
  border-radius: 999px;
  background: var(--comic-yellow);
  color: #111827;
  font-weight: 900;
  box-shadow: 2px 2px 0 #111827;
}

.name-search-input {
  width: 100%;
  min-height: 3rem;
  padding: 0.85rem 1rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: white;
  color: #111827;
  font-size: 1rem;
  font-weight: 700;
}

.name-search-input:focus {
  outline: none;
  border-color: var(--comic-green);
  box-shadow: 0 0 0 4px rgba(0, 166, 166, 0.2);
}

.name-search-input:disabled {
  background: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

.name-search-message {
  margin: 0;
  color: #111827;
  font-weight: 700;
  line-height: 1.6;
}

.name-search-results {
  display: grid;
  gap: 0.75rem;
}

.name-search-result {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  padding: 0.85rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: white;
  cursor: pointer;
  box-shadow: 4px 4px 0 #111827;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.name-search-result:hover,
.name-search-result:focus {
  outline: none;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #111827;
}

.name-search-result.chosen {
  background: #e7fffb;
  box-shadow:
    4px 4px 0 #111827,
    inset 0 0 0 4px var(--comic-green);
}

.name-result-main {
  min-width: 0;
}

.name-result-main h4 {
  margin: 0.25rem 0 0;
  color: #111827;
  font-size: 1rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.name-result-main p {
  margin: 0.3rem 0 0;
  color: #111827;
  font-size: 0.85rem;
  line-height: 1.45;
}

.inline-add-button {
  min-width: 5.25rem;
  padding: 0.65rem 0.85rem;
  border: 3px solid #111827;
  border-radius: 0.5rem;
  background: var(--comic-green);
  color: white;
  cursor: pointer;
  font-weight: 900;
  box-shadow: 3px 3px 0 #111827;
}

.inline-add-button:disabled {
  background: #cbd5e1;
  color: #475569;
  cursor: not-allowed;
  box-shadow: 2px 2px 0 #111827;
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
  border: 4px solid #111827;
  border-radius: 0.7rem;
  padding: 2.5rem;
  position: relative;
  text-align: left;
  box-shadow: 10px 10px 0 #111827;
}

.close-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: #111827;
  cursor: pointer;
  line-height: 1;
}

.modal-header {
  margin-bottom: 2rem;
}

.schedule-badge-large {
  display: inline-block;
  background-color: var(--comic-yellow);
  border: 3px solid #111827;
  padding: 0.375rem 1rem;
  border-radius: 999px;
  font-size: 1rem;
  color: #111827;
  margin-bottom: 1rem;
  font-weight: 600;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.75rem;
  color: #111827;
}

.modal-header p {
  margin: 0.75rem 0 0;
  color: #111827;
}

.section {
  margin-bottom: 2rem;
}

.section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #111827;
  font-weight: 900;
}

.tag-large {
  display: inline-block;
  margin: 0 0.5rem 0.5rem 0;
  padding: 0.35rem 0.7rem;
  border: 3px solid #111827;
  border-radius: 999px;
  background: var(--comic-yellow);
  color: #111827;
  font-size: 1rem;
  font-weight: 900;
  box-shadow: 2px 2px 0 #111827;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.875rem;
  margin: 0;
}

.detail-grid div {
  border: 3px solid #111827;
  border-radius: 0.55rem;
  padding: 0.75rem;
  background: #fffbe6;
}

.detail-grid dt {
  color: #111827;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.detail-grid dd {
  margin: 0;
  color: #111827;
  font-weight: 700;
}

.reason-list {
  padding-left: 1.25rem;
  margin: 0;
  color: #111827;
  line-height: 1.7;
}

.reason-list strong {
  color: var(--comic-green);
}

.add-button {
  width: 100%;
  padding: 1.25rem;
  background-color: var(--comic-green);
  color: white;
  border: 4px solid #111827;
  border-radius: 0.65rem;
  font-size: 1.125rem;
  font-weight: 900;
  box-shadow: 5px 5px 0 #111827;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-button:hover {
  background-color: #008a8a;
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
  color: #111827;
}

.retry-button {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: none;
  border: 3px solid #111827;
  color: #111827;
  border-radius: 0.55rem;
  cursor: pointer;
  font-weight: 900;
  box-shadow: 4px 4px 0 #111827;
}

.restart-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  background-color: var(--comic-yellow);
  color: #111827;
  border: 4px solid #111827;
  border-radius: 0.65rem;
  cursor: pointer;
  margin-top: 2rem;
  font-weight: 900;
  box-shadow: 5px 5px 0 #111827;
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
  h2 {
    font-size: 1.35rem;
  }

  .description {
    font-size: 0.88rem;
  }

  .page-heading {
    flex-direction: column;
    gap: 0.75rem;
  }

  .result-count {
    padding: 0.35rem 0.7rem;
    font-size: 0.85rem;
  }

  .course-list {
    gap: 0.8rem;
  }

  .course-card {
    padding: 0.9rem;
    border-width: 2px;
    box-shadow: 4px 4px 0 #111827;
  }

  .course-card:hover {
    transform: none;
    box-shadow: 4px 4px 0 #111827;
  }

  .course-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .course-header h3 {
    font-size: 1rem;
    overflow-wrap: anywhere;
  }

  .schedule-badge {
    align-self: flex-start;
  }

  .score-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem;
    margin: 0.75rem 0;
  }

  .score-row span {
    padding: 0.45rem 0.35rem;
    font-size: 0.72rem;
  }

  .candidate-panel {
    padding: 0.75rem;
    border-width: 3px;
    box-shadow: 5px 5px 0 #111827;
  }

  .candidate-list {
    grid-auto-flow: row;
    grid-auto-columns: unset;
    grid-template-columns: 1fr;
    overflow-x: visible;
  }

  .candidate-item {
    grid-template-columns: minmax(0, 1fr);
  }

  .remove-button {
    width: 100%;
  }

  .name-search-panel {
    padding: 0.75rem;
    border-width: 3px;
    box-shadow: 5px 5px 0 #111827;
  }

  .name-search-header {
    flex-direction: column;
    gap: 0.6rem;
  }

  .name-search-header h3 {
    font-size: 1rem;
  }

  .name-search-header span {
    align-self: flex-start;
  }

  .name-search-input {
    min-height: 2.8rem;
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .name-search-result {
    grid-template-columns: minmax(0, 1fr);
    border-width: 2px;
    box-shadow: 3px 3px 0 #111827;
  }

  .name-search-result:hover,
  .name-search-result:focus,
  .name-search-result.chosen {
    transform: none;
    box-shadow: 3px 3px 0 #111827;
  }

  .inline-add-button {
    width: 100%;
  }

  .tag {
    border-width: 2px;
    padding: 0.26rem 0.45rem;
    font-size: 0.7rem;
    box-shadow: 1px 1px 0 #111827;
  }

  .match-line,
  .click-hint {
    font-size: 0.72rem;
  }

  .modal-overlay {
    align-items: stretch;
    padding: 0.75rem;
  }

  .modal-content {
    max-height: calc(100vh - 1.5rem);
    padding: 1.25rem;
    border-width: 3px;
    box-shadow: 5px 5px 0 #111827;
  }

  .close-button {
    top: 0.75rem;
    right: 0.75rem;
  }

  .modal-header h3 {
    padding-right: 2rem;
    font-size: 1.25rem;
    overflow-wrap: anywhere;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .tag-large {
    font-size: 0.85rem;
    overflow-wrap: anywhere;
  }
}
</style>
