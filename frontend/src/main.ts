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
  cloudDataRevision,
  deactivateUserPersistence,
  startPersistence,
} from './utils/persistence'
import { store } from './store'
import { getMissingRequiredStudentAttributes } from './services/studentAttributes'
import { isValidStudentProfile } from './services/studentProfile'

const app = createApp(App)
let authenticationTransition = 0

const routeForCurrentData = async () => {
  if (!store.studentProfile || !isValidStudentProfile(store.studentProfile)) {
    if (router.currentRoute.value.name !== 'student-id') {
      await router.replace({ name: 'student-id' })
    }
    return
  }

  if (getMissingRequiredStudentAttributes(store.studentProfile).length > 0) {
    if (router.currentRoute.value.name !== 'student-id') {
      await router.replace({ name: 'student-id', query: { edit: '1' } })
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
}

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
      await activateGuestPersistence()
      if (router.currentRoute.value.name === 'friends') {
        await router.replace({ name: 'home' })
      }
    } else if (user) {
      await activateUserPersistence(user.uid)
      if (transition !== authenticationTransition || currentUser.value?.uid !== user.uid) return
      await initializeFriendFeatures(user)
      if (transition !== authenticationTransition || currentUser.value?.uid !== user.uid) return
    }

    await routeForCurrentData()
  },
  { immediate: true },
)

watch(cloudDataRevision, async () => {
  if (!isAuthReady.value || !currentUser.value) return
  await routeForCurrentData()
})

void initializeAuthentication()

app.mount('#app')
