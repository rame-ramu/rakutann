<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <main class="app-container">
    <RouterView />
  </main>
</template>

<style>
/* アプリ全体の基本設定 */
:root {
  --primary-color: #a8d672;
  --bg-color: #f7fcf0;
  --text-color: #333;
}

body {
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.app-container {
  width: 100%;
  max-width: 1000px;
  padding: 20px;
}
</style>
