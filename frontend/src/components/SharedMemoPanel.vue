<template>
  <section class="shared-memo-panel">
    <div class="shared-memo-heading">
      <div>
        <h4>友達との共有メモ</h4>
        <p>個人メモとは別に、選んだ友達全員で編集できます。</p>
      </div>
      <span class="shared-label">共有</span>
    </div>

    <p v-if="courseFriends.length === 0" class="shared-empty">
      この授業を登録している友達はいません。
    </p>

    <template v-else>
      <div v-if="courseGroups.length > 0" class="memo-group-tabs">
        <button
          v-for="group in courseGroups"
          :key="group.id"
          type="button"
          :class="{ active: selectedGroupId === group.id }"
          @click="selectedGroupId = group.id"
        >
          {{ getGroupLabel(group) }}
        </button>
      </div>

      <div v-if="currentGroup" class="shared-editor">
        <div class="shared-members">
          <FriendAvatarStack :friends="getGroupProfiles(currentGroup)" :max="4" />
          <span>このメンバー全員が編集できます</span>
        </div>
        <textarea
          :value="currentGroup.memo"
          rows="5"
          maxlength="2000"
          placeholder="試験範囲や持ち物などを共有できます"
          @input="updateMemo"
        />
        <small>{{ currentGroup.memo.length }} / 2000</small>
      </div>

      <details class="create-memo-group" :open="courseGroups.length === 0">
        <summary>新しい共有メモを作る</summary>
        <p>自分を含めて4人まで。選んだ全員がお互いに友達の場合だけ作成できます。</p>
        <div class="friend-options">
          <label v-for="friend in courseFriends" :key="friend.uid">
            <input
              v-model="selectedFriendIds"
              type="checkbox"
              :value="friend.uid"
              :disabled="!selectedFriendIds.includes(friend.uid) && selectedFriendIds.length >= 3"
            />
            <FriendAvatar :profile="friend" />
            <span>{{ friend.displayName }}</span>
          </label>
        </div>
        <button
          class="create-group-button"
          type="button"
          :disabled="isCreating || selectedFriendIds.length === 0"
          @click="createGroup"
        >
          {{ isCreating ? '確認中…' : 'このメンバーで共有する' }}
        </button>
      </details>

      <p v-if="friendFeatureError" class="shared-message error" role="alert">
        {{ friendFeatureError }}
      </p>
      <p v-else-if="friendActionMessage" class="shared-message" role="status">
        {{ friendActionMessage }}
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  createSharedMemoGroup,
  friendActionMessage,
  friendFeatureError,
  getFriendProfile,
  getFriendsForCourse,
  myFriendProfile,
  saveSharedMemo,
  sharedMemoGroups,
  type FriendProfile,
  type SharedMemoGroup,
} from '../friends'
import type { Course } from '../store'
import { getCurrentAcademicYear } from '../utils/academicYear'
import FriendAvatar from './FriendAvatar.vue'
import FriendAvatarStack from './FriendAvatarStack.vue'

const props = defineProps<{ course: Course }>()
const selectedFriendIds = ref<string[]>([])
const selectedGroupId = ref('')
const isCreating = ref(false)

const courseFriends = computed(() => getFriendsForCourse(props.course.id))
const courseGroups = computed(() =>
  sharedMemoGroups.value.filter(
    (group) =>
      group.academicYear === getCurrentAcademicYear() && group.courseId === props.course.id,
  ),
)
const currentGroup = computed(
  () => courseGroups.value.find((group) => group.id === selectedGroupId.value) || null,
)

watch(
  () => props.course.id,
  () => {
    selectedFriendIds.value = []
    selectedGroupId.value = courseGroups.value[0]?.id || ''
  },
  { immediate: true },
)

watch(
  courseGroups,
  (groups) => {
    if (!groups.some((group) => group.id === selectedGroupId.value)) {
      selectedGroupId.value = groups[0]?.id || ''
    }
  },
  { immediate: true },
)

