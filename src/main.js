import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { createPinia } from 'pinia' 

const savedTheme = localStorage.getItem('theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => registrations.forEach(registration => registration.unregister()))
    .catch(() => {})
}

if ('caches' in window) {
  caches.keys()
    .then(keys => keys.forEach(key => caches.delete(key)))
    .catch(() => {})
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
