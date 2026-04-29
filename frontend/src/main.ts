import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import './styles/app.scss'
import App from './App.vue'
import router from './router'
import { vFeedback } from './directives/feedback'
import { maybeStartPerfMonitor } from './utils/perfMonitor'
import { i18n } from './i18n'

const app = createApp(App)
const pinia = createPinia()
setActivePinia(pinia)

app.use(pinia)
app.use(router)
app.use(i18n)
app.directive('feedback', vFeedback)

app.mount('#app')

maybeStartPerfMonitor()
