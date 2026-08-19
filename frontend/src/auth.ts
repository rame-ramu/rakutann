import { FirebaseError } from 'firebase/app'
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { ref, shallowRef } from 'vue'
import { firebaseAuth, googleAuthProvider } from './firebase'
import { flushFriendSchedule, flushSharedMemos } from './friends'
import { flushCloudSave } from './utils/persistence'

export const currentUser = shallowRef<User | null>(null)
export const isAuthReady = ref(false)
export const isGuestMode = ref(false)
export const isSigningIn = ref(false)
export const isSigningOut = ref(false)
export const authError = ref('')

let isAuthenticationInitialized = false
const GUEST_MODE_KEY = 'rakutann-guest-mode'

const canUseLocalStorage = () => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

const saveGuestMode = (enabled: boolean) => {
  if (!canUseLocalStorage()) return

  try {
    if (enabled) {
      window.localStorage.setItem(GUEST_MODE_KEY, '1')
    } else {
      window.localStorage.removeItem(GUEST_MODE_KEY)
    }
  } catch {
    // Storage can be unavailable in private browsing; session-only guest mode still works.
  }
}

export const enterGuestMode = () => {
  authError.value = ''
  saveGuestMode(true)
  isGuestMode.value = true
}

export const exitGuestMode = () => {
  saveGuestMode(false)
  isGuestMode.value = false
}

const getAuthErrorMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return 'ログインに失敗しました。時間をおいて、もう一度お試しください。'
  }

  switch (error.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return ''
    case 'auth/popup-blocked':
      return 'ログイン画面がブロックされました。ポップアップを許可して、もう一度お試しください。'
    case 'auth/unauthorized-domain':
      return 'このサイトのドメインがFirebaseで許可されていません。管理者にお問い合わせください。'
    case 'auth/network-request-failed':
      return '通信に失敗しました。インターネット接続を確認してください。'
    default:
      return 'ログインに失敗しました。時間をおいて、もう一度お試しください。'
  }
}

export const initializeAuthentication = async () => {
  if (isAuthenticationInitialized) return
  isAuthenticationInitialized = true

  if (canUseLocalStorage()) {
    try {
      isGuestMode.value = window.localStorage.getItem(GUEST_MODE_KEY) === '1'
    } catch {
      isGuestMode.value = false
    }
  }

  try {
    await setPersistence(firebaseAuth, browserLocalPersistence)
  } catch (error) {
    authError.value = getAuthErrorMessage(error)
  }

  onAuthStateChanged(
    firebaseAuth,
    (user) => {
      if (user) exitGuestMode()
      currentUser.value = user
      authError.value = ''
      isAuthReady.value = true
    },
    (error) => {
      currentUser.value = null
      authError.value = getAuthErrorMessage(error)
      isAuthReady.value = true
    },
  )
}

export const signInWithGoogle = async () => {
  if (isSigningIn.value) return

  isSigningIn.value = true
  authError.value = ''

  try {
    await signInWithPopup(firebaseAuth, googleAuthProvider)
  } catch (error) {
    authError.value = getAuthErrorMessage(error)
  } finally {
    isSigningIn.value = false
  }
}

export const signOutOfApp = async () => {
  if (isSigningOut.value) return

  isSigningOut.value = true
  authError.value = ''

  try {
    await flushCloudSave()
    await flushFriendSchedule()
    await flushSharedMemos()
    await signOut(firebaseAuth)
  } catch (error) {
    authError.value = getAuthErrorMessage(error)
  } finally {
    isSigningOut.value = false
  }
}
