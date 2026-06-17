<template>
  <BaseLayout>
    <div class="student-id-view">
      <div class="hero">
        <h1 class="manga-title">らくたんん</h1>
        <p class="subtitle">疲れたあなたに、ちょうどいい履修を。</p>
      </div>

      <div class="card manga-bubble">
        <p class="instruction">まずは学籍番号を教えてください。<br>学部や学年を自動で判別します。</p>
        
        <div class="input-group">
          <input 
            v-model="inputId" 
            type="text" 
            placeholder="24100123" 
            @input="onInput"
            maxlength="10"
            inputmode="numeric"
            class="manga-input"
          >
        </div>

        <Transition name="fade">
          <div v-if="store.department" class="info-badge manga-badge">
            <div class="manga-badge-inner">
              <span class="label">判定結果ッ！</span>
              <span class="value">{{ store.department }}<br>{{ store.grade }}年生</span>
            </div>
          </div>
        </Transition>
      </div>

      <button 
        :disabled="!store.department" 
        @click="$router.push('/conditions')"
        class="next-button manga-button"
      >
        開始！！
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
  max-width: 400px;
  margin: 0 auto;
}

.hero {
  margin-top: 1rem;
  transform: rotate(-2deg);
}

.manga-title {
  font-size: 4rem;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
  font-weight: 900;
  letter-spacing: -0.02em;
  text-shadow: 
    3px 3px 0 var(--color-manga-accent),
    -2px -2px 0 var(--color-manga-accent-secondary);
}

.subtitle {
  font-size: 1.1rem;
  color: var(--color-heading);
  font-weight: 700;
  background: var(--color-manga-accent-secondary);
  display: inline-block;
  padding: 0.2rem 1rem;
  transform: rotate(1deg);
  border: 2px solid var(--color-heading);
}

.manga-bubble {
  background: white;
  padding: 2.5rem;
  border-radius: 2rem;
  border: 4px solid var(--color-heading);
  position: relative;
  box-shadow: 8px 8px 0 var(--color-manga-accent);
}

.instruction {
  margin-bottom: 2rem;
  line-height: 1.6;
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 700;
}

.manga-input {
  width: 100%;
  padding: 1rem;
  font-size: 2rem;
  border: 4px solid var(--color-heading);
  border-radius: 1rem;
  text-align: center;
  transition: all 0.1s;
  background: white;
  color: var(--color-heading);
  font-weight: 900;
}

.manga-input:focus {
  outline: none;
  transform: scale(1.02);
  background: #f0fdfa;
  border-color: var(--color-manga-accent);
}

.manga-badge {
  display: inline-block;
  background-color: var(--color-manga-accent-secondary);
  padding: 1rem 1.5rem;
  border-radius: 1rem;
  color: var(--color-heading);
  border: 3px solid var(--color-heading);
  transform: rotate(2deg) translateY(10px);
  box-shadow: 4px 4px 0 var(--color-heading);
}

.manga-badge-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.manga-badge .label {
  font-size: 0.8rem;
  font-weight: 900;
  background: var(--color-manga-accent);
  color: white;
  padding: 0.1rem 0.5rem;
  border-radius: 0.25rem;
  margin-bottom: 0.25rem;
  border: 1px solid var(--color-heading);
}

.manga-badge .value {
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.2;
}

.manga-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.5rem;
  font-weight: 900;
  background-color: var(--color-manga-accent);
  color: white;
  border: 4px solid var(--color-heading);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.1s;
  box-shadow: 6px 6px 0 var(--color-manga-accent-secondary);
}

.manga-button:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--color-manga-accent-secondary);
  background-color: var(--color-manga-accent-secondary);
  color: var(--color-heading);
}

.manga-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--color-manga-accent-secondary);
}

.manga-button:disabled {
  background-color: #e4e4e7;
  color: #a1a1aa;
  border-color: #d4d4d8;
  box-shadow: none;
  cursor: not-allowed;
}

.footer-note {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 700;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8) rotate(-5deg) translateY(20px);
}
</style>
