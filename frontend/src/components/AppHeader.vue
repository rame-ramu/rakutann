<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  authError,
  currentUser,
  exitGuestMode,
  isGuestMode,
  isSigningOut,
  signOutOfApp,
} from '../auth'
import { pendingFriendRequestCount } from '../friends'
import { installApp, isAppInstalled, isInstallPromptReady, isIosDevice } from '../pwa'
import { store } from '../store'
import { isValidStudentProfile } from '../services/studentProfile'
import {
  clearPersistedState,
  cloudSyncError,
  cloudSyncStatus,
  resumePersistence,
} from '../utils/persistence'

const feedbackFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSfjjDLxLteu9_DYHbqYuKHXf0FMBxik4trAWbOpA_a1xWXZSQ/viewform'

const route = useRoute()
const router = useRouter()
const menuRoot = ref<HTMLElement | null>(null)
const isMenuOpen = ref(false)
const isInstallHelpOpen = ref(false)

const accountName = computed(
  () =>
    currentUser.value?.displayName ||
    currentUser.value?.email ||
    (isGuestMode.value ? 'ゲスト利用中' : 'Googleユーザー'),
)
const accountInitial = computed(() =>
  isGuestMode.value ? '端' : accountName.value.trim().charAt(0).toUpperCase() || 'G',
)
const isStudentIdRegistered = computed(() =>
  Boolean(store.studentProfile && isValidStudentProfile(store.studentProfile) && store.grade),
)
const showHomeLink = computed(
  () => route.name !== 'home' && (route.name !== 'student-id' || isStudentIdRegistered.value),
)
const showResultsBackLink = computed(
  () => route.name === 'conditions' && route.query.from === 'results',
)
const cloudSyncLabel = computed(() => {
  if (isGuestMode.value) return 'この端末だけに保存'

  switch (cloudSyncStatus.value) {
    case 'syncing':
      return 'データを読み込み中…'
    case 'saving':
      return 'クラウドへ保存中…'
    case 'synced':
      return 'クラウド保存済み'
    case 'offline':
      return '端末内に保存（同期できません）'
    default:
      return '端末内に保存'
  }
})
const installButtonLabel = computed(() =>
  isInstallPromptReady.value ? 'アプリをインストール' : 'アプリとして使う',
)
const installInstructions = computed(() =>
  isIosDevice.value
    ? 'Safariの共有ボタンから「ホーム画面に追加」→「Webアプリとして開く」→「追加」を押してください。'
    : 'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選んでください。',
)

const closeMenu = () => {
  isMenuOpen.value = false
  isInstallHelpOpen.value = false
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  if (!isMenuOpen.value) isInstallHelpOpen.value = false
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (isMenuOpen.value && !menuRoot.value?.contains(event.target as Node)) closeMenu()
}

const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeMenu()
}

const handleInstall = async () => {
  const result = await installApp()
  isInstallHelpOpen.value = result === 'instructions'
}

const deleteSavedData = async () => {
  const target = isGuestMode.value ? 'この端末' : '端末とクラウド'
  if (!window.confirm(`${target}に保存された時間割やメモをすべて削除しますか？`)) return

  await clearPersistedState()
  closeMenu()
  try {
    await router.replace({ name: 'student-id' })
  } finally {
    resumePersistence()
  }
}

const handleSignOut = async () => {
  closeMenu()
  if (isGuestMode.value) {
    exitGuestMode()
    return
  }
  await signOutOfApp()
}

