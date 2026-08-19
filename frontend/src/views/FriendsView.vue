<template>
  <BaseLayout>
    <div class="friends-view">
      <div class="friends-heading">
        <div>
          <span class="eyebrow">FRIENDS</span>
          <h1>友達</h1>
          <p>友達の時間割を見たり、同じ授業を見つけたりできます。</p>
        </div>
        <button class="back-home-button" type="button" @click="router.push('/')">
          ホームへ戻る
        </button>
      </div>

      <p v-if="friendFeatureError" class="status-message error" role="alert">
        {{ friendFeatureError }}
      </p>
      <p v-if="friendActionMessage" class="status-message success" role="status">
        {{ friendActionMessage }}
      </p>

      <div v-if="isFriendFeatureLoading" class="loading-card">友達情報を読み込んでいます…</div>

      <template v-else>
        <section class="friend-code-card">
          <div>
            <h2>あなたの友達コード</h2>
            <p>このコードを友達に伝えてください。</p>
          </div>
          <div class="friend-code-row">
            <strong v-if="myFriendProfile">{{ formattedFriendCode }}</strong>
            <strong v-else class="friend-code-unavailable">未作成</strong>
            <button v-if="myFriendProfile" type="button" @click="copyFriendCode">
              {{ isCodeCopied ? 'コピー済み' : 'コピー' }}
            </button>
            <button v-else type="button" @click="createFriendCode">コードを作成</button>
          </div>
        </section>

        <section class="panel add-friend-panel">
          <div class="panel-heading">
            <div>
              <h2>友達を追加</h2>
              <p>相手の英数字8文字のコードを入力します。</p>
            </div>
          </div>
          <form class="friend-code-form" @submit.prevent="submitFriendRequest">
            <input
              v-model="friendCodeInput"
              type="text"
              inputmode="text"
              maxlength="8"
              autocomplete="off"
              placeholder="例: AB3D5FG7"
              aria-label="友達コード"
              @input="normalizeFriendCodeInput"
            />
            <button type="submit" :disabled="isSendingRequest || friendCodeInput.length !== 8">
              {{ isSendingRequest ? '送信中…' : '友達申請を送る' }}
            </button>
          </form>
          <p class="privacy-note">コードを入力しただけでは追加されません。相手の承認が必要です。</p>
        </section>

        <section class="panel request-panel">
          <div class="panel-heading">
            <div>
              <h2>届いた友達申請</h2>
              <p>知っている相手か確認してから承認してください。</p>
            </div>
            <span class="count-badge">{{ incomingFriendRequests.length }}</span>
          </div>

          <div v-if="incomingFriendRequests.length > 0" class="request-list">
            <article
              v-for="request in incomingFriendRequests"
              :key="request.senderUid"
              class="request-item"
            >
              <FriendAvatar :profile="request.profile" />
              <div class="request-copy">
                <strong>{{ request.profile.displayName }}</strong>
                <span>友達になりたいと申請しています</span>
              </div>
              <div class="request-actions">
                <button
                  class="approve-button"
                  type="button"
                  :disabled="busyUserIds.has(request.senderUid)"
                  @click="approveRequest(request.senderUid)"
                >
                  承認
                </button>
                <button
                  class="decline-button"
                  type="button"
                  :disabled="busyUserIds.has(request.senderUid)"
                  @click="declineRequest(request.senderUid)"
                >
                  削除
                </button>
              </div>
            </article>
          </div>
          <p v-else class="empty-message">現在、友達申請はありません。</p>
        </section>

        <section class="panel friend-list-panel">
          <div class="panel-heading">
            <div>
              <h2>友達一覧</h2>
              <p>登録した授業だけが友達に表示されます。</p>
            </div>
            <span class="count-badge">{{ friends.length }}</span>
          </div>

          <div v-if="friends.length > 0" class="friend-list">
            <article v-for="friend in friends" :key="friend.uid" class="friend-card">
              <div class="friend-card-profile">
                <FriendAvatar :profile="friend" />
                <div>
                  <strong>{{ friend.displayName }}</strong>
                  <span>登録授業 {{ friend.courses.length }}件</span>
                </div>
              </div>
              <div class="friend-card-actions">
                <button class="schedule-button" type="button" @click="selectFriend(friend)">
                  時間割を見る
                </button>
                <button
                  class="remove-friend-button"
                  type="button"
                  :disabled="busyUserIds.has(friend.uid)"
                  @click="confirmRemoveFriend(friend)"
                >
                  友達から削除
                </button>
              </div>
            </article>
          </div>
          <p v-else class="empty-message">友達を追加すると、ここに表示されます。</p>
        </section>
      </template>

      <Transition name="modal">
        <div v-if="selectedFriend" class="modal-overlay" @click="selectedFriendUid = null">
          <div class="friend-schedule-modal" @click.stop>
            <button class="modal-close" type="button" @click="selectedFriendUid = null">×</button>
            <div class="modal-profile">
              <FriendAvatar :profile="selectedFriend" />
              <div>
                <span>友達の時間割</span>
                <h2>{{ selectedFriend.displayName }}</h2>
              </div>
            </div>

            <div class="friend-schedule-table-wrap">
              <table class="friend-schedule-table">
                <thead>
                  <tr>
                    <th></th>
                    <th v-for="day in days" :key="day">{{ day }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="period in periods" :key="period">
                    <th>{{ period }}限</th>
                    <td v-for="day in days" :key="day">
                      <span
                        v-for="course in getFriendCoursesInSlot(selectedFriend, day, period)"
                        :key="course.id"
                      >
                        {{ displayCourseName(course.name) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="selectedFriend.courses.length === 0" class="empty-message">
              登録済みの授業はありません。
            </p>
          </div>
        </div>
      </Transition>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser } from '../auth'
import BaseLayout from '../components/BaseLayout.vue'
import FriendAvatar from '../components/FriendAvatar.vue'
import {
  approveFriendRequest,
  declineFriendRequest,
  friendActionMessage,
  friendFeatureError,
  friends,
  incomingFriendRequests,
  initializeFriendFeatures,
  isFriendFeatureLoading,
  myFriendProfile,
  removeFriend,
  sendFriendRequest,
  type FriendSummary,
  type SharedScheduleCourse,
} from '../friends'

const router = useRouter()
const friendCodeInput = ref('')
const isSendingRequest = ref(false)
const isCodeCopied = ref(false)
const busyUserIds = ref(new Set<string>())
const selectedFriendUid = ref<string | null>(null)
const selectedFriend = computed(
  () => friends.value.find((friend) => friend.uid === selectedFriendUid.value) || null,
)
const days = ['月', '火', '水', '木', '金']
const periods = [1, 2, 3, 4, 5]

const formattedFriendCode = computed(() => {
  const code = myFriendProfile.value?.friendCode || '--------'
  return `${code.slice(0, 4)} ${code.slice(4)}`
})

const createFriendCode = async () => {
  if (!currentUser.value || isFriendFeatureLoading.value) return
  await initializeFriendFeatures(currentUser.value)
}

onMounted(() => {
  if (!myFriendProfile.value) void createFriendCode()
})

const normalizeFriendCodeInput = () => {
  friendCodeInput.value = friendCodeInput.value.toUpperCase().replace(/[^A-Z2-9]/g, '')
}

const copyFriendCode = async () => {
  const code = myFriendProfile.value?.friendCode
  if (!code) return

  try {
    await navigator.clipboard.writeText(code)
    isCodeCopied.value = true
    window.setTimeout(() => {
      isCodeCopied.value = false
    }, 1800)
  } catch {
    friendFeatureError.value = 'コピーできませんでした。コードを長押ししてコピーしてください。'
  }
}

const submitFriendRequest = async () => {
  isSendingRequest.value = true
  try {
    if (await sendFriendRequest(friendCodeInput.value)) friendCodeInput.value = ''
  } finally {
    isSendingRequest.value = false
  }
}

const runForUser = async (uid: string, action: () => Promise<unknown>) => {
  busyUserIds.value = new Set(busyUserIds.value).add(uid)
  try {
    await action()
  } finally {
    const next = new Set(busyUserIds.value)
    next.delete(uid)
    busyUserIds.value = next
  }
}

const approveRequest = (senderUid: string) => {
  return runForUser(senderUid, () => approveFriendRequest(senderUid))
}

const declineRequest = (senderUid: string) => {
  return runForUser(senderUid, () => declineFriendRequest(senderUid))
}

const confirmRemoveFriend = (friend: FriendSummary) => {
  if (!window.confirm(`${friend.displayName}さんを友達から削除しますか？`)) return
  void runForUser(friend.uid, async () => {
    if (await removeFriend(friend.uid)) selectedFriendUid.value = null
  })
}

const selectFriend = (friend: FriendSummary) => {
  selectedFriendUid.value = friend.uid
}

const getFriendCoursesInSlot = (friend: FriendSummary, day: string, period: number) => {
  return friend.courses.filter((course) => course.day === day && course.period === period)
}

const displayCourseName = (name: SharedScheduleCourse['name']) => name.split('／')[0] || name
</script>

<style scoped>
.friends-view {
  padding-bottom: 5rem;
  color: #111827;
}

.friends-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.friends-heading h1 {
  margin: 0.1rem 0 0.35rem;
  font-size: clamp(2rem, 7vw, 3.4rem);
  font-weight: 1000;
  text-shadow: 3px 3px 0 var(--comic-yellow);
}

.friends-heading p,
.panel-heading p,
.friend-code-card p {
  margin: 0;
  color: #4b5563;
  font-size: 0.9rem;
  font-weight: 700;
}

.eyebrow {
  color: var(--comic-green);
  font-size: 0.75rem;
  font-weight: 1000;
  letter-spacing: 0.16em;
}

.back-home-button,
.friend-code-row button,
.friend-code-form button,
.request-actions button,
.friend-card-actions button {
  border: 3px solid #111827;
  border-radius: 0.55rem;
  box-shadow: 3px 3px 0 #111827;
  cursor: pointer;
  font-weight: 900;
}

.back-home-button {
  flex: 0 0 auto;
  padding: 0.55rem 0.8rem;
  background: white;
}

.panel,
.friend-code-card,
.loading-card {
  margin-bottom: 1.25rem;
  padding: 1.25rem;
  border: 4px solid #111827;
  border-radius: 0.75rem;
  background: white;
  box-shadow: 6px 6px 0 #111827;
}

.friend-code-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--comic-yellow);
}