const getGroupProfiles = (group: SharedMemoGroup) => {
  return group.memberIds
    .map(getFriendProfile)
    .filter((profile): profile is FriendProfile => profile !== null)
}

const getGroupLabel = (group: SharedMemoGroup) => {
  const names = getGroupProfiles(group)
    .filter((profile) => profile.uid !== myFriendProfile.value?.uid)
    .map((profile) => profile.displayName)
  return names.length > 0 ? names.join('・') : '共有メモ'
}

const createGroup = async () => {
  isCreating.value = true
  try {
    const groupId = await createSharedMemoGroup(props.course, selectedFriendIds.value)
    if (groupId) {
      selectedGroupId.value = groupId
      selectedFriendIds.value = []
    }
  } finally {
    isCreating.value = false
  }
}

const updateMemo = (event: Event) => {
  if (!currentGroup.value) return
  saveSharedMemo(currentGroup.value.id, (event.target as HTMLTextAreaElement).value)
}
</script>

<style scoped>
.shared-memo-panel {
  margin-top: 1rem;
  padding: 1rem;
  border: 3px solid #111827;
  border-radius: 0.65rem;
  background: #ecfeff;
}

.shared-memo-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.shared-memo-heading h4 {
  margin: 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 1000;
}

.shared-memo-heading p,
.create-memo-group p {
  margin: 0.25rem 0 0;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.5;
}

.shared-label {
  padding: 0.25rem 0.5rem;
  border: 2px solid #111827;
  border-radius: 999px;
  background: var(--comic-yellow);
  color: #111827;
  font-size: 0.7rem;
  font-weight: 1000;
}

.shared-empty {
  margin: 0.8rem 0 0;
  color: #4b5563;
  font-size: 0.78rem;
  font-weight: 800;
}

.memo-group-tabs {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  margin-top: 0.85rem;
  padding-bottom: 0.25rem;
}

.memo-group-tabs button,
.create-group-button {
  flex: 0 0 auto;
  padding: 0.45rem 0.65rem;
  border: 2px solid #111827;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 2px 2px 0 #111827;
  color: #111827;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 900;
}

.memo-group-tabs button.active,
.create-group-button {
  background: var(--comic-green);
  color: white;
}

.shared-editor {
  margin-top: 0.75rem;
}

.shared-members {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.5rem;
  color: #4b5563;
  font-size: 0.68rem;
  font-weight: 800;
}

.shared-editor textarea {
  width: 100%;
  resize: vertical;
  padding: 0.7rem;
  border: 3px solid #111827;
  border-radius: 0.5rem;
  background: white;
  color: #111827;
  font: inherit;
  font-size: 0.85rem;
}

.shared-editor small {
  display: block;
  margin-top: 0.2rem;
  color: #6b7280;
  font-size: 0.65rem;
  text-align: right;
}

.create-memo-group {
  margin-top: 0.85rem;
  padding-top: 0.75rem;
  border-top: 2px dashed #111827;
}

.create-memo-group summary {
  cursor: pointer;
  color: #111827;
  font-size: 0.8rem;
  font-weight: 1000;
}

.friend-options {
  display: grid;
  gap: 0.45rem;
  margin: 0.65rem 0;
}

.friend-options label {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem;
  border: 2px solid #111827;
  border-radius: 0.5rem;
  background: white;
  color: #111827;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
}

.friend-options input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--comic-green);
}

.friend-options :deep(.friend-avatar) {
  width: 2rem;
  height: 2rem;
  border-width: 2px;
}

.create-group-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.shared-message {
  margin: 0.75rem 0 0;
  padding: 0.5rem;
  border: 2px solid #111827;
  border-radius: 0.45rem;
  background: #d1fae5;
  color: #065f46;
  font-size: 0.7rem;
  font-weight: 900;
}

.shared-message.error {
  background: #fee2e2;
  color: #991b1b;
}
</style>
