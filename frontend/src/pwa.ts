import { computed, ref, shallowRef } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const installPrompt = shallowRef<BeforeInstallPromptEvent | null>(null)
let isInitialized = false

export const isAppInstalled = ref(false)
export const isIosDevice = ref(false)
export const isInstallPromptReady = computed(() => installPrompt.value !== null)

const updateInstalledState = () => {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  isAppInstalled.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
}

export const initializePwa = () => {
  if (isInitialized || typeof window === 'undefined') return
  isInitialized = true

  isIosDevice.value = /iPad|iPhone|iPod/.test(navigator.userAgent)
  updateInstalledState()

  window.matchMedia('(display-mode: standalone)').addEventListener('change', updateInstalledState)
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt.value = event as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    installPrompt.value = null
    isAppInstalled.value = true
  })
}

export const installApp = async () => {
  const prompt = installPrompt.value
  if (!prompt) return 'instructions' as const

  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  installPrompt.value = null
  return outcome
}