.friend-code-card h2,
.panel h2 {
  margin: 0 0 0.25rem;
  font-size: 1.2rem;
  font-weight: 1000;
}

.friend-code-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.friend-code-row strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(1.2rem, 5vw, 1.7rem);
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.friend-code-row .friend-code-unavailable {
  font-family: inherit;
  font-size: 1rem;
  letter-spacing: 0;
}

.friend-code-row button {
  padding: 0.5rem 0.7rem;
  background: white;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.count-badge {
  display: grid;
  min-width: 2rem;
  height: 2rem;
  place-items: center;
  border: 2px solid #111827;
  border-radius: 999px;
  background: var(--comic-yellow);
  font-weight: 1000;
}

.friend-code-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.friend-code-form input {
  min-width: 0;
  padding: 0.8rem 0.9rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  background: #fffdf4;
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.friend-code-form button {
  padding: 0.75rem 1rem;
  background: var(--comic-green);
  color: white;
}

button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.privacy-note {
  margin: 0.75rem 0 0;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 700;
}

.request-list,
.friend-list {
  display: grid;
  gap: 0.75rem;
}

.request-item,
.friend-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem;
  border: 2px solid #111827;
  border-radius: 0.6rem;
  background: #fffdf4;
}

.request-copy,
.friend-card-profile > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.request-copy strong,
.friend-card-profile strong {
  font-weight: 1000;
}

.request-copy span,
.friend-card-profile span {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 700;
}

.request-actions,
.friend-card-actions {
  display: flex;
  gap: 0.55rem;
}

.request-actions button,
.friend-card-actions button {
  padding: 0.5rem 0.7rem;
}

.approve-button,
.schedule-button {
  background: var(--comic-green);
  color: white;
}

.decline-button,
.remove-friend-button {
  background: white;
  color: #991b1b;
}

.friend-card {
  justify-content: space-between;
}

.friend-card-profile {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.status-message {
  margin: 0 0 1rem;
  padding: 0.75rem 0.9rem;
  border: 3px solid #111827;
  border-radius: 0.55rem;
  font-size: 0.85rem;
  font-weight: 900;
}

.status-message.error {
  background: #fee2e2;
  color: #991b1b;
}

.status-message.success {
  background: #d1fae5;
  color: #065f46;
}

.empty-message,
.loading-card {
  color: #4b5563;
  font-weight: 800;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(17, 24, 39, 0.72);
}

.friend-schedule-modal {
  position: relative;
  width: min(58rem, 100%);
  max-height: 90vh;
  overflow: auto;
  padding: 1.5rem;
  border: 4px solid #111827;
  border-radius: 0.8rem;
  background: #fffdf4;
  box-shadow: 8px 8px 0 #111827;
}

.modal-close {
  position: absolute;
  top: 0.65rem;
  right: 0.75rem;
  border: 0;
  background: transparent;
  color: #111827;
  cursor: pointer;
  font-size: 2rem;
  font-weight: 1000;
}

.modal-profile {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.modal-profile span {
  color: var(--comic-green);
  font-size: 0.75rem;
  font-weight: 900;
}

.modal-profile h2 {
  margin: 0;
}

.friend-schedule-table-wrap {
  overflow-x: auto;
}

.friend-schedule-table {
  width: 100%;
  min-width: 42rem;
  border-collapse: separate;
  border-spacing: 0.35rem;
  table-layout: fixed;
}

.friend-schedule-table th,
.friend-schedule-table td {
  padding: 0.55rem;
  border: 2px solid #111827;
  border-radius: 0.4rem;
  background: white;
  font-size: 0.75rem;
  text-align: center;
  vertical-align: top;
}

.friend-schedule-table th {
  background: var(--comic-yellow);
  font-weight: 1000;
}

.friend-schedule-table td span {
  display: block;
  padding: 0.3rem;
  border-radius: 0.3rem;
  background: #ccfbf1;
  font-weight: 800;
}

.friend-schedule-table td span + span {
  margin-top: 0.3rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 700px) {
  .friends-heading,
  .friend-code-card,
  .request-item,
  .friend-card {
    align-items: stretch;
    flex-direction: column;
  }

  .back-home-button {
    align-self: flex-start;
  }

  .friend-code-row,
  .friend-card-actions,
  .request-actions {
    justify-content: space-between;
  }

  .friend-code-form {
    grid-template-columns: 1fr;
  }

  .friend-code-form button {
    min-height: 3rem;
  }
}
</style>
