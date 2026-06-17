<template>
  <div class="mascots-layer">
    <!-- Moka (Bottom Left) -->
    <div class="mascot-wrapper moka-pos" @click="whisper('moka')">
      <Transition name="bubble-pop">
        <div class="speech-bubble" v-if="activeMascot === 'moka'">
          {{ currentWhisper }}
        </div>
      </Transition>
      <div class="mascot moka-anim">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="fuzzyFurMoka" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <ellipse cx="60" cy="105" rx="30" ry="8" fill="var(--theme-shadow)" opacity="0.2" />
          <g filter="url(#fuzzyFurMoka)">
            <circle cx="35" cy="35" r="12" fill="#EFEBE9" />
            <circle cx="85" cy="35" r="12" fill="#EFEBE9" />
            <path d="M60,105 C30,105 15,85 15,60 C15,35 35,20 60,20 C85,20 105,35 105,60 C105,85 90,105 60,105 Z" fill="#EFEBE9" />
          </g>
          <!-- Sparkling Eyes with Blink -->
          <g class="eyes blink-moka">
            <circle cx="42" cy="58" r="4" fill="var(--theme-text)" />
            <circle cx="78" cy="58" r="4" fill="var(--theme-text)" />
            <circle cx="43" cy="56" r="1.5" fill="white" />
            <circle cx="79" cy="56" r="1.5" fill="white" />
          </g>
          <circle cx="60" cy="65" r="2" fill="var(--theme-jewel)" />
          <circle cx="40" cy="68" r="7" fill="#D7CCC8" opacity="0.4" />
          <circle cx="80" cy="68" r="7" fill="#D7CCC8" opacity="0.4" />
        </svg>
      </div>
    </div>

    <!-- Yuki (Top Right) -->
    <div class="mascot-wrapper yuki-pos" @click="whisper('yuki')">
      <Transition name="bubble-pop">
        <div class="speech-bubble bubble-left" v-if="activeMascot === 'yuki'">
          {{ currentWhisper }}
        </div>
      </Transition>
      <div class="mascot yuki-anim">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="fuzzyFurYuki" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <ellipse cx="60" cy="105" rx="30" ry="8" fill="var(--theme-shadow)" opacity="0.2" />
          <g filter="url(#fuzzyFurYuki)">
            <ellipse cx="40" cy="25" rx="8" ry="22" fill="#FFFFFF" />
            <ellipse cx="80" cy="25" rx="8" ry="22" fill="#FFFFFF" />
            <path d="M60,105 C30,105 15,85 15,60 C15,35 35,20 60,20 C85,20 105,35 105,60 C105,85 90,105 60,105 Z" fill="#FFFFFF" />
          </g>
          <g class="eyes blink-yuki">
            <circle cx="42" cy="58" r="4" fill="var(--theme-text)" />
            <circle cx="78" cy="58" r="4" fill="var(--theme-text)" />
            <circle cx="43" cy="56" r="1.5" fill="white" />
            <circle cx="79" cy="56" r="1.5" fill="white" />
          </g>
          <circle cx="60" cy="65" r="2" fill="var(--theme-jewel)" />
          <circle cx="40" cy="68" r="7" fill="#FCE4EC" opacity="0.4" />
          <circle cx="80" cy="68" r="7" fill="#FCE4EC" opacity="0.4" />
        </svg>
      </div>
    </div>

    <!-- Hono (Bottom Right) -->
    <div class="mascot-wrapper hono-pos" @click="whisper('hono')">
      <Transition name="bubble-pop">
        <div class="speech-bubble" v-if="activeMascot === 'hono'">
          {{ currentWhisper }}
        </div>
      </Transition>
      <div class="mascot hono-anim">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="fuzzyFurHono" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <ellipse cx="60" cy="105" rx="30" ry="8" fill="var(--theme-shadow)" opacity="0.2" />
          <g filter="url(#fuzzyFurHono)">
            <path d="M35,35 Q40,20 50,30" stroke="#F3E5F5" stroke-width="12" stroke-linecap="round" />
            <path d="M85,35 Q80,20 70,30" stroke="#F3E5F5" stroke-width="12" stroke-linecap="round" />
            <path d="M60,105 C30,105 15,85 15,60 C15,35 35,20 60,20 C85,20 105,35 105,60 C105,85 90,105 60,105 Z" fill="#F3E5F5" />
          </g>
          <g class="eyes blink-hono">
            <circle cx="42" cy="58" r="4" fill="var(--theme-text)" />
            <circle cx="78" cy="58" r="4" fill="var(--theme-text)" />
            <circle cx="43" cy="56" r="1.5" fill="white" />
            <circle cx="79" cy="56" r="1.5" fill="white" />
          </g>
          <circle cx="60" cy="65" r="2" fill="var(--theme-jewel)" />
          <circle cx="40" cy="68" r="7" fill="#E1BEE7" opacity="0.4" />
          <circle cx="80" cy="68" r="7" fill="#E1BEE7" opacity="0.4" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeMascot = ref<string | null>(null)
