<script setup lang="ts">
import { computed, ref } from 'vue'
import { installApp, isAppInstalled, isInstallPromptReady, isIosDevice } from '../pwa'

const isHelpOpen = ref(false)

const buttonLabel = computed(() =>
  isInstallPromptReady.value ? 'アプリをインストール' : 'アプリとして使う',
)

const installInstructions = computed(() =>
  isIosDevice.value
    ? 'Safariの共有ボタンから「ホーム画面に追加」→「Webアプリとして開く」→「追加」を押してください。'
    : 'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選んでください。',
)

const handleInstall = async () => {
  const result = await installApp()
  isHelpOpen.value = result === 'instructions'
}
</script>

<template>
  <aside v-if="!isAppInstalled" class="pwa-install">
    <button class="pwa-install-button" type="button" @click="handleInstall">
      <span aria-hidden="true">＋</span>
      {{ buttonLabel }}
    </button>

    <Transition name="pwa-help">
      <div v-if="isHelpOpen" class="pwa-help" role="status">
        <button
          class="pwa-help-close"
          type="button"
          aria-label="アプリ追加の説明を閉じる"
          @click="isHelpOpen = false"
        >
          ×
        </button>
        <strong>ホーム画面に追加できます</strong>
        <p>{{ installInstructions }}</p>
      </div>
    </Transition>
  </aside>
</template>

<style scoped>
.pwa-install {
  position: fixed;
  bottom: max(16px, env(safe-area-inset-bottom));
  left: max(16px, env(safe-area-inset-left));
  z-index: 1001;
}

.pwa-install-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 0.9rem;
  border: 2px solid #111827;
  border-radius: 999px;
  background: var(--comic-green);
  box-shadow: 3px 3px 0 #111827;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 900;
}

.pwa-install-button:hover,
.pwa-install-button:focus-visible {
  background: #008a8a;
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #111827;
}

.pwa-install-button:focus-visible,
.pwa-help-close:focus-visible {
  outline: 3px solid var(--comic-yellow);
  outline-offset: 3px;
}

.pwa-install-button span {
  display: grid;
  width: 1.2rem;
  height: 1.2rem;
  place-items: center;
  border: 2px solid currentColor;
  border-radius: 0.25rem;
  font-size: 1rem;
  line-height: 1;
}

.pwa-help {
  position: absolute;
  bottom: calc(100% + 0.8rem);
  left: 0;
  width: min(20rem, calc(100vw - 2rem));
  padding: 1rem 2.4rem 1rem 1rem;
  border: 3px solid #111827;
  border-radius: 0.7rem;
  background: #fffdf4;
  box-shadow: 5px 5px 0 #111827;
  color: #111827;
}

.pwa-help strong {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.95rem;
}

.pwa-help p {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.6;
}

.pwa-help-close {
  position: absolute;
  top: 0.4rem;
  right: 0.45rem;
  width: 1.7rem;
  height: 1.7rem;
  border: 0;
  background: transparent;
  color: #111827;
  cursor: pointer;
  font-size: 1.4rem;
  font-weight: 900;
  line-height: 1;
}

.pwa-help-enter-active,
.pwa-help-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.pwa-help-enter-from,
.pwa-help-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

@media (max-width: 640px) {
  .pwa-install {
    bottom: max(12px, env(safe-area-inset-bottom));
    left: max(12px, env(safe-area-inset-left));
  }

  .pwa-install-button {
    min-height: 40px;
    padding: 0.55rem 0.7rem;
    font-size: 0.76rem;
  }
}
</style>
