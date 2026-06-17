<template>
  <BaseLayout>
    <div class="condition-view">
      <h2 class="manga-title">どんな授業がいい？</h2>
      <p class="description">無理のない範囲で、あなたの希望を教えてください。<br>複数選んでも大丈夫です。</p>

      <div class="manga-scene">
        <!-- Bubbles clustered above -->
        <div class="tags">
          <button 
            v-for="(tag, index) in availableTags" 
            :key="tag"
            :class="['manga-bubble-tag', { active: store.selectedConditions.includes(tag) }, `pos-${index}`]"
            @click="store.toggleCondition(tag)"
          >
            <span class="icon">{{ getIcon(tag) }}</span>
            {{ tag }}
            <div class="bubble-tail"></div>
          </button>
        </div>

        <!-- Character at the bottom -->
        <div class="manga-character">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10 C40 10 35 18 35 25 C35 35 45 40 50 40 C55 40 65 35 65 25 C65 18 60 10 50 10 Z" fill="currentColor" />
            <path d="M50 42 C30 42 20 55 20 75 L20 95 L80 95 L80 75 C80 55 70 42 50 42 Z" fill="currentColor" />
            <path d="M45 22 L42 18 M55 22 L58 18" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
          <div class="character-shadow"></div>
        </div>
      </div>

      <button 
        @click="$router.push('/schedule')"
        class="next-button manga-button"
      >
        次へ進むッ！
      </button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from '../components/BaseLayout.vue'
import { store } from '../store'

const availableTags = [
  'らくたん',
  '出席なし',
  'テストなし',
  'レポートのみ',
  'オンライン',
  '面白い',
  '実用的',
  '友達ができる'
]

const getIcon = (tag: string) => {
  const icons: Record<string, string> = {
    'らくたん': '✨',
    '出席なし': '🛌',
    'テストなし': '📝',
    'レポートのみ': '💻',
    'オンライン': '🏠',
    '面白い': '🍿',
    '実用的': '🛠️',
    '友達ができる': '🤝'
  }
  return icons[tag] || '🏷️'
}
</script>

<style scoped>
.condition-view {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.manga-title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-heading);
  font-weight: 900;
  text-shadow: 3px 3px 0 var(--color-manga-accent-secondary);
}

.description {
  margin-bottom: 1rem;
  color: var(--color-text);
  line-height: 1.6;
  font-weight: 700;
}

.manga-scene {
  position: relative;
  height: 550px;
  margin-bottom: 2rem;
}

.manga-character {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 150px;
  color: var(--color-heading);
  z-index: 5;
}

.character-shadow {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
}

.tags {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 400px; /* Upper cluster area */
}

.manga-bubble-tag {
  position: absolute;
  padding: 0.8rem 1.5rem;
  background: white;
  border: 4px solid var(--color-heading);
  color: var(--color-heading);
  font-size: 1.1rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 50% / 50%;
  box-shadow: 4px 4px 0 var(--color-heading);
}

/* Cluster above the character's head (which is roughly at 50% bottom center) */
.pos-0 { top: 0%; left: 0%; transform: rotate(-3deg); }
.pos-1 { top: 5%; left: 55%; transform: rotate(2deg); }
.pos-2 { top: 22%; left: 10%; transform: rotate(4deg); }
.pos-3 { top: 27%; left: 62%; transform: rotate(-2deg); }
.pos-4 { top: 48%; left: 0%; transform: rotate(-4deg); }
.pos-5 { top: 53%; left: 55%; transform: rotate(3deg); }
.pos-6 { top: 74%; left: 10%; transform: rotate(2deg); }
.pos-7 { top: 79%; left: 62%; transform: rotate(-3deg); }

/* Tails all pointing downwards towards the character */
.bubble-tail {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  bottom: -15px;
  border-color: var(--color-heading) transparent transparent transparent;
}

.manga-bubble-tag::after {
  content: '';
  position: absolute;
  bottom: -8px;
  border-style: solid;
  border-color: white transparent transparent transparent;
  z-index: 1;
}

/* Adjust tail positions based on bubble location */
/* Left side bubbles (0, 2, 4, 6) point towards center-right */
.pos-0 .bubble-tail, .pos-2 .bubble-tail, .pos-4 .bubble-tail, .pos-6 .bubble-tail { left: 70%; border-width: 15px 0 0 15px; }
.pos-0::after, .pos-2::after, .pos-4::after, .pos-6::after { left: 73%; border-width: 12px 0 0 12px; }

/* Right side bubbles (1, 3, 5, 7) point towards center-left */
.pos-1 .bubble-tail, .pos-3 .bubble-tail, .pos-5 .bubble-tail, .pos-7 .bubble-tail { left: 20%; border-width: 15px 15px 0 0; }
.pos-1::after, .pos-3::after, .pos-5::after, .pos-7::after { left: 23%; border-width: 12px 12px 0 0; }

.manga-bubble-tag:hover {
  transform: scale(1.1) !important;
  z-index: 20;
}

.manga-bubble-tag.active {
  background-color: var(--color-manga-accent-secondary);
  border-color: var(--color-heading);
  transform: scale(1.15) !important;
  z-index: 10;
  box-shadow: 8px 8px 0 var(--color-heading);
}

.manga-bubble-tag.active::after {
  border-top-color: var(--color-manga-accent-secondary);
}

.manga-button {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.5rem;
  font-weight: 900;
  background-color: var(--color-heading);
  color: white;
  border: 4px solid var(--color-manga-accent);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.1s;
  box-shadow: 6px 6px 0 var(--color-manga-accent-secondary);
  position: relative;
  z-index: 10;
}

.manga-button:hover {
  background-color: var(--color-manga-accent);
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--color-manga-accent-secondary);
}
</style>
