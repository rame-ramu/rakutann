import './assets/main.css'

import { createApp, watch } from 'vue'
import App from './App.vue'
import { currentUser, initializeAuthentication, isAuthReady, isGuestMode } from './auth'
import {
  deactivateFriendFeatures,
  initializeFriendFeatures,
  startFriendPersistence,
} from './friends'
import { initializePwa } from './pwa'
import router from './router'
import {
  activateUserPersistence,
  activateGuestPersistence,
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
  [isAuthReady, currentUser, isGuestMode],
  async ([authReady, user, guestMode]) => {
    if (!authReady) return
    const transition = ++authenticationTransition

    if (!user && !guestMode) {
      deactivateFriendFeatures()
      deactivateUserPersistence()
      if (router.currentRoute.value.name !== 'student-id') {
        await router.replace({ name: 'student-id' })
      }
      return
    }

    if (guestMode && !user) {
      deactivateFriendFeatures()
      activateGuestPersistence()
      if (router.currentRoute.value.name === 'friends') {
        await router.replace({ name: 'home' })
      }
    } else if (user) {
      await activateUserPersistence(user.uid)
      if (transition !== authenticationTransition || currentUser.value?.uid !== user.uid) return
      await initializeFriendFeatures(user)
      if (transition !== authenticationTransition || currentUser.value?.uid !== user.uid) return
    }

    if (!store.department) {
      if (router.currentRoute.value.name !== 'student-id') {
        await router.replace({ name: 'student-id' })
      }
      return
    }

    if (
      router.currentRoute.value.name === 'student-id' &&
      router.currentRoute.value.query.edit !== '1'
    ) {
      await router.replace({ name: 'home' })
      return
    }

    if (!router.currentRoute.value.matched.length) {
      await router.replace({ name: 'home' })
    }
  },
  { immediate: true },
)

void initializeAuthentication()

app.mount('#app')
