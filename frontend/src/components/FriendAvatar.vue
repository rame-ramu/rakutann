<template>
  <img
    v-if="profile.photoURL"
    class="friend-avatar"
    :src="profile.photoURL"
    :alt="`${profile.displayName}さん`"
    referrerpolicy="no-referrer"
  />
  <span v-else class="friend-avatar friend-avatar-fallback" aria-hidden="true">
    {{ initial }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FriendProfile } from '../friends'

const props = defineProps<{ profile: Pick<FriendProfile, 'displayName' | 'photoURL'> }>()
const initial = computed(() => props.profile.displayName.trim().charAt(0).toUpperCase() || '友')
</script>

<style scoped>
.friend-avatar {
  width: 2.8rem;
  height: 2.8rem;
  flex: 0 0 auto;
  border: 3px solid #111827;
  border-radius: 50%;
  background: var(--comic-yellow);
  object-fit: cover;
}

.friend-avatar-fallback {
  display: grid;
  place-items: center;
  color: #111827;
  font-weight: 1000;
}
</style>
