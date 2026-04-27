import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { vFeedback } from './directives/feedback'
import { maybeStartPerfMonitor } from './utils/perfMonitor'

const app = createApp(App)
const pinia = createPinia()
setActivePinia(pinia)

app.use(pinia)
app.use(router)
app.directive('feedback', vFeedback)

app.mount('#app')

maybeStartPerfMonitor()
