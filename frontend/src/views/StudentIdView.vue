<template>
  <BaseLayout>
    <div class="student-id-view">
      <div class="hero">
        <h1 class="logo-text">楽単日和</h1>
        <p class="subtitle">今日は楽単日和だよ。<br>ゆっくり進もうね。</p>
      </div>

      <div class="input-card">
        <p class="instruction">まずは学籍番号を教えてください。<br>学部や学年を自動で判別します。</p>
        
        <div class="input-group">
          <input 
            v-model="inputId" 
            type="text" 
            placeholder="例: 24100123" 
            @input="onInput"
            maxlength="10"
            inputmode="numeric"
          >
          <div class="input-underline"></div>
        </div>

        <Transition name="cloud-fade">
          <div v-if="store.department" class="info-cloud">
            <span class="label">あなたは...</span>
            <div class="value-container">
              <span class="value">{{ store.department }} {{ store.grade }}年生</span>
            </div>
            <span class="label">ですね！</span>
          </div>
        </Transition>
      </div>

      <button 
        :disabled="!store.department" 
        @click="$router.push('/conditions')"
        class="jewel-button"
      >
        <span>はじめる</span>
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
  gap: 2.5rem;
}

.hero {
  margin-top: 0.5rem;
}

.logo-text {
  font-size: 3.5rem;
  margin-bottom: 0.75rem;
  color: var(--theme-jewel);
  font-weight: 800;
  letter-spacing: -0.02em;
  text-shadow: 4px 4px 0 var(--theme-pink);
}

.subtitle {
  font-size: 1.2rem;
  color: var(--theme-text);
  font-weight: 500;
  line-height: 1.6;
  opacity: 0.8;
}

.input-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.instruction {
  line-height: 1.8;
  color: var(--theme-text);
  font-size: 1rem;
  font-weight: 500;
}

.input-group {
  position: relative;
  margin: 1rem 0;
}

input {
  width: 100%;
  padding: 1rem;
  font-size: 2rem;
  border: none;
  background: transparent;
  text-align: center;
  color: var(--theme-text);
  font-weight: 800;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  letter-spacing: 0.1em;
}

input:focus {
  outline: none;
}

.input-underline {
  height: 4px;
  background: var(--theme-pink);
  border-radius: 2px;
  width: 80%;
  margin: 0 auto;
}

.info-cloud {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--theme-lavender);
  padding: 1.5rem;
  border-radius: 2rem;
  color: var(--theme-text);
  border: 3px solid white;
  box-shadow: 0 8px 20px var(--theme-shadow);
  margin-top: 1rem;
}

.info-cloud .label {
  font-size: 0.9rem;
  font-weight: 700;
  opacity: 0.6;
}

.value-container {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--theme-jewel);
}

.jewel-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--theme-jewel-light), var(--theme-jewel));
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 0 #e91e6344, 0 15px 25px #ff80ab44;
  position: relative;
  overflow: hidden;
}

.jewel-button::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%);
  transform: scale(0);
  transition: transform 0.6s;
}

.jewel-button:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.jewel-button:hover:not(:disabled)::after {
  transform: scale(1);
}

.jewel-button:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 4px 0 #e91e6344, 0 8px 15px #ff80ab44;
}

.jewel-button:disabled {
  background: #e2e8f0;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.6;
}

.footer-note {
  font-size: 0.8rem;
  color: var(--theme-text);
  opacity: 0.5;
}

.cloud-fade-enter-active,
.cloud-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.cloud-fade-enter-from,
.cloud-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}
</style>
