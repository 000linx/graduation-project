<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bookmark, Hash, Instagram, Mail, MessageCircle, Send, Twitter } from 'lucide-vue-next'
import { notify } from '../../utils/notify'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')

const tags = [
  { label: '隐形式', q: '隐形' },
  { label: '耳背式', q: '耳背' },
  { label: '充电续航', q: '充电' },
  { label: '降噪', q: '降噪' },
  { label: '老人易用', q: '老人' },
  { label: '轻便', q: '轻便' }
]

const social = [
  { label: '微信公众号', icon: MessageCircle },
  { label: '微博', icon: Twitter },
  { label: '小红书', icon: Instagram }
]

const canSubmit = computed(() => email.value.trim().length > 0)

function subscribe() {
  const v = email.value.trim()
  if (!v) return
  email.value = ''
  notify('订阅成功：后续活动与选购指南将推送到你的邮箱', { tone: 'success' })
}

function goTag(q: string) {
  router.push({ path: '/', query: { q } })
}

function openSocial(name: string) {
  notify(`${name} 链接已准备好（演示环境未配置外链）`, { tone: 'info' })
}
</script>

<template>
  <aside class="space-y-4" aria-label="侧边栏">
    <section class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center">
          <Mail class="h-5 w-5" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <div class="text-base font-extrabold text-[var(--c-text)]">订阅活动与指南</div>
          <div class="text-sm font-semibold text-[var(--c-muted)] truncate">每周 1-2 封，不打扰</div>
        </div>
      </div>
      <div class="mt-4 flex gap-2">
        <input
          v-model="email"
          class="min-w-0 flex-1 h-11 px-3 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-semibold"
          placeholder="输入邮箱"
          inputmode="email"
          autocomplete="email"
          aria-label="订阅邮箱"
          @keydown.enter.prevent="subscribe"
        />
        <button
          type="button"
          class="h-11 px-4 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-primary)] text-[var(--c-on-primary)] font-extrabold"
          :disabled="!canSubmit"
          aria-label="提交订阅"
          @click="subscribe"
        >
          <Send class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div class="mt-3 text-xs font-semibold text-[var(--c-muted)]">
        你可以在个人中心随时关闭通知
      </div>
    </section>

    <section class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center">
          <Bookmark class="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div class="text-base font-extrabold text-[var(--c-text)]">辅助导航</div>
          <div class="text-sm font-semibold text-[var(--c-muted)]">更快到达关键页面</div>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <router-link
          to="/recommendations"
          v-feedback
          class="a11y-hit justify-center rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold no-underline"
          aria-label="打开个性化推荐"
        >
          去推荐
        </router-link>
        <router-link
          to="/cart"
          v-feedback
          class="a11y-hit justify-center rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold no-underline"
          aria-label="打开购物车"
        >
          看购物车
        </router-link>
        <router-link
          to="/profile"
          v-feedback
          class="a11y-hit justify-center rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold no-underline"
          aria-label="打开个人中心"
        >
          个人中心
        </router-link>
        <a
          href="#support"
          v-feedback
          class="a11y-hit justify-center rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] font-extrabold no-underline"
          aria-label="跳到售后支持"
        >
          售后支持
        </a>
      </div>
    </section>

    <section class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5" aria-label="热门标签">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center">
          <Hash class="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div class="text-base font-extrabold text-[var(--c-text)]">热门标签</div>
          <div class="text-sm font-semibold text-[var(--c-muted)]">一键筛选</div>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="t in tags"
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
    </section>

    <section class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5" aria-label="社交媒体">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center">
          <MessageCircle class="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div class="text-base font-extrabold text-[var(--c-text)]">关注我们</div>
          <div class="text-sm font-semibold text-[var(--c-muted)]">获取使用技巧与活动</div>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-3 gap-2">
        <button
          v-for="s in social"
          :key="s.label"
          v-feedback
          type="button"
          class="a11y-hit rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)]"
          :aria-label="`打开${s.label}`"
          @click="openSocial(s.label)"
        >
          <component :is="s.icon" class="h-5 w-5 mx-auto" aria-hidden="true" />
          <span class="sr-only">{{ s.label }}</span>
        </button>
      </div>
    </section>
  </aside>
</template>
