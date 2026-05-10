<script setup lang="ts">
import Header from './components/Header.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useA11yStore } from './stores/a11y'
import { useRecoStore } from './stores/reco'
import { useI18n } from 'vue-i18n'
import SpeechCaptionOverlay from './components/a11y/SpeechCaptionOverlay.vue'
import A11yBanner from './components/a11y/A11yBanner.vue'
import A11yLiveRegion from './components/a11y/A11yLiveRegion.vue'
import ToastHost from './components/ToastHost.vue'
import PageTransitionOverlay from './components/PageTransitionOverlay.vue'
import { Instagram, Mail, MessageCircle, Twitter } from 'lucide-vue-next'
import { notify } from './utils/notify'
import { useRouter } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

const route = useRoute()
const router = useRouter()
const isAdminRoute = computed(
  () => (route.path === '/admin' || route.path.startsWith('/admin/')) && route.path !== '/admin/login'
)

const isCoverRoute = computed(() => route.path === '/cover')

const a11y = useA11yStore()
a11y.init()
const reco = useRecoStore()
reco.init()

const { t } = useI18n()

dayjs.locale('zh-cn')
const elementLocale = ref(zhCn)

const footerEmail = ref('')
const footerTags = [
  { label: '隐形式', q: '隐形' },
  { label: '充电款', q: '充电' },
  { label: '降噪', q: '降噪' },
  { label: '老人易用', q: '老人' }
]

function footerSubscribe() {
  const v = footerEmail.value.trim()
  if (!v) return
  footerEmail.value = ''
  notify(t('footer.subOk'), { tone: 'success' })
}

function goTag(q: string) {
  router.push({ path: '/', query: { q } })
}

function openSocial(name: string) {
  notify(`${name} 链接已准备好（演示环境未配置外链）`, { tone: 'info' })
}

function onAuthLogout() {
  const current = router.currentRoute?.value
  if (!current) return
  const p = current.path
  if (p === '/login' || p === '/register' || p === '/cover' || p === '/admin/login') return
  router.replace({ path: '/login', query: { redirect: current.fullPath } })
}

onMounted(() => {
  window.addEventListener('auth:logout', onAuthLogout)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth:logout', onAuthLogout)
})
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view v-if="isAdminRoute || isCoverRoute" />
    <div v-else class="min-h-screen flex flex-col bg-[var(--c-bg)] text-[var(--c-text)]">
      <Header />
      <main id="main-content" class="flex-grow container mx-auto px-4 py-8">
        <router-view />
      </main>
      <footer class="border-t bg-[var(--c-surface)] border-[var(--c-border)]" aria-label="页脚">
        <div class="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <section aria-label="品牌信息">
            <div class="text-xl font-extrabold text-[var(--c-primary)]">{{ $t('footer.brandTitle') }}</div>
            <div class="mt-2 text-sm font-semibold text-[var(--c-muted)] leading-relaxed">
              {{ $t('footer.brandDesc') }}
            </div>
            <div class="mt-4 flex items-center gap-2" aria-label="社交媒体">
              <button
                v-feedback
                type="button"
                class="a11y-hit rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)]"
                aria-label="打开微信公众号"
                @click="openSocial('微信公众号')"
              >
                <MessageCircle class="h-5 w-5 mx-auto icon-tone--info" aria-hidden="true" />
              </button>
              <button
                v-feedback
                type="button"
                class="a11y-hit rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)]"
                aria-label="打开微博"
                @click="openSocial('微博')"
              >
                <Twitter class="h-5 w-5 mx-auto icon-tone--info" aria-hidden="true" />
              </button>
              <button
                v-feedback
                type="button"
                class="a11y-hit rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)]"
                aria-label="打开小红书"
                @click="openSocial('小红书')"
              >
                <Instagram class="h-5 w-5 mx-auto icon-tone--info" aria-hidden="true" />
              </button>
            </div>
          </section>

          <section aria-label="辅助导航">
            <div class="text-base font-extrabold text-[var(--c-text)]">{{ $t('footer.quick') }}</div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <router-link
                to="/"
                v-feedback
                class="a11y-hit justify-center rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold no-underline"
                :aria-label="$t('nav.home')"
                >{{ $t('nav.home') }}</router-link
              >
              <router-link
                to="/recommendations"
                v-feedback
                class="a11y-hit justify-center rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold no-underline"
                aria-label="个性化推荐"
                >{{ $t('nav.reco') }}</router-link
              >
              <router-link
                to="/cart"
                v-feedback
                class="a11y-hit justify-center rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold no-underline"
                aria-label="购物车"
                >{{ $t('nav.cart') }}</router-link
              >
              <router-link
                to="/profile"
                v-feedback
                class="a11y-hit justify-center rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold no-underline"
                aria-label="个人中心"
                >{{ $t('nav.profile') }}</router-link
              >
            </div>
          </section>

          <section aria-label="热门标签">
            <div class="text-base font-extrabold text-[var(--c-text)]">{{ $t('footer.tags') }}</div>
            <div class="mt-3 flex flex-nowrap gap-2 overflow-x-auto" aria-label="热门标签列表">
              <button
                v-for="t in footerTags"
                :key="t.label"
                v-feedback
                type="button"
                class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold text-sm"
                :aria-label="`筛选：${t.label}`"
                @click="goTag(t.q)"
              >
                {{ t.label }}
              </button>
            </div>
            <div class="mt-3 text-xs font-semibold text-[var(--c-muted)]">{{ $t('footer.tagsHint') }}</div>
          </section>

          <section aria-label="订阅">
            <div class="text-base font-extrabold text-[var(--c-text)]">{{ $t('footer.subscribe') }}</div>
            <div class="mt-3 text-sm font-semibold text-[var(--c-muted)]">{{ $t('footer.subscribeHint') }}</div>
            <div class="mt-4 flex gap-2">
              <input
                v-model="footerEmail"
                class="min-w-0 flex-1 h-11 px-3 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-semibold"
                :placeholder="$t('footer.emailPlaceholder')"
                inputmode="email"
                autocomplete="email"
                :aria-label="$t('footer.emailLabel')"
                @keydown.enter.prevent="footerSubscribe"
              />
              <button
                type="button"
                class="h-11 px-4 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-primary)] text-[var(--c-on-primary)] font-extrabold"
                :disabled="!footerEmail.trim()"
                :aria-label="$t('footer.submit')"
                @click="footerSubscribe"
              >
                <Mail class="h-4 w-4 icon-tone--info" aria-hidden="true" />
              </button>
            </div>
            <div class="mt-3 text-xs font-semibold text-[var(--c-muted)]">{{ $t('footer.note') }}</div>
          </section>
        </div>

        <div class="border-t border-[var(--c-border)]">
          <div
            class="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[var(--c-muted)]"
          >
            <p class="text-sm font-semibold">&copy; 2026 助听器购物商城. All rights reserved.</p>
            <p class="text-sm font-semibold">{{ $t('footer.compat') }}</p>
          </div>
        </div>
      </footer>
    </div>
    <A11yBanner />
    <SpeechCaptionOverlay />
    <A11yLiveRegion />
    <ToastHost />
    <PageTransitionOverlay />
  </el-config-provider>
</template>
