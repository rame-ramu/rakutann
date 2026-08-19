import './assets/main.css'

import { createApp, watch } from 'vue'
import App from './App.vue'
import { currentUser, initializeAuthentication, isAuthReady } from './auth'
import {
  deactivateFriendFeatures,
  initializeFriendFeatures,
  startFriendPersistence,
} from './friends'
import { initializePwa } from './pwa'
import router from './router'
import {
  activateUserPersistence,
  deactivateUserPersistence,
  startPersistence,
} from './utils/persistence'
import { store } from './store'

const app = createApp(App)
let authenticationTransition = 0

app.use(router)

startPersistence(router)
startFriendPersistence()
initializePwa()

watch(
  [isAuthReady, currentUser],
  async ([authReady, user]) => {
    if (!authReady) return
    const transition = ++authenticationTransition

    if (!user) {
      deactivateFriendFeatures()
      deactivateUserPersistence()
      if (router.currentRoute.value.name !== 'student-id') {
        await router.replace({ name: 'student-id' })
      }
      return
    }

    await activateUserPersistence(user.uid)
    if (transition !== authenticationTransition || currentUser.value?.uid !== user.uid) return
    await initializeFriendFeatures(user)
    if (transition !== authenticationTransition || currentUser.value?.uid !== user.uid) return

    if (typeof window !== 'undefined' && store.lastPage) {
      const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname
      if (
        window.location.pathname === basePath &&
        router.resolve(store.lastPage).matched.length > 0
      ) {
        await router.replace(store.lastPage)
        return
      }
    }

    if (!store.lastPage && router.currentRoute.value.name !== 'student-id') {
      await router.replace({ name: 'student-id' })
    }
  },
  { immediate: true },
)

void initializeAuthentication()

app.mount('#app')
