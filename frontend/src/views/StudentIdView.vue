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
            <span v-if="store.isGradeManuallySelected" class="manual-note">手動選択</span>
          </div>
        </Transition>

        <Transition name="fade">
          <div v-if="store.department" class="grade-picker">
            <div class="grade-picker-header">
              <span>学年</span>
              <small v-if="store.autoDetectedGrade">
                自動判定: {{ store.autoDetectedGrade }}年生
              </small>
            </div>
            <div class="grade-options" role="group" aria-label="学年を選択">
              <button
                v-for="grade in gradeOptions"
                :key="grade"
                type="button"
                class="grade-button"
                :class="{ active: store.grade === grade }"
                @click="store.setGrade(grade)"
              >
                {{ grade }}年
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <button 
        :disabled="!store.department || !store.grade" 
        @click="$router.push('/conditions')"
        class="next-button"
      >
        はじめる
      </button>

      <p class="footer-note">※学籍番号は解析にのみ使用し、保存されません。</p>
      <button @click="deleteSavedData" class="delete-save-button">保存データを削除する</button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseLayout from '../components/BaseLayout.vue'
import { store } from '../store'
import { clearPersistedState, resumePersistence } from '../utils/persistence'

const router = useRouter()
const inputId = ref(store.studentId)
const gradeOptions = [1, 2, 3, 4]

const onInput = () => {
  store.setStudentId(inputId.value)
}

const deleteSavedData = async () => {
  if (window.confirm('保存された時間割やお気に入りをすべて削除しますか？')) {
    clearPersistedState()
    inputId.value = ''
    try {
      await router.push('/')
    } finally {
      resumePersistence()
    }
  }
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
  text-transform: uppercase;
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

.manual-note {
  padding: 0.25rem 0.5rem;
  border: 2px solid #111827;
  border-radius: 999px;
  background: white;
  font-size: 0.75rem;
  line-height: 1;
}

.grade-picker {
  margin-top: 1.25rem;
  text-align: left;
}

.grade-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.75rem;
  color: #111827;
  font-weight: 900;
}

.grade-picker-header small {
  color: #4b5563;
  font-size: 0.8rem;
  font-weight: 800;
}

.grade-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
}

.grade-button {
  min-height: 3rem;
  padding: 0.7rem 0.5rem;
  border: 3px solid #111827;
  border-radius: 0.6rem;
  background: white;
  color: #111827;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 900;
  box-shadow: 4px 4px 0 #111827;
  transition: transform 0.15s, box-shadow 0.15s;
}

.grade-button:hover {
  background: #fffbe6;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #111827;
}

.grade-button.active {
  background: var(--comic-green);
  color: white;
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 #111827;
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

.delete-save-button {
  align-self: center;
  padding: 0.7rem 1rem;
  border: 3px solid #111827;
  border-radius: 0.7rem;
  background: #fffdf4;
  color: #b91c1c;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 900;
  box-shadow: 4px 4px 0 #111827;
  transition: transform 0.15s, box-shadow 0.15s;
}

.delete-save-button:hover {
  background: #fee2e2;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #111827;
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

@media (max-width: 640px) {
  .student-id-view {
    gap: 1.25rem;
  }

  .hero {
    margin-top: 0.25rem;
  }

  h1 {
    width: 100%;
    padding-right: 0.35rem;
    padding-bottom: 0.45rem;
    font-size: clamp(2.15rem, 13vw, 3.2rem);
    -webkit-text-stroke-width: 1.8px;
    text-shadow:
      1px 0 0 #111827,
      -1px 0 0 #111827,
      0 1px 0 #111827,
      3px 3px 0 var(--comic-green),
      6px 6px 0 var(--comic-green),
      -3px -2px 0 rgba(255, 244, 74, 0.85);
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .card {
    padding: 1.1rem;
    border-width: 3px;
    box-shadow: 5px 5px 0 #111827;
  }

  .instruction {
    margin-bottom: 1.25rem;
    font-size: 0.95rem;
    line-height: 1.65;
  }

  .input-group {
    margin-bottom: 1rem;
  }

  input {
    padding: 0.95rem 0.75rem;
    border-width: 3px;
    font-size: 1.25rem;
  }

  .info-badge {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.35rem 0.6rem;
    padding: 0.65rem 0.75rem;
    box-shadow: 3px 3px 0 #111827;
  }

  .info-badge .value {
    overflow-wrap: anywhere;
  }

  .manual-note {
    font-size: 0.7rem;
  }

  .grade-picker {
    margin-top: 1rem;
  }

  .grade-picker-header {
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.6rem;
  }

  .grade-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .grade-button {
    min-height: 2.7rem;
    border-width: 2px;
    font-size: 0.95rem;
    box-shadow: 3px 3px 0 #111827;
  }

  .grade-button:hover,
  .grade-button.active {
    transform: none;
    box-shadow: 3px 3px 0 #111827;
  }

  .next-button {
    padding: 1rem;
    font-size: 1.05rem;
    border-width: 3px;
    box-shadow: 5px 5px 0 #111827;
  }

  .delete-save-button {
    width: 100%;
    padding: 0.65rem;
    font-size: 0.85rem;
  }
}
</style>