watch(
  () => route.fullPath,
  () => closeMenu(),
)

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<template>
  <header class="app-header">
    <RouterLink v-if="route.name === 'home'" class="header-action condition-link" to="/conditions">
      <span aria-hidden="true">✦</span>
      希望条件
    </RouterLink>
    <RouterLink v-else-if="showResultsBackLink" class="header-action home-link" to="/results">
      <span aria-hidden="true">←</span>
      戻る
    </RouterLink>
    <RouterLink v-else-if="showHomeLink" class="header-action home-link" to="/">
      <span aria-hidden="true">←</span>
      ホーム
    </RouterLink>
    <span v-else class="header-brand">らくたんん!!</span>

    <div ref="menuRoot" class="menu-root">
      <button
        class="header-action menu-trigger"
        type="button"
        :aria-expanded="isMenuOpen"
        aria-controls="app-menu"
        @click="toggleMenu"
      >
        <span class="hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
        メニュー
        <span v-if="currentUser && pendingFriendRequestCount > 0" class="menu-notification">
          {{ pendingFriendRequestCount > 9 ? '9+' : pendingFriendRequestCount }}
        </span>
      </button>

      <Transition name="menu-pop">
        <section v-if="isMenuOpen" id="app-menu" class="app-menu" aria-label="メニュー">
          <div class="menu-heading">
            <strong>メニュー</strong>
            <button type="button" aria-label="メニューを閉じる" @click="closeMenu">×</button>
          </div>

          <div class="account-card">
            <img
              v-if="currentUser?.photoURL"
              :src="currentUser.photoURL"
              alt=""
              referrerpolicy="no-referrer"
            />
            <span v-else class="account-avatar" aria-hidden="true">{{ accountInitial }}</span>
            <div class="account-copy">
              <small>ログイン・保存状況</small>
              <strong>{{ accountName }}</strong>
              <span
                :class="`sync-status sync-status--${isGuestMode ? 'local' : cloudSyncStatus}`"
                :title="isGuestMode ? '' : cloudSyncError"
              >
                <i aria-hidden="true"></i>{{ cloudSyncLabel }}
              </span>
            </div>
          </div>
          <p v-if="authError" class="menu-error" role="alert">{{ authError }}</p>

          <nav class="menu-items" aria-label="アプリの操作">
            <RouterLink v-if="currentUser" class="menu-item" to="/friends" @click="closeMenu">
              <span class="menu-icon friends-icon" aria-hidden="true">●●</span>
              <span><strong>友達</strong><small>時間割や共通の授業を見る</small></span>
              <b v-if="pendingFriendRequestCount > 0" class="item-badge">
                {{ pendingFriendRequestCount > 9 ? '9+' : pendingFriendRequestCount }}
              </b>
              <span v-else class="chevron" aria-hidden="true">›</span>
            </RouterLink>

            <button
              class="menu-item special-course-menu-item"
              :class="{ active: store.includeUnscheduledCourses }"
              type="button"
              :aria-pressed="store.includeUnscheduledCourses"
              @click="store.setIncludeUnscheduledCourses(!store.includeUnscheduledCourses)"
            >
              <span class="menu-icon" aria-hidden="true">
                {{ store.includeUnscheduledCourses ? '✓' : '＋' }}
              </span>
              <span>
                <strong>集中・曜日時限未定の授業も探す</strong>
                <small>通常の時間割表に置けない授業は、登録済み一覧へ分けて表示します。</small>
              </span>
              <span class="menu-toggle-state" aria-hidden="true">
                {{ store.includeUnscheduledCourses ? 'ON' : 'OFF' }}
              </span>
            </button>

            <button v-if="!isAppInstalled" class="menu-item" type="button" @click="handleInstall">
              <span class="menu-icon" aria-hidden="true">＋</span>
              <span
                ><strong>{{ installButtonLabel }}</strong
                ><small>ホーム画面からすぐに開く</small></span
              >
              <span class="chevron" aria-hidden="true">›</span>
            </button>
            <div v-else class="menu-item menu-item--status">
              <span class="menu-icon" aria-hidden="true">✓</span>
              <span
                ><strong>アプリインストール済み</strong
                ><small>ホーム画面から利用できます</small></span
              >
            </div>
            <p v-if="isInstallHelpOpen" class="install-help" role="status">
              {{ installInstructions }}
            </p>

            <RouterLink
              class="menu-item"
              :to="{ name: 'student-id', query: { edit: '1' } }"
              @click="closeMenu"
            >
              <span class="menu-icon" aria-hidden="true">#</span>
              <span>
                <strong>{{ isStudentIdRegistered ? '学籍番号を再入力' : '学籍番号を入力' }}</strong>
                <small>学部・学年の判定を更新する</small>
              </span>
              <span class="chevron" aria-hidden="true">›</span>
            </RouterLink>

            <a
              class="menu-item"
              :href="feedbackFormUrl"
              target="_blank"
              rel="noopener noreferrer"
              @click="closeMenu"
            >
              <span class="menu-icon" aria-hidden="true">✎</span>
              <span><strong>フィードバック</strong><small>感想や改善案を送る</small></span>
              <span class="external-mark" aria-hidden="true">↗</span>
            </a>

            <button class="menu-item menu-item--danger" type="button" @click="deleteSavedData">
              <span class="menu-icon" aria-hidden="true">×</span>
              <span><strong>保存データを削除</strong><small>時間割やメモをすべて消す</small></span>
            </button>
          </nav>

          <button
            class="sign-out-button"
            type="button"
            :disabled="isSigningOut"
            @click="handleSignOut"
          >
            {{
              isGuestMode ? 'Googleログイン画面へ' : isSigningOut ? 'ログアウト中…' : 'ログアウト'
            }}
          </button>
        </section>
      </Transition>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.header-action {
  position: relative;
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 0.95rem;
  border: 3px solid #111827;
  border-radius: 0.65rem;
  background: #fffdf4;
  box-shadow: 4px 4px 0 #111827;
  color: #111827;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.header-action:hover,
.header-action:focus-visible {
  box-shadow: 6px 6px 0 #111827;
  transform: translate(-2px, -2px);
}

.header-action:focus-visible {
  outline: 3px solid var(--comic-green);
  outline-offset: 3px;
}

.condition-link {
  background: var(--comic-yellow);
}

.condition-link span {
  font-size: 1.15rem;
}

.header-brand {
  color: #111827;
  font-size: 1.05rem;
  font-weight: 1000;
  text-shadow: 2px 2px 0 var(--comic-yellow);
}

.menu-root {
  position: relative;
}

.menu-trigger {
  background: #111827;
  box-shadow: 4px 4px 0 var(--comic-green);
  color: #ffffff;
}

.menu-trigger:hover,
.menu-trigger:focus-visible {
  background: #263041;
  box-shadow: 6px 6px 0 var(--comic-green);
}

.hamburger {
  display: grid;
  gap: 3px;
}

.hamburger i {
  display: block;
  width: 1rem;
  height: 2px;
  border-radius: 99px;
  background: currentColor;
}

.menu-notification,
.item-badge {
  display: grid;
  min-width: 1.3rem;
  height: 1.3rem;
  place-items: center;
  padding: 0 0.25rem;
  border: 2px solid #111827;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 900;
}

.menu-notification {
  position: absolute;
  top: -0.55rem;
  right: -0.55rem;
}

.app-menu {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: min(24rem, calc(100vw - 2rem));
  padding: 1rem;
  border: 3px solid #111827;
  border-radius: 0.8rem;
  background: #fffdf4;
  box-shadow: 8px 8px 0 #111827;
  color: #111827;
}

.menu-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.menu-heading strong {
  font-size: 1.15rem;
}

.menu-heading button {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 0;
  background: transparent;
  color: #111827;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
}

.account-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
  padding: 0.75rem;
  border: 2px solid #111827;
  border-radius: 0.65rem;
  background: #ffffff;
}

