<template>
  <BaseLayout>
    <div class="student-id-view">
      <!-- 1. サービスロゴとキャッチコピー -->
      <div class="hero-section">
        <h1 class="service-logo">楽単ミッケ</h1>
        <div class="catchphrase-container">
          <p class="catchphrase-badge">自分にピッタリの授業選び</p>
        </div>
      </div>

      <!-- 2. 短い説明文（導入） -->
      <div class="intro-text">
        <p>学籍番号を入力するだけで、<br>あなたの学部に合った授業を提案します。</p>
      </div>

      <!-- 3. 入力エリアと開始ボタンのグループ（メインアクション） -->
      <div class="main-action-group">
        <div class="input-container">
          <input 
            v-model="studentIdInput" 
            type="text" 
            placeholder="学籍番号を入力（例: 24100123）" 
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

        <!-- はじめるボタン -->
        <button 
          :disabled="!isReadyToStart" 
          @click="goToNextStep"
          class="start-button"
        >
          はじめる
        </button>
      </div>

      <!-- 4. サイトの詳細ガイド（補足情報） -->
      <div class="usage-guide">
        <p>このあとは「好きな条件」と「空き時間」を選ぶだけで、あなたに理想のスケジュールが完成します✨</p>
      </div>

      <!-- 5. 注意書き -->
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
  gap: 1.5rem; /* 要素間の隙間を適切に調整 */
  max-width: 400px; /* PCでの見やすさのために少し絞る */
  margin: 0 auto;
}

/* ヒーローエリア（ロゴとキャッチコピー） */
.hero-section {
  padding: 0.5rem 0;
}

.service-logo {
  font-size: 4rem; /* わずかに調整 */
  margin: 0.5rem 0 0.5rem 0;
  color: #4FB3E8;
  font-weight: 900;
  display: block;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  
  text-shadow: 
    1px 1px 0 #FFF,
    2px 2px 0 #FFF,
    3px 3px 0 #2D3436,
    4px 4px 0 #2D3436,
    7px 7px 0 rgba(79, 179, 232, 0.2);
  
  letter-spacing: -0.02em;
}

.catchphrase-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.catchphrase-badge {
  font-size: 0.95rem;
  color: #2D3436;
  font-weight: 800;
  background: #EBFBFF;
  display: inline-block;
  padding: 0.4rem 1.2rem;
  border-radius: 2rem;
  border: 2px solid #2D3436;
  box-shadow: 3px 3px 0 #2D3436;
}

/* 導入テキスト */
.intro-text {
  margin-bottom: 0.5rem;
}

.intro-text p {
  color: #4A5568;
  font-size: 1.05rem;
  line-height: 1.6;
  font-weight: 800;
  margin: 0;
}

/* メインアクションのグループ（入力欄、結果、ボタン） */
.main-action-group {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #FFF;
  padding: 0.5rem 0;
}

/* 学籍番号入力欄のスタイル */
.id-input-field {
  width: 100%;
  padding: 1.1rem;
  font-size: 1.6rem;
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
  justify-content: center;
  gap: 0.75rem;
  background-color: #EBFBFF; /* 水色系に変更して統一感アップ */
  padding: 0.8rem 1.5rem;
  border-radius: 1.5rem;
  color: #2D3436;
  font-weight: 800;
  border: 2px solid #2D3436;
  box-shadow: 4px 4px 0 #2D3436;
  margin: 0 auto;
  width: fit-content;
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

/* 補足ガイドと注意書き */
.usage-guide {
  background-color: #F0F9FF;
  padding: 1rem 1.25rem;
  border-radius: 1.25rem;
  border: 2px dashed #4FB3E8;
  margin-top: 0.5rem;
}

.usage-guide p {
  margin: 0;
  color: #4A5568;
  font-size: 0.9rem;
  line-height: 1.5;
  font-weight: 700;
}

.privacy-note {
  font-size: 0.8rem;
  color: #718096;
  font-weight: 700;
  margin-top: 0.5rem;
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