<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 前の画面から引き継いだ情報（クエリパラメータ）
const faculty = computed(() => route.query.faculty as string || '不明な学部')

const days = ['月', '火', '水', '木', '金']
const periods = [1, 2, 3, 4, 5]
const tagOptions = ['テストなし', '出席なし', 'レポートのみ', 'オンライン']

const selectedDay = ref('')
const selectedPeriod = ref<number | null>(null)
const selectedTags = ref<string[]>([])
const searchQuery = ref('')

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

const canProceed = computed(() => selectedDay.value !== '' && selectedPeriod.value !== null)

const goToConfirmation = () => {
  router.push({
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
</script>

<template>
  <div class="card">
    <h1 class="title">いつ、どんな授業がいい？</h1>
    <p class="subtitle">{{ faculty }}の授業を探します</p>

    <div class="section">
      <h2 class="section-title">曜日</h2>
      <div class="button-group">
        <button 
          v-for="day in days" 
          :key="day"
          :class="{ active: selectedDay === day }"
          @click="selectedDay = day"
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
          @click="selectedPeriod = p"
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
          @click="toggleTag(tag)"
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
        />
      </div>
    </div>

    <div class="footer">
      <button 
        :disabled="!canProceed" 
        @click="goToConfirmation"
        class="next-button"
      >
        この条件で確認する
      </button>
      <button @click="router.back()" class="back-link">もどる</button>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.title {
  font-size: 20px;
  margin-bottom: 4px;
  text-align: center;
}

.subtitle {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 24px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  margin-bottom: 12px;
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
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.footer {
  margin-top: 32px;
  text-align: center;
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
  margin-bottom: 16px;
}

.next-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.back-link {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
}
</style>
