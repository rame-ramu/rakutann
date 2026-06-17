<template>
  <div class="mascot-in-base" :class="type" @click="whisper">
    <Transition name="bubble-pop">
      <div class="whisper-bubble" v-if="showWhisper">
        {{ currentWhisper }}
      </div>
    </Transition>
    
    <div class="cushion-or-rug" v-if="type === 'moka'">☁️</div>
    <div class="cushion-or-rug" v-if="type === 'hono'">🧵</div>

    <div class="mascot-body" :class="`${type}-anim`">
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="mascot-svg">
        <defs>
          <filter id="fuzzyFur" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <g filter="url(#fuzzyFur)">
          <!-- Ears -->
          <template v-if="type === 'yuki'">
            <ellipse cx="40" cy="25" rx="8" ry="22" fill="white" />
            <ellipse cx="80" cy="25" rx="8" ry="22" fill="white" />
          </template>
          <template v-else-if="type === 'moka'">
            <circle cx="35" cy="35" r="12" fill="#EFEBE9" />
            <circle cx="85" cy="35" r="12" fill="#EFEBE9" />
          </template>
          <template v-else-if="type === 'hono'">
            <path d="M35,35 Q40,20 50,30" stroke="#F3E5F5" stroke-width="12" stroke-linecap="round" />
            <path d="M85,35 Q80,20 70,30" stroke="#F3E5F5" stroke-width="12" stroke-linecap="round" />
          </template>

          <!-- Main Body -->
          <path d="M60,105 C30,105 15,85 15,60 C15,35 35,20 60,20 C85,20 105,35 105,60 C105,85 90,105 60,105 Z" 
            :fill="type === 'moka' ? '#EFEBE9' : (type === 'hono' ? '#F3E5F5' : 'white')" />
        </g>

        <!-- Sparkling Eyes -->
        <g class="eyes" :class="`blink-${type}`">
          <circle cx="42" cy="58" r="4" fill="var(--theme-text)" />
          <circle cx="78" cy="58" r="4" fill="var(--theme-text)" />
          <circle cx="43" cy="56" r="1.5" fill="white" />
          <circle cx="79" cy="56" r="1.5" fill="white" />
        </g>
        
        <circle cx="60" cy="65" r="2" fill="var(--theme-text)" opacity="0.3" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  type: 'moka' | 'yuki' | 'hono'
}>()

const showWhisper = ref(false)
const currentWhisper = ref('')

const whispers = {
  moka: ['今日もよくがんばったね', 'ゆっくり休んでいいんだよ'],
  yuki: ['無理しなくていいよ', 'いっしょに進もうね'],
  hono: ['あせらなくていいよ', 'ここはあったかいよ']
}

const whisper = () => {
  const options = whispers[props.type]
  currentWhisper.value = options[Math.floor(Math.random() * options.length)]
  showWhisper.value = true
  setTimeout(() => { showWhisper.value = false }, 3000)
}
</script>

<style scoped>
.mascot-in-base {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  cursor: pointer;
}

.mascot-body {
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}

.mascot-svg { width: 100%; height: 100%; }

.cushion-or-rug {
  position: absolute;
  bottom: -5px;
  font-size: 2rem;
  z-index: -1;
  opacity: 0.8;
}

/* Reusing your breathing sway */
.moka-anim { animation: moka-sway 12s ease-in-out infinite; transform-origin: center bottom; }
.yuki-anim { animation: yuki-sway 9s ease-in-out infinite; transform-origin: center bottom; }
.hono-anim { animation: hono-sway 16s ease-in-out infinite; transform-origin: center bottom; }

@keyframes moka-sway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
@keyframes yuki-sway { 0%, 100% { transform: rotate(3deg); } 50% { transform: rotate(-3deg); } }
@keyframes hono-sway { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }

/* Reusing lid-down blink */
.eyes { transform-origin: center 62px; }
.blink-moka { animation: moka-blink 15s ease-in-out infinite; }
.blink-yuki { animation: yuki-blink 10s ease-in-out infinite; }
.blink-hono { animation: hono-blink 22s ease-in-out infinite; }

@keyframes moka-blink { 0%, 35%, 39%, 41%, 45%, 80%, 84%, 100% { transform: scaleY(1); } 37%, 43%, 82% { transform: scaleY(0); } }
@keyframes yuki-blink { 0%, 10%, 14%, 17%, 21%, 50%, 54%, 100% { transform: scaleY(1); } 12%, 19%, 52% { transform: scaleY(0); } }
@keyframes hono-blink { 0%, 60%, 68%, 100% { transform: scaleY(1); } 64% { transform: scaleY(0); } }

.whisper-bubble {
  position: absolute;
  top: -40px;
  background: white;
  padding: 0.4rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  font-weight: 800;
  box-shadow: 0 4px 15px var(--theme-shadow);
  white-space: nowrap;
  z-index: 20;
}

.bubble-pop-enter-active { animation: pop-in 0.3s; }
.bubble-pop-leave-active { animation: pop-in 0.2s reverse; }
@keyframes pop-in { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
</style>
