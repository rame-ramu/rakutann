import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadPersistedState, startPersistence } from './utils/persistence'
import { store } from './store'

loadPersistedState()

const app = createApp(App)

app.use(router)

startPersistence(router)

if (typeof window !== 'undefined' && store.lastPage) {
  const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname
  if (window.location.pathname === basePath && router.resolve(store.lastPage).matched.length > 0) {
    router.replace(store.lastPage)
  }
}

app.mount('#app')
