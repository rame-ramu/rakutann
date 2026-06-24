<template>
  <BaseLayout>
    <div class="student-id-view">
      <div class="hero">
        <h1>らくたんん</h1>
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
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: #3b82f6;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.subtitle {
  font-size: 1.1rem;
  color: #64748b;
  font-weight: 500;
}

.card {
  background: #f8fafc;
  padding: 2rem;
  border-radius: 1.5rem;
  border: 1px solid #e2e8f0;
}

.instruction {
  margin-bottom: 2rem;
  line-height: 1.8;
  color: #475569;
  font-size: 1.1rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

input {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.75rem;
  border: 3px solid #e2e8f0;
  border-radius: 1rem;
  text-align: center;
  transition: all 0.2s;
  background: white;
  color: #1e293b;
  font-weight: 600;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #dbeafe;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  color: #1e40af;
  font-weight: 600;
  border: 1px solid #bfdbfe;
}

.info-badge .label {
  font-size: 0.875rem;
  opacity: 0.7;
}

.next-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.next-button:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
}

.next-button:active:not(:disabled) {
  transform: translateY(0);
}

.next-button:disabled {
  background-color: #cbd5e1;
  box-shadow: none;
  cursor: not-allowed;
}

.footer-note {
  font-size: 0.8rem;
  color: #94a3b8;
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