const currentWhisper = ref('')
const whisperTimout = ref<number | null>(null)

const whispers: Record<string, string[]> = {
  moka: ['今日もよくがんばったね', 'ゆっくり休んでいいんだよ', 'だいじょうぶだよ、ここにいるよ'],
  yuki: ['無理しなくていいよ', 'いっしょに進もうね', 'あなたのペースでいいんだよ'],
  hono: ['あせらなくていいよ', 'ここはあったかいよ、安心してね', '深呼吸してみよっか']
}

const whisper = (id: string) => {
  if (whisperTimout.value) clearTimeout(whisperTimout.value)
  
  const options = whispers[id]
  currentWhisper.value = options[Math.floor(Math.random() * options.length)]
  activeMascot.value = id

  whisperTimout.value = window.setTimeout(() => {
    activeMascot.value = null
  }, 4000)
}
</script>

<style scoped>
.mascots-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.mascot-wrapper {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
  cursor: pointer;
}

.mascot {
  width: 100px;
  height: 100px;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.mascot:hover {
  transform: scale(1.1);
}

/* Positions */
.moka-pos { bottom: 30px; left: 20px; }
.yuki-pos { top: 120px; right: 20px; }
.hono-pos { bottom: 30px; right: 20px; }

/* Animations - Perfectly fixed "ゆらゆら" swaying (Smooth Rotation Only) */
.moka-anim { animation: moka-sway 14s ease-in-out infinite; transform-origin: center center; }
.yuki-anim { animation: yuki-sway 10s ease-in-out infinite; transform-origin: center center; }
.hono-anim { animation: hono-sway 20s ease-in-out infinite; transform-origin: center center; }

@keyframes moka-sway {
  0%, 100% { transform: rotate(-2.5deg); }
  50% { transform: rotate(2.5deg); }
}

@keyframes yuki-sway {
  0%, 100% { transform: rotate(3deg); }
  50% { transform: rotate(-3deg); }
}

@keyframes hono-sway {
  0%, 100% { transform: rotate(-1.5deg); }
  50% { transform: rotate(1.5deg); }
}

/* Blinking Rhythms - Very slow, gentle "ぱち…ぱち…" (Top lid downward) */
.eyes {
  transform-origin: center 62px; /* Bottom of eyes to keep them fixed at base */
}

.blink-moka { animation: moka-blink 20s ease-in-out infinite; }
.blink-yuki { animation: yuki-blink 14s ease-in-out infinite; }
.blink-hono { animation: hono-blink 30s ease-in-out infinite; }

/* Moka: Deep, steady, unpredictable */
@keyframes moka-blink {
  0%, 40%, 48%, 52%, 60%, 85%, 93%, 100% { transform: scaleY(1); opacity: 1; }
  44%, 50%, 56%, 89% { transform: scaleY(0); opacity: 0.8; }
}

/* Yuki: Light, cheerful, spontaneous */
@keyframes yuki-blink {
  0%, 15%, 23%, 26%, 34%, 65%, 73%, 100% { transform: scaleY(1); opacity: 1; }
  19%, 30%, 69% { transform: scaleY(0); opacity: 0.8; }
}

/* Hono: Lazy, dreamy, slow */
@keyframes hono-blink {
  0%, 70%, 82%, 100% { transform: scaleY(1); opacity: 1; }
  76% { transform: scaleY(0); opacity: 0.7; }
}

/* Speech Bubbles */
.speech-bubble {
  background: white;
  padding: 0.8rem 1rem;
  border-radius: 1.5rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--theme-text);
  box-shadow: 0 8px 20px var(--theme-shadow);
  margin-bottom: 10px;
  max-width: 180px;
  border: 3px solid var(--theme-lavender);
  text-align: center;
  line-height: 1.4;
}

.bubble-left {
  margin-right: 0;
  margin-left: 0;
}

/* Transitions */
.bubble-pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: pop-in 0.3s reverse ease-in; }

@keyframes pop-in {
  0% { transform: scale(0) translateY(10px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
</style>
