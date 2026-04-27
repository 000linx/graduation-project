<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ExternalLink, Search, Shield, ShoppingCart, User } from 'lucide-vue-next'
import { useCartStore } from '../stores/cart'
import { useA11yStore } from '../stores/a11y'
import { useSpeechStore } from '../stores/speech'
import A11yToolbar from './a11y/A11yToolbar.vue'

const router = useRouter()
const searchQuery = ref('')
const cart = useCartStore()
const adminAuthed = ref(Boolean(localStorage.getItem('admin_access_token')))
const a11y = useA11yStore()
const speech = useSpeechStore()

const tagline = '专业听力解决方案 · 30天无忧试戴 · 7×12小时支持'

const handleSearch = () => {
  const q = searchQuery.value.trim()
  router.push({ path: '/', query: q ? { q } : {} })
}

function goToSupport() {
  router.push({ path: '/', hash: '#support' })
}

function goToCampaign() {
  router.push({ path: '/', hash: '#campaign' })
}

function syncAdminToken() {
  adminAuthed.value = Boolean(localStorage.getItem('admin_access_token'))
}

onMounted(() => {
  cart.init()
  syncAdminToken()
  window.addEventListener('auth:admin_login', syncAdminToken)
  window.addEventListener('auth:logout', syncAdminToken)
  window.addEventListener('storage', (e) => {
    if (e.key === 'admin_access_token') syncAdminToken()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('auth:admin_login', syncAdminToken)
  window.removeEventListener('auth:logout', syncAdminToken)
})

watch(
  () => [speech.listening, speech.partial, speech.transcript] as const,
  ([listening, partial, transcript], [prevListening]) => {
    if (listening) {
      const q = String(partial || transcript || '').trim()
      if (q) searchQuery.value = q
      return
    }
    if (!listening && prevListening) {
      const q = String(transcript || '').trim()
      if (q) handleSearch()
    }
  }
)
</script>

<template>
  <header class="sticky top-0 z-50 bg-[var(--c-surface)] border-b border-[var(--c-border)]">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 bg-[var(--c-surface)] text-[var(--c-text)] border-2 border-[var(--c-border)] rounded-lg px-4 py-2"
    >
      跳到主要内容
    </a>
    <div
      class="container mx-auto px-4 min-h-16 flex items-center justify-between"
      :class="a11y.largeTextEnabled ? 'py-3 flex-wrap gap-3' : 'h-16'"
    >
      <!-- Logo -->
      <div class="flex items-center gap-4 min-w-0">
        <router-link to="/" class="flex items-center space-x-2 a11y-hit no-underline" v-feedback aria-label="返回首页">
          <span class="text-2xl font-extrabold text-[var(--c-primary)] tracking-tight">助听器商城</span>
        </router-link>
        <div class="hidden lg:flex items-center gap-3 min-w-0" aria-label="品牌标语与快捷入口">
          <div class="text-sm font-semibold text-[var(--c-muted)] truncate" :title="tagline">{{ tagline }}</div>
          <div class="h-5 w-px bg-[var(--c-border)] opacity-30" aria-hidden="true" />
          <button
            v-feedback
            type="button"
            class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold text-sm"
            @click="goToCampaign"
            aria-label="查看限时活动"
          >
            活动
          </button>
          <router-link
            to="/recommendations"
            v-feedback
            class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold text-sm no-underline"
            aria-label="打开选购指南"
          >
            指南
          </router-link>
          <button
            v-feedback
            type="button"
            class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold text-sm inline-flex items-center gap-2"
            @click="goToSupport"
            aria-label="查看售后与保障"
          >
            保障
            <ExternalLink class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div
        class="flex-grow"
        :class="a11y.largeTextEnabled ? 'flex w-full order-3' : 'hidden md:flex max-w-md mx-8'"
      >
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索助听器型号、品牌..."
            aria-label="搜索商品"
            autocomplete="off"
            class="w-full pl-10 pr-4 py-2 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] focus:border-[var(--focus-ring)]"
            @keyup.enter="handleSearch"
          />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--c-muted)]" />
        </div>
      </div>

      <!-- Navigation Actions -->
      <div :class="a11y.largeTextEnabled ? 'flex flex-wrap items-center justify-end gap-2' : 'flex items-center space-x-6'">
        <A11yToolbar />

        <router-link
          to="/recommendations"
          class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] font-extrabold"
          v-feedback
          aria-label="个性化推荐"
        >
          推荐
        </router-link>

        <router-link to="/cart" class="relative a11y-hit text-[var(--c-text)]" v-feedback aria-label="购物车">
          <ShoppingCart class="h-6 w-6" />
          <span
            v-if="cart.totalQty > 0"
            class="absolute -top-2 -right-2 bg-[var(--c-danger)] text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center"
            aria-live="polite"
          >
            {{ cart.totalQty }}
          </span>
        </router-link>

        <router-link
          v-if="adminAuthed"
          to="/admin"
          class="a11y-hit text-[var(--c-muted)]"
          title="后台"
          aria-label="后台"
          v-feedback
        >
          <Shield class="h-6 w-6" />
        </router-link>
        
        <router-link to="/profile" class="a11y-hit text-[var(--c-text)]" v-feedback aria-label="个人中心">
          <User class="h-6 w-6" />
        </router-link>
      </div>
    </div>
  </header>
</template>
