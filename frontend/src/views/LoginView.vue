<template>
  <div class="login-page">
    <main class="login-card">
      <div class="login-hero">
        <p class="eyebrow">履修選びを、もっと気楽に。</p>
        <h1>らくたんん!!</h1>
        <p class="subtitle">Googleアカウントでログインして始めましょう。</p>
      </div>

      <div class="login-panel">
        <h2>ログイン</h2>
        <p>時間割を利用するには、Googleアカウントでログインしてください。</p>

        <button
          class="google-login-button"
          type="button"
          :disabled="isSigningIn"
          @click="signInWithGoogle"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285f4"
              d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
            />
            <path
              fill="#34a853"
              d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.52a6.03 6.03 0 0 1-8.98-3.17H3.07v2.6A10 10 0 0 0 12 22Z"
            />
            <path
              fill="#fbbc05"
              d="M6.42 13.88A6 6 0 0 1 6.1 12c0-.65.11-1.29.32-1.88v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.48l3.35-2.6Z"
            />
            <path
              fill="#ea4335"
              d="M12 5.96c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.93 5.52l3.35 2.6A5.96 5.96 0 0 1 12 5.96Z"
            />
          </svg>
          <span>{{ isSigningIn ? 'ログインしています…' : 'Googleでログイン' }}</span>
        </button>

        <p v-if="authError" class="login-error" role="alert">{{ authError }}</p>
        <p class="privacy-note">
          Googleアカウントは本人確認と時間割のクラウド保存に使用します。学籍番号は保存されません。
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { authError, isSigningIn, signInWithGoogle } from '../auth'
</script>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 2rem;
}

.login-card {
  width: min(100%, 760px);
  padding: clamp(1.5rem, 5vw, 3rem);
  border: 4px solid #111827;
  border-radius: 0.7rem;
  background: #ffffff;
  box-shadow: 10px 10px 0 #111827;
  text-align: center;
}

.login-hero {
  margin-bottom: 2rem;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 1rem;
  padding: 0.35rem 0.8rem;
  border: 2px solid #111827;
  border-radius: 999px;
  background: var(--comic-yellow);
  color: #111827;
  font-size: 0.85rem;
  font-weight: 900;
}

h1 {
  margin-bottom: 0.75rem;
  color: #111827;
  font-size: clamp(2.6rem, 10vw, 5rem);
  font-weight: 1000;
  letter-spacing: -0.05em;
  line-height: 1;
  -webkit-text-stroke: 2px #111827;
  paint-order: stroke fill;
  text-shadow:
    3px 3px 0 var(--comic-green),
    6px 6px 0 var(--comic-green),
    -3px -3px 0 rgba(247, 227, 67, 0.9);
}

.subtitle {
  color: #374151;
  font-size: 1.05rem;
  font-weight: 800;
}

.login-panel {
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 3px solid #111827;
  border-radius: 0.7rem;
  background: #fffdf4;
  box-shadow: 6px 6px 0 #111827;
}

.login-panel h2 {
  margin-bottom: 0.35rem;
  color: #111827;
  font-size: 1.5rem;
  font-weight: 900;
}

.login-panel > p:not(.login-error, .privacy-note) {
  margin-bottom: 1.5rem;
  color: #4b5563;
  font-weight: 700;
}

.google-login-button {
  display: inline-flex;
  width: min(100%, 360px);
  min-height: 3.5rem;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 0.85rem 1.25rem;
  border: 3px solid #111827;
  border-radius: 0.65rem;
  background: #ffffff;
  box-shadow: 5px 5px 0 #111827;
  color: #111827;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 900;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.google-login-button:hover:not(:disabled) {
  background: #f9fafb;
  box-shadow: 7px 7px 0 #111827;
  transform: translate(-2px, -2px);
}

.google-login-button:focus-visible {
  outline: 3px solid var(--comic-green);
  outline-offset: 4px;
}

.google-login-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.google-login-button svg {
  width: 1.5rem;
  height: 1.5rem;
  flex: 0 0 auto;
}

.login-error {
  margin-top: 1.25rem;
  padding: 0.75rem;
  border: 2px solid #991b1b;
  border-radius: 0.5rem;
  background: #fee2e2;
  color: #991b1b;
  font-weight: 800;
}

.privacy-note {
  margin-top: 1.25rem;
  color: #6b7280;
  font-size: 0.78rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .login-page {
    align-items: start;
    padding: 0.75rem;
  }

  .login-card {
    margin-top: 1rem;
    border-width: 3px;
    box-shadow: 6px 6px 0 #111827;
  }

  h1 {
    -webkit-text-stroke-width: 1.5px;
    text-shadow:
      3px 3px 0 var(--comic-green),
      -2px -2px 0 rgba(247, 227, 67, 0.9);
  }

  .login-panel {
    border-width: 3px;
    box-shadow: 4px 4px 0 #111827;
  }
}
</style>