.account-card img,
.account-avatar {
  width: 2.6rem;
  height: 2.6rem;
  flex: 0 0 auto;
  border: 2px solid #111827;
  border-radius: 50%;
  background: var(--comic-yellow);
}

.account-card img {
  object-fit: cover;
}

.account-avatar {
  display: grid;
  place-items: center;
  font-weight: 900;
}

.account-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  line-height: 1.3;
}

.account-copy small {
  color: #6b7280;
  font-size: 0.68rem;
  font-weight: 800;
}

.account-copy strong {
  overflow: hidden;
  font-size: 0.86rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.15rem;
  color: #047857;
  font-size: 0.68rem;
  font-weight: 900;
}

.sync-status i {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: currentColor;
}

.sync-status--saving,
.sync-status--syncing {
  color: #92400e;
}

.sync-status--offline {
  color: #b91c1c;
}

.menu-error,
.install-help {
  margin: 0 0 0.75rem;
  padding: 0.65rem 0.75rem;
  border: 2px solid #111827;
  border-radius: 0.55rem;
  background: var(--comic-yellow);
  font-size: 0.75rem;
  font-weight: 800;
  line-height: 1.5;
}

.menu-error {
  border-color: #991b1b;
  background: #fee2e2;
  color: #991b1b;
}

.menu-items {
  display: grid;
  gap: 0.35rem;
}

