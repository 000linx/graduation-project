import { createI18n } from 'vue-i18n'
import { messages } from './messages'

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages
})
