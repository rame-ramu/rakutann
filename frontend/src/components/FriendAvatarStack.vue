<template>
  <span v-if="friends.length > 0" class="friend-avatar-stack" :title="friendNames">
    <span v-for="friend in friends.slice(0, max)" :key="friend.uid" class="friend-avatar-small">
      <img
        v-if="friend.photoURL"
        :src="friend.photoURL"
        :alt="friend.displayName"
        referrerpolicy="no-referrer"
      />
      <span v-else aria-hidden="true">{{ friend.displayName.trim().charAt(0) || '友' }}</span>
    </span>
    <span v-if="friends.length > max" class="friend-avatar-more">+{{ friends.length - max }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FriendProfile } from '../friends'

const props = withDefaults(
  defineProps<{
    friends: Array<Pick<FriendProfile, 'uid' | 'displayName' | 'photoURL'>>
    max?: number
  }>(),
  { max: 3 },
)

const friendNames = computed(() => props.friends.map((friend) => friend.displayName).join('、'))
</script>

<style scoped>
.friend-avatar-stack {
  display: inline-flex;
  align-items: center;
  padding-left: 0.3rem;
}

.friend-avatar-small,
.friend-avatar-more {
  display: grid;
  width: 1.65rem;
  height: 1.65rem;
  place-items: center;
  overflow: hidden;
  margin-left: -0.3rem;
  border: 2px solid #111827;
  border-radius: 50%;
  background: var(--comic-yellow);
  color: #111827;
  font-size: 0.62rem;
  font-weight: 1000;
}

.friend-avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-avatar-more {
  background: #ffffff;
}
</style>
