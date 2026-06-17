<template>
  <div class="home-view">
    <Sparkles />
    
    <header class="home-header">
      <h1 class="title">楽単日和</h1>
      <p class="subtitle">今日はゆっくりでいいよ</p>
    </header>

    <div class="secret-base">
      <!-- Blanket Tent -->
      <div class="tent-container">
        <svg viewBox="0 0 300 240" fill="none" xmlns="http://www.w3.org/2000/svg" class="tent-svg">
          <!-- Soft Ground Shadow -->
          <ellipse cx="150" cy="210" rx="120" ry="20" fill="var(--theme-shadow)" opacity="0.4" />
          
          <!-- Tent Structure (Blanket) -->
          <path d="M30,210 C30,120 80,40 150,40 C220,40 270,120 270,210" stroke="var(--theme-text)" stroke-width="2" stroke-dasharray="8 4" />
          <path d="M30,210 C30,120 80,40 150,40 C220,40 270,120 270,210 L30,210Z" fill="var(--theme-blanket)" />
          
          <!-- Inner Shadow -->
          <path d="M60,210 C60,140 100,80 150,80 C200,80 240,140 240,210 L60,210Z" fill="var(--theme-bg)" opacity="0.3" />
          
          <!-- Lamp Light Glow -->
          <radialGradient id="lampGlow" cx="150" cy="180" r="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="var(--theme-lamp)" stop-opacity="0.6" />
            <stop offset="100%" stop-color="var(--theme-lamp)" stop-opacity="0" />
          </radialGradient>
          <circle cx="150" cy="180" r="80" fill="url(#lampGlow)" />
        </svg>

        <!-- Friends inside the tent (Mascot component logic reused here) -->
        <div class="friends-inside">
          <MascotInBase type="moka" />
          <MascotInBase type="yuki" />
          <MascotInBase type="hono" />
        </div>
      </div>
      
      <p class="welcome-msg">今日は楽単日和だよ。<br>ひみつ基地でひと休みしよ。</p>
    </div>

    <!-- Bottom Menu Items -->
    <nav class="base-menu">
      <div class="menu-item" @click="navigateTo('/schedule')">
        <div class="item-icon lamp-icon">🏮</div>
        <span class="item-label">今日の予定</span>
      </div>
      <div class="menu-item" @click="navigateTo('/schedule')">
        <div class="item-icon book-icon">📖</div>
        <span class="item-label">時間割</span>
      </div>
      <div class="menu-item">
        <div class="item-icon sticky-icon">🔖</div>
        <span class="item-label">課題</span>
      </div>
      <div class="menu-item">
        <div class="item-icon cushion-icon">☁️</div>
        <span class="item-label">メモ</span>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Sparkles from '../components/Sparkles.vue'
import MascotInBase from '../components/MascotInBase.vue'

const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.home-view {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1.5rem;
  background-color: var(--theme-bg);
  position: relative;
  overflow: hidden;
}

.home-header {
  text-align: center;
  margin-bottom: 2rem;
  z-index: 10;
}

.title {
  font-size: 3rem;
  font-weight: 800;
  color: var(--theme-text);
  margin-bottom: 0.5rem;
  font-family: 'M PLUS Rounded 1c', sans-serif;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.7;
  font-weight: 500;
}

.secret-base {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.tent-container {
  position: relative;
  width: 320px;
  height: 260px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tent-svg {
  width: 100%;
  height: 100%;
}

.friends-inside {
  position: absolute;
  bottom: 40px;
  width: 200px;
  height: 100px;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
}

.welcome-msg {
  text-align: center;
  margin-top: 1.5rem;
  line-height: 1.8;
  font-weight: 700;
  color: var(--theme-text);
  opacity: 0.8;
}

.base-menu {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-radius: 2.5rem;
  box-shadow: 0 10px 30px var(--theme-shadow);
  z-index: 10;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.menu-item:hover {
  transform: translateY(-5px);
}

.item-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  background: var(--theme-blanket);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1.2rem;
  transition: all 0.3s;
  box-shadow: 0 4px 0 var(--theme-shadow);
}

.item-label {
  font-size: 0.75rem;
  font-weight: 800;
  opacity: 0.6;
}

/* Animations for icons */
.menu-item:active .lamp-icon { filter: brightness(1.5); }
.menu-item:active .book-icon { transform: rotate(-10deg); }
.menu-item:active .sticky-icon { transform: skewX(-5deg); }
.menu-item:active .cushion-icon { transform: scale(0.9); }
</style>
