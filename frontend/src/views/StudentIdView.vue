<template>
  <BaseLayout>
    <div class="student-id-view">
      <div class="hero">
        <h1>らくたんん!!</h1>
        <p class="subtitle">疲れたあなたに、ちょうどいい履修を。</p>
      </div>

      <div class="card">
        <p class="instruction">まずは学籍番号を教えてください。<br>学部や学年を自動で判別します。</p>
        
        <div class="input-group">
          <input 
            v-model="inputId" 
            type="text" 
            placeholder="例: 24XXXNKU01" 
            @input="onInput"
            maxlength="10"
          >
        </div>

        <Transition name="fade">
          <div v-if="store.department" class="info-badge">
            <span class="label">判定結果:</span>
            <span class="value">{{ store.department }} {{ store.grade }}年生</span>
          </div>
        </Transition>
      </div>

      <button 
        :disabled="!store.department" 
        @click="$router.push('/conditions')"
        class="next-button"
      >
        はじめる
      </button>

      <p class="footer-note">※学籍番号は解析にのみ使用し、保存されません。</p>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseLayout from '../components/BaseLayout.vue'
import { store } from '../store'

const inputId = ref(store.studentId)

const onInput = () => {
  store.setStudentId(inputId.value)
}
</script>

<style scoped>
.student-id-view {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hero {
  margin-top: 1rem;
}

h1 {
  font-family:
    "にくまるフォント",
    "Nikumarufont",
    "Nikumarufont Regular",
    "M PLUS Rounded 1c",
    "Zen Maru Gothic",
    "Arial Black",
    "Hiragino Maru Gothic ProN",
    "Yu Gothic",
    sans-serif;
  box-sizing: border-box;
  display: block;
  width: min(100%, 30rem);
  margin-inline: auto;
  padding-right: 0.75rem;
  padding-bottom: 0.75rem;
  font-size: clamp(2.25rem, 8.5vw, 4.75rem);
  margin-bottom: 0.5rem;
  color: #111827;
  font-weight: 1000;
  letter-spacing: 0;
  line-height: 1;
  white-space: nowrap;
  -webkit-text-stroke: 2.5px #111827;
  paint-order: stroke fill;
  text-shadow:
    1px 0 0 #111827,
    -1px 0 0 #111827,
    0 -1px 0 #111827,
    2px 0 0 #111827,
    0 2px 0 #111827,
    3px 3px 0 var(--comic-green),
    6px 6px 0 var(--comic-green),
    9px 9px 0 var(--comic-green),
    -3px -4px 0 rgba(255, 244, 74, 0.85),
    -6px -2px 0 rgba(255, 244, 74, 0.85),
    -9px 0 0 rgba(255, 244, 74, 0.7);
}

.subtitle {
  font-size: 1.1rem;
  color: #111827;
  font-weight: 800;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 0.7rem;
  border: 4px solid #111827;
  box-shadow: 7px 7px 0 #111827;
}

.instruction {
  margin-bottom: 2rem;
  line-height: 1.8;
  color: #111827;
  font-size: 1.1rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

input {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.75rem;
  border: 4px solid #111827;
  border-radius: 0.7rem;
  text-align: center;
  transition: all 0.2s;
  background: #ffffff;
  color: #111827;
  font-weight: 900;
  box-shadow: inset 4px 4px 0 rgba(17, 24, 39, 0.08);
}

input:focus {
  outline: none;
  border-color: var(--comic-green);
  box-shadow: 0 0 0 4px rgba(0, 166, 166, 0.22), inset 4px 4px 0 rgba(17, 24, 39, 0.08);
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--comic-yellow);
  padding: 0.75rem 1.5rem;
  border-radius: 0.7rem;
  color: #111827;
  font-weight: 900;
  border: 3px solid #111827;
  box-shadow: 4px 4px 0 #111827;
}

.info-badge .label {
  font-size: 0.875rem;
  opacity: 0.7;
}

.next-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.25rem;
  font-weight: 900;
  background-color: var(--comic-green);
  color: white;
  border: 4px solid #111827;
  border-radius: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 7px 7px 0 #111827;
}

.next-button:hover:not(:disabled) {
  background-color: #008a8a;
  transform: translate(-2px, -2px);
  box-shadow: 9px 9px 0 #111827;
}

.next-button:active:not(:disabled) {
  transform: translateY(0);
}

.next-button:disabled {
  background-color: #d1d5db;
  color: #6b7280;
  box-shadow: 4px 4px 0 #111827;
  cursor: not-allowed;
}

.footer-note {
  font-size: 0.8rem;
  color: #4b5563;
  font-weight: 800;
}

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
