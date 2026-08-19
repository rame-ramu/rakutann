import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDzpE5-e0nK0ceA1PO2NdVMFRR-hVH1TRg',
  authDomain: 'rakutann-aichishukutoku.firebaseapp.com',
  projectId: 'rakutann-aichishukutoku',
  storageBucket: 'rakutann-aichishukutoku.firebasestorage.app',
  messagingSenderId: '1052433769622',
  appId: '1:1052433769622:web:f6faa44cab0f377c914eb7',
  measurementId: 'G-E2NLWNGDJQ',
}

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const firebaseAuth = getAuth(firebaseApp)
export const firestoreDb = getFirestore(firebaseApp)
export const googleAuthProvider = new GoogleAuthProvider()

googleAuthProvider.setCustomParameters({ prompt: 'select_account' })
