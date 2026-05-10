<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ExternalLink, Search, Shield, ShoppingCart, Sparkles, User } from 'lucide-vue-next'
import { useCartStore } from '../stores/cart'
import { useA11yStore } from '../stores/a11y'
import { useSpeechStore } from '../stores/speech'
import A11yToolbar from './a11y/A11yToolbar.vue'
import { useTransitionStore } from '@/stores/transition'
import { useAdminAuthStore } from '@/stores/adminAuth'

const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const cart = useCartStore()
const adminAuth = useAdminAuthStore()
const adminAuthed = computed(() => adminAuth.verified)
const a11y = useA11yStore()
const speech = useSpeechStore()
const transition = useTransitionStore()

const handleSearch = () => {
  const q = searchQuery.value.trim()
  router.push({ path: '/', query: q ? { q } : {} })
}

async function goCover() {
  const redirect = route.fullPath
  await transition.run('to-cover', () => router.push({ path: '/cover', query: { redirect } }), { inMs: 200, outMs: 520 })
}

function goToSupport() {
  router.push({ path: '/', hash: '#support' })
}

function goToCampaign() {
  router.push({ path: '/', hash: '#campaign' })
}

onMounted(() => {
  cart.init()
  if (!adminAuth.verified) {
    adminAuth.verifyAdmin()
  }
  window.addEventListener('auth:logout', adminAuth.logout)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth:logout', adminAuth.logout)
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
      {{ $t('nav.skipToContent') }}
    </a>
    <div
      class="container mx-auto px-4 min-h-16 flex items-center justify-between"
      :class="a11y.largeTextEnabled ? 'py-3 flex-nowrap gap-3 overflow-x-auto' : 'h-16'"
    >
      <!-- Logo -->
      <div class="flex items-center gap-4 min-w-0">
        <router-link
          to="/"
          class="flex items-center space-x-2 a11y-hit no-underline"
          v-feedback
          aria-label="返回首页"
        >
          <span class="text-2xl font-extrabold text-[var(--c-primary)] tracking-tight">{{
            $t('app.name')
          }}</span>
        </router-link>
        <div class="hidden lg:flex items-center gap-3 min-w-0" aria-label="快捷入口">
          <button
            v-feedback
            type="button"
            class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold text-sm"
            @click="goToCampaign"
            aria-label="查看今日限时"
          >
            {{ $t('nav.campaign') }}
          </button>
          <router-link
            to="/recommendations"
            v-feedback
            class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold text-sm no-underline"
            aria-label="打开选购指南"
          >
            {{ $t('nav.guide') }}
          </router-link>
          <button
            v-feedback
            type="button"
            class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold text-sm inline-flex items-center gap-2"
            @click="goToSupport"
            aria-label="查看售后与保障"
          >
            {{ $t('nav.support') }}
            <ExternalLink class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div
        class="flex-grow"
        :class="a11y.largeTextEnabled ? 'flex min-w-[18rem] max-w-md mx-2' : 'hidden md:flex max-w-md mx-8'"
      >
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            type="text"
            data-testid="header-search"
            :placeholder="$t('nav.searchPlaceholder')"
            :aria-label="$t('nav.searchLabel')"
            autocomplete="off"
            class="w-full pl-10 pr-4 py-2 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] focus:border-[var(--focus-ring)]"
            @keyup.enter="handleSearch"
          />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 icon-tone--muted" />
        </div>
      </div>

      <!-- Navigation Actions -->
      <div
        :class="
          a11y.largeTextEnabled
            ? 'flex flex-nowrap items-center justify-end gap-2 overflow-x-auto'
            : 'flex items-center space-x-6'
        "
      >
        <A11yToolbar />

        <button
          type="button"
          class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold inline-flex items-center gap-2"
          v-feedback
          :aria-label="$t('nav.cover')"
          @click="goCover"
        >
          <Sparkles class="h-4 w-4 icon-tone--info" aria-hidden="true" />
          {{ $t('nav.cover') }}
        </button>

        <router-link
          to="/activities"
          class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] font-extrabold no-underline"
          v-feedback
          aria-label="活动"
        >
          活动
        </router-link>

        <router-link
          to="/recommendations"
          class="a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] font-extrabold no-underline"
          v-feedback
          aria-label="个性化推荐"
        >
          {{ $t('nav.reco') }}
        </router-link>

        <router-link
          to="/cart"
          data-testid="header-cart-link"
          class="relative a11y-hit text-[var(--c-text)]"
          v-feedback
          aria-label="购物车"
        >
          <ShoppingCart class="h-6 w-6 icon-tone--info" />
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
          <Shield class="h-6 w-6 icon-tone--muted" />
        </router-link>

        <router-link to="/profile" class="a11y-hit text-[var(--c-text)]" v-feedback aria-label="个人中心">
          <User class="h-6 w-6 icon-tone--info" />
        </router-link>
      </div>
    </div>
  </header>
</template>
