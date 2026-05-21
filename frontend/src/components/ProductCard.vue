<script setup lang="ts">
import { BadgeCheck, ShieldCheck, ShoppingCart, Star } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useUserAuthStore } from '../stores/userAuth'
import { notify } from '../utils/notify'

const props = defineProps<{
  product: {
    id: string
    name: string
    price: number
    image: string
    category: string
    rating: number
  }
}>()

const router = useRouter()
const route = useRoute()
const adding = ref(false)
const cart = useCartStore()
const userAuth = useUserAuthStore()

function ratingText() {
  const r = Number(props.product.rating ?? 0)
  if (!Number.isFinite(r) || r <= 0) return '暂无评分'
  const rc = Math.max(8, Math.round(r * 120))
  return `评分 ${r.toFixed(1)}（约 ${rc} 条反馈）`
}

async function addToCart() {
  const ok = userAuth.verified ? true : await userAuth.verifyUser()
  if (!ok) {
    notify('请先登录后再加入购物车', { tone: 'warning', flash: true })
    await router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  if (adding.value) return
  adding.value = true
  try {
    await cart.addToCart(props.product.id, 1)
    notify('已加入购物车', { tone: 'success' })
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 401) {
      await router.push({ path: '/login', query: { redirect: route.fullPath } })
    }
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div
    data-testid="product-card"
    :data-product-id="product.id"
    class="group bg-[var(--c-surface)] rounded-xl overflow-hidden shadow-sm border-2 border-[var(--c-border)]"
  >
    <!-- Image Container -->
    <div class="relative aspect-square overflow-hidden bg-[var(--c-bg)]">
      <router-link :to="`/product/${product.id}`" class="block" data-testid="product-card-link">
        <img
          :src="product.image"
          :alt="product.name"
          loading="lazy"
          decoding="async"
          class="w-full h-full object-cover"
        />
      </router-link>
      <div
        class="absolute top-2 left-2 px-2 py-1 bg-[var(--c-surface)] rounded text-sm font-extrabold text-[var(--c-text)] border-2 border-[var(--c-border)]"
      >
        {{ product.category }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 flex flex-col gap-3">
      <router-link :to="`/product/${product.id}`" data-testid="product-card-title-link">
        <h3 class="font-extrabold text-[var(--c-text)] truncate mb-2 underline" :title="product.name">
          {{ product.name }}
        </h3>
      </router-link>

      <div class="flex items-center gap-2" :aria-label="ratingText()">
        <Star class="h-4 w-4 icon-tone--warning" aria-hidden="true" />
        <span class="text-sm font-extrabold text-[var(--c-text)]">{{
          Number(product.rating ?? 0).toFixed(1)
        }}</span>
        <span class="text-xs font-semibold text-[var(--c-muted)]">口碑精选</span>
      </div>

      <div class="flex flex-nowrap gap-2 overflow-x-auto" aria-label="卖点">
        <span
          class="inline-flex items-center gap-1 px-2 py-1 rounded-full border-2 border-[var(--c-border)] text-xs font-extrabold text-[var(--c-text)]"
        >
          <ShieldCheck class="h-3.5 w-3.5 icon-tone--success icon--micro" aria-hidden="true" />
          安心售后
        </span>
        <span
          class="inline-flex items-center gap-1 px-2 py-1 rounded-full border-2 border-[var(--c-border)] text-xs font-extrabold text-[var(--c-text)]"
        >
          <BadgeCheck class="h-3.5 w-3.5 icon-tone--success icon--micro" aria-hidden="true" />
          适老易用
        </span>
        <span
          class="inline-flex items-center gap-1 px-2 py-1 rounded-full border-2 border-[var(--c-border)] text-xs font-extrabold text-[var(--c-text)]"
        >
          <Star class="h-3.5 w-3.5 icon-tone--info icon--micro" aria-hidden="true" />
          清晰降噪
        </span>
      </div>

      <div class="flex items-center justify-between mt-auto pt-1">
        <div class="flex flex-col">
          <span class="text-sm font-bold text-[var(--c-muted)]">价格</span>
          <span class="text-2xl font-extrabold text-[var(--c-danger)]">¥{{ product.price }}</span>
        </div>

        <button
          v-feedback
          data-testid="product-card-add"
          class="a11y-hit rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)]"
          title="加入购物车"
          aria-label="加入购物车"
          :disabled="adding"
          @click="addToCart"
        >
          <ShoppingCart class="h-5 w-5 icon-tone--info" />
        </button>
      </div>
    </div>
  </div>
</template>
