<template>
  <div class="sparkles" aria-hidden="true">
    <div v-for="i in 15" :key="i" class="sparkle" :style="generateStyle(i)">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
const generateStyle = (i: number) => {
  const top = Math.random() * 100
  const left = Math.random() * 100
  const duration = 3 + Math.random() * 4
  const delay = Math.random() * 5
  const size = 10 + Math.random() * 15

  return {
    top: `${top}%`,
    left: `${left}%`,
    animationDuration: `${duration}s`,
    animationDelay: `-${delay}s`,
    width: `${size}px`,
    height: `${size}px`,
    color: i % 2 === 0 ? 'var(--theme-pink)' : 'var(--theme-jewel-light)'
  }
}
</script>

<style scoped>
.sparkles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.sparkle {
  position: absolute;
  opacity: 0;
  animation: float-sparkle linear infinite;
}

@keyframes float-sparkle {
  0% {
    transform: translateY(0) scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 0.6;
  }
  50% {
    transform: translateY(-20px) scale(1) rotate(180deg);
    opacity: 0.8;
  }
  80% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-40px) scale(0) rotate(360deg);
    opacity: 0;
  }
}
</style>
