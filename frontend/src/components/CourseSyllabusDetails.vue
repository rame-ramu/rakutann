<script setup lang="ts">
import { ref, watch } from 'vue'
import { getPeriodTime } from '../constants/classTimes'
import { getSyllabusUrlResult, type SyllabusUrlResult } from '../services/syllabusUrls'
import type { Course } from '../store'
import { formatCourseSchedule } from '../utils/courseSchedule'

const props = defineProps<{ course: Course }>()

const syllabusResult = ref<SyllabusUrlResult | null>(null)
let requestId = 0

const formatScheduleWithTime = (course: Course) => {
  const schedule = formatCourseSchedule(course)
  if (course.period === null) return schedule
  const periodTime = getPeriodTime(course.period)
  return periodTime ? `${schedule} ${periodTime}` : schedule
}

const loadSyllabusUrl = async () => {
  const currentRequestId = ++requestId
  syllabusResult.value = null
  const result = await getSyllabusUrlResult(props.course.id, props.course.syllabusUrl)
  if (currentRequestId === requestId) syllabusResult.value = result
}

watch(() => props.course.id, loadSyllabusUrl, { immediate: true })
</script>

<template>
  <div class="course-syllabus-details">
    <dl class="detail-grid">
      <div>
        <dt>開講学期</dt>
        <dd>{{ course.semester }}</dd>
      </div>
      <div>
        <dt>曜日・時限</dt>
        <dd>{{ formatScheduleWithTime(course) }}</dd>
      </div>
      <div>
        <dt>単位数</dt>
        <dd>{{ course.credits }}単位</dd>
      </div>
      <div>
        <dt>授業形態</dt>
        <dd>{{ course.classFormat }}</dd>
      </div>
      <div>
        <dt>態度割合</dt>
        <dd>{{ course.attendancePercent }}%</dd>
      </div>
      <div>
        <dt>レポート・課題</dt>
        <dd>{{ course.reportPercent }}%</dd>
      </div>
      <div>
        <dt>試験</dt>
        <dd>{{ course.examPercent }}%</dd>
      </div>
      <div>
        <dt>オンデマンド</dt>
        <dd>{{ course.onDemandLabel }}（{{ course.onDemandPercent }}%）</dd>
      </div>
      <div>
        <dt>前提履修</dt>
        <dd>{{ course.prerequisiteLabel }}</dd>
      </div>
    </dl>

    <div class="syllabus-url-block">
      <span>公式シラバスURL</span>
      <strong v-if="!syllabusResult">読み込み中…</strong>
      <a
        v-else-if="syllabusResult.status === 'success'"
        :href="syllabusResult.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ syllabusResult.url }}
      </a>
      <div v-else-if="syllabusResult.status === 'error'" class="url-error" role="alert">
        <strong>URLを読み込めませんでした。</strong>
        <button type="button" @click="loadSyllabusUrl">再読み込み</button>
      </div>
      <strong v-else>URL情報なし</strong>
    </div>
  </div>
</template>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.875rem;
  margin: 0;
}

.detail-grid div {
  padding: 0.75rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: #fffbe6;
}

.detail-grid dt {
  margin-bottom: 0.35rem;
  color: #111827;
  font-size: 0.75rem;
  font-weight: 700;
}

.detail-grid dd {
  margin: 0;
  color: #111827;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.syllabus-url-block {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.875rem;
  padding: 0.85rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: #e7fffb;
}

.syllabus-url-block > span {
  color: #111827;
  font-size: 0.75rem;
  font-weight: 900;
}

.syllabus-url-block a {
  color: #006f73;
  font-size: 0.85rem;
  font-weight: 800;
  overflow-wrap: anywhere;
  text-decoration-thickness: 2px;
}

.url-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  color: #991b1b;
}

.url-error button {
  padding: 0.35rem 0.6rem;
  border: 2px solid #111827;
  border-radius: 0.45rem;
  background: white;
  color: #111827;
  cursor: pointer;
  font-weight: 900;
}

@media (max-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
