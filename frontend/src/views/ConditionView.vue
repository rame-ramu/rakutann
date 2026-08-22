<template>
  <BaseLayout>
    <div class="condition-view">
      <h2>どんな授業がいい？</h2>
      <p class="description">
        無理のない範囲で、あなたの希望を教えてください。<br />複数選んでも大丈夫です。
      </p>

      <div class="condition-group">
        <h3>開講学期</h3>
        <div class="semester-options" role="group" aria-label="開講学期">
          <button
            v-for="semester in semesterOptions"
            :key="semester"
            :class="{ active: store.selectedSemester === semester }"
            :aria-pressed="store.selectedSemester === semester"
            @click="store.setSelectedSemester(semester)"
            class="semester-button"
          >
            {{ semester }}
          </button>
        </div>
      </div>

      <div v-for="group in tagGroups" :key="group.title" class="condition-group">
        <h3>{{ group.title }}</h3>
        <div class="tags">
          <button
            v-for="tag in group.tags"
            :key="tag"
            :class="{ active: store.selectedConditions.includes(tag) }"
            :aria-pressed="store.selectedConditions.includes(tag)"
            @click="store.toggleCondition(tag)"
            class="tag-button"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="teacher-filter">
        <label for="avoided-teachers">受けたくない先生</label>
        <input
          id="avoided-teachers"
          :value="store.avoidedTeachersText"
          type="text"
          placeholder="例: 山田、Suzuki"
          @input="store.setAvoidedTeachers(($event.target as HTMLInputElement).value)"
        />
      </div>

      <button type="button" class="next-button" @click="$router.push('/')">
        希望条件を保存してホームへ
      </button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from '../components/BaseLayout.vue'
import { CONDITION_GROUPS } from '../constants/courseConditions'
import { store } from '../store'

const semesterOptions = ['前期', '後期'] as const

const tagGroups = CONDITION_GROUPS
</script>

<style scoped>
.condition-view {
  text-align: center;
}

.unsupported-message {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h2 {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
  color: #111827;
  font-weight: 900;
  text-shadow: 2px 2px 0 var(--comic-yellow);
}

.description {
  margin-bottom: 2.5rem;
  color: #111827;
  font-weight: 700;
  line-height: 1.6;
}

.condition-group {
  margin-bottom: 2rem;
  text-align: left;
}

.condition-group h3 {
  margin: 0 0 0.875rem;
  color: #111827;
  font-size: 1rem;
  font-weight: 900;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-start;
}

.tag-button {
  min-width: 0;
  padding: 0.7rem 1rem;
  border: 3px solid #111827;
  background: white;
  border-radius: 0.7rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 4px 4px 0 #111827;
}

.tag-button:hover {
  background-color: #fffbe6;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #111827;
}

.tag-button.active {
  background-color: var(--comic-green);
  color: white;
  border-color: #111827;
  transform: scale(1.05);
  box-shadow: 5px 5px 0 #111827;
}

.semester-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.semester-button {
  min-height: 3.75rem;
  padding: 0.85rem 1rem;
  border: 4px solid #111827;
  border-radius: 0.7rem;
  background: white;
  color: #111827;
  cursor: pointer;
  font-size: 1.15rem;
  font-weight: 900;
  box-shadow: 5px 5px 0 #111827;
  transition: all 0.2s;
}

.semester-button:hover {
  background: #fffbe6;
  transform: translate(-2px, -2px);
  box-shadow: 7px 7px 0 #111827;
}

.semester-button.active {
  background: var(--comic-yellow);
  color: #111827;
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 #111827;
}

.teacher-filter {
  margin: 2.5rem 0 3rem;
  text-align: left;
}

.teacher-filter label {
  display: block;
  margin-bottom: 0.75rem;
  color: #111827;
  font-weight: 900;
}

.teacher-filter input {
  width: 100%;
  padding: 1rem;
  border: 3px solid #111827;
  border-radius: 0.7rem;
  color: #111827;
  font-size: 1rem;
}

.teacher-filter input:focus {
  outline: none;
  border-color: var(--comic-green);
  box-shadow: 0 0 0 4px rgba(0, 166, 166, 0.2);
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

.next-button:hover {
  background-color: #008a8a;
  transform: translate(-2px, -2px);
  box-shadow: 9px 9px 0 #111827;
}

@media (max-width: 640px) {
  h2 {
    font-size: 1.45rem;
  }

  .description {
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .condition-group {
    margin-bottom: 1.5rem;
  }

  .condition-group h3 {
    margin-bottom: 0.65rem;
  }

  .tags {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .tag-button {
    min-height: 3rem;
    justify-content: flex-start;
    padding: 0.6rem 0.55rem;
    border-width: 2px;
    border-radius: 0.55rem;
    font-size: 0.78rem;
    line-height: 1.25;
    box-shadow: 3px 3px 0 #111827;
    overflow-wrap: anywhere;
  }

  .tag-button:hover,
  .tag-button.active {
    transform: none;
    box-shadow: 3px 3px 0 #111827;
  }

  .semester-options {
    gap: 0.55rem;
  }

  .semester-button {
    min-height: 3rem;
    padding: 0.7rem 0.5rem;
    border-width: 3px;
    font-size: 1rem;
    box-shadow: 4px 4px 0 #111827;
  }

  .teacher-filter {
    margin: 1.75rem 0 2rem;
  }

  .teacher-filter input {
    padding: 0.8rem;
    font-size: 0.95rem;
  }

  .next-button {
    padding: 1rem;
    border-width: 3px;
    font-size: 1.05rem;
    box-shadow: 5px 5px 0 #111827;
  }
}
</style>
