<template>
  <BaseLayout>
    <div class="student-id-view">
      <!-- サービスロゴとキャッチコピー -->
      <div class="hero-section">
        <h1 class="service-logo">らくたんん</h1>
        <p class="catchphrase-badge">疲れたあなたに、ちょうどいい履修を。</p>
      </div>

      <!-- 入力カードエリア -->
      <div class="input-card">
        <p class="guide-text">
          まずは学籍番号を教えてください。<br>
          学部や学年を自動で判別します。
        </p>
        
        <div class="input-container">
          <input 
            v-model="studentIdInput" 
            type="text" 
            placeholder="例: 24100123" 
            @input="handleIdInput"
            maxlength="10"
            inputmode="numeric"
            class="id-input-field"
          >
        </div>

        <!-- 判定結果の表示（学籍番号が正しい形式の時のみ表示） -->
        <Transition name="fade">
          <div v-if="store.department" class="result-badge">
            <span class="result-label">判定結果:</span>
            <span class="result-value">{{ store.department }} {{ store.grade }}年生</span>
          </div>
        </Transition>
      </div>

      <!-- 次へ進むボタン（判定が完了するまで押せません） -->
      <button 
        :disabled="!isReadyToStart" 
        @click="goToNextStep"
        class="start-button"
      >
        はじめる
      </button>

      <p class="privacy-note">※学籍番号は解析にのみ使用し、保存されません。</p>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'
import { store } from '../store'

const router = useRouter()

// ユーザーが入力中の学籍番号（リアクティブな変数）
const studentIdInput = ref(store.studentId)

// 次のステップに進める状態かどうかを判定（学籍番号から学部が判定できているか）
const isReadyToStart = computed(() => {
  return store.department !== ''
})

// 入力があった時に実行される関数
function handleIdInput() {
  // ストアに入力値を保存し、自動解析を実行する
  store.setStudentId(studentIdInput.value)
}

// ボタンクリック時に次の画面へ移動する関数
function goToNextStep() {
  router.push('/conditions')
}
</script>

<style scoped>
/* 全体のレイアウト設定 */
.student-id-view {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* ヒーローエリア（ロゴとキャッチコピー） */
.hero-section {
  padding: 1rem 0;
}

.service-logo {
  font-size: 3.5rem;
  margin: 0 0 0.5rem 0;
  color: #4FB3E8; /* Light Blue Theme */
  font-weight: 900;
  letter-spacing: -0.02em;
  display: inline-block;
  
  /* レトロポップなロゴ表現（太い縁取りと影） */
  -webkit-text-stroke: 2px #2D3436;
  text-shadow: 4px 4px 0 #2D3436;
  font-family: 'Hiragino Maru Gothic ProN', sans-serif;
}

.catchphrase-badge {
  font-size: 1rem;
  color: #2D3436;
  font-weight: 800;
  background: #EBFBFF; /* Light Blue Accent */
  display: inline-block;
  padding: 0.4rem 1.2rem;
  border-radius: 2rem;
  border: 2px solid #2D3436;
  box-shadow: 3px 3px 0 #2D3436;
  margin-top: 0.5rem;
}

/* 入力エリアのカードデザイン */
.input-card {
  background: #FFF;
  padding: 0;
}

.guide-text {
  margin-bottom: 2rem;
  line-height: 1.8;
  color: #2D3436;
  font-size: 1.1rem;
  font-weight: 800;
}

/* 学籍番号入力欄のスタイル */
.id-input-field {
  width: 100%;
  padding: 1.25rem;
  font-size: 2rem;
  border: 3px solid #2D3436;
  border-radius: 1.5rem;
  text-align: center;
  background: #F8F9FA;
  color: #2D3436;
  font-weight: 900;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.05);
  transition: all 0.2s;
  font-family: inherit;
}

.id-input-field:focus {
  outline: none;
  background: #FFF;
  border-color: #4FB3E8;
  box-shadow: 5px 5px 0 #4FB3E8;
}

/* 判定結果のバッジ */
.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #F8F9FA;
  padding: 0.8rem 1.5rem;
  border-radius: 1.5rem;
  color: #2D3436;
  font-weight: 800;
  border: 2px solid #2D3436;
  box-shadow: 4px 4px 0 #2D3436;
  margin-top: 1rem;
}

/* はじめるボタンのスタイル */
.start-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.4rem;
  font-weight: 900;
  background: #4FB3E8;
  color: white;
  border: 3px solid #2D3436;
  border-radius: 1.5rem;
  cursor: pointer;
  box-shadow: 5px 5px 0 #2D3436;
  transition: all 0.1s;
  font-family: inherit;
}

.start-button:hover:not(:disabled) {
  background: #75C6F0;
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 #2D3436;
}

.start-button:active:not(:disabled) {
  transform: translate(3px, 3px);
  box-shadow: 2px 2px 0 #2D3436;
}

.start-button:disabled {
  background: #CBD5E0;
  box-shadow: 3px 3px 0 #2D3436;
  color: #718096;
  cursor: not-allowed;
  opacity: 0.8;
}

.privacy-note {
  font-size: 0.85rem;
  color: #718096;
  font-weight: 700;
}

/* 判定結果のアニメーション設定 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>