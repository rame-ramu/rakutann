<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
  <Analytics />
</template>

<style>
/* Global resets or base styles if needed */
body {
  margin: 0;
  padding: 0;
  background-color: var(--color-background);
}
</style>
