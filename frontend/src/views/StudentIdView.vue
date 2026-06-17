<template>
  <BaseLayout>
    <div class="student-id-view">
      <div class="hero">
        <div class="m-logo-container">
          <div class="m-logo-deco deco-star">⭐</div>
          <div class="m-logo-deco deco-heart">💖</div>
          <div class="m-logo-deco deco-wand">🪄</div>
          <h1 class="m-logo">ラクタン・マジカ</h1>
        </div>
        <p class="subtitle">疲れたあなたに、魔法の履修を。✨</p>
      </div>

      <div class="magic-input-card">
        <p class="instruction">まずは学籍番号を教えてください。<br>あなたの運命（学部・学年）を導き出します。</p>
        
        <div class="input-group">
          <input 
            v-model="inputId" 
            type="text" 
            placeholder="24100123" 
            @input="onInput"
            maxlength="10"
            inputmode="numeric"
            class="magic-input"
          >
        </div>

        <Transition name="fade">
          <div v-if="store.department" class="info-badge">
            <span class="label">召喚結果:</span>
            <span class="value">{{ store.department }} {{ store.grade }}年生</span>
          </div>
        </Transition>
      </div>

      <div class="action-container">
        <button 
          :disabled="!store.department" 
          @click="$router.push('/conditions')"
          class="m-action-btn start-button"
        >
          魔法をかける <span>✨</span>
        </button>
      </div>

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

.subtitle {
  font-size: 1.1rem;
  color: var(--magic-text-sub);
  font-weight: 800;
  letter-spacing: 0.1em;
  margin-top: -1rem;
}

.magic-input-card {
  background: rgba(255, 255, 255, 0.4);
  padding: 2.5rem 1.5rem;
  border-radius: var(--magic-radius-md);
  border: 2px solid var(--magic-silver);
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.8);
}

.instruction {
  margin-bottom: 2rem;
  line-height: 1.8;
  color: var(--magic-text-main);
  font-size: 1rem;
  font-weight: 800;
}

.input-group {
  margin-bottom: 1.5rem;
}

.magic-input {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.75rem;
  border: 3px solid var(--magic-silver);
  border-radius: var(--magic-radius-md);
  text-align: center;
  transition: all 0.3s;
  background: white;
  color: var(--magic-text-main);
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.magic-input:focus {
  outline: none;
  border-color: var(--magic-pink-accent);
  box-shadow: 0 0 25px var(--magic-shadow-pink);
  transform: scale(1.02);
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, var(--magic-white) 0%, var(--magic-pink-bg) 100%);
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  color: var(--magic-text-main);
  font-weight: 800;
  font-size: 0.95rem;
  border: 2px solid var(--magic-white);
  box-shadow: 0 5px 15px var(--magic-shadow-lavender);
}

.info-badge .label {
  opacity: 0.8;
}

.action-container {
  display: flex;
  justify-content: center;
}

.start-button {
  width: 100%;
  max-width: 320px;
}

.footer-note {
  font-size: 0.75rem;
  color: var(--magic-text-sub);
  opacity: 0.8;
  font-weight: 700;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}

/* Adjust logo for mobile */
@media (max-width: 480px) {
  .m-logo {
    font-size: 2.2rem;
    padding: 0.5rem 1rem;
  }
  .deco-wand {
    font-size: 1.8rem;
    right: -25px;
  }
}
</style>