.menu-item {
  display: grid;
  width: 100%;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: #111827;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
}

.menu-item:hover,
.menu-item:focus-visible {
  background: #f7e343;
  outline: none;
}

.menu-item > span:nth-child(2) {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.menu-item strong {
  font-size: 0.86rem;
}

.menu-item small {
  color: #6b7280;
  font-size: 0.68rem;
  font-weight: 700;
}

.menu-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 2px solid #111827;
  border-radius: 0.5rem;
  background: #ffffff;
  font-size: 0.9rem;
  font-weight: 900;
}

.friends-icon {
  color: var(--comic-green);
  font-size: 0.46rem;
  letter-spacing: -0.1rem;
}

.chevron,
.external-mark {
  font-size: 1.25rem;
  font-weight: 900;
}

.menu-item--status {
  cursor: default;
}

.menu-item--status:hover {
  background: transparent;
}

.special-course-menu-item.active {
  background: #e7fffb;
}

.special-course-menu-item.active .menu-icon {
  background: var(--comic-green);
  color: #ffffff;
}

.menu-toggle-state {
  min-width: 2.6rem;
  padding: 0.2rem 0.35rem;
  border: 2px solid #111827;
  border-radius: 999px;
  background: #ffffff;
  color: #111827;
  font-size: 0.62rem;
  font-weight: 900;
  text-align: center;
}

.special-course-menu-item.active .menu-toggle-state {
  background: var(--comic-green);
  color: #ffffff;
}

.menu-item--danger {
  color: #b91c1c;
}

.menu-item--danger .menu-icon {
  border-color: #b91c1c;
  color: #b91c1c;
}

.sign-out-button {
  width: 100%;
  margin-top: 0.8rem;
  padding: 0.65rem;
  border: 2px solid #111827;
  border-radius: 0.55rem;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
}

.sign-out-button:hover:not(:disabled) {
  background: #e5e7eb;
}

.sign-out-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.menu-pop-enter-active,
.menu-pop-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
  transform-origin: top right;
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-0.4rem) scale(0.98);
}

@media (max-width: 640px) {
  .app-header {
    position: sticky;
    top: max(0.5rem, env(safe-area-inset-top));
    margin: 0 0.5rem 1rem;
  }

  .header-action {
    min-height: 2.7rem;
    padding: 0.58rem 0.72rem;
    border-width: 2px;
    box-shadow: 3px 3px 0 #111827;
    font-size: 0.82rem;
  }

  .menu-trigger {
    box-shadow: 3px 3px 0 var(--comic-green);
  }

  .header-brand {
    font-size: 0.92rem;
  }

  .app-menu {
    position: fixed;
    top: calc(max(0.5rem, env(safe-area-inset-top)) + 3.3rem);
    right: max(0.75rem, env(safe-area-inset-right));
    width: min(23rem, calc(100vw - 1.5rem));
    max-height: calc(100dvh - 5rem);
    overflow-y: auto;
    box-shadow: 6px 6px 0 #111827;
  }
}
</style>
