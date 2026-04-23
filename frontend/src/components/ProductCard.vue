<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
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

async function addToCart() {
  const token = localStorage.getItem('access_token')
  if (!token) {
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
  <div class="group bg-[var(--c-surface)] rounded-xl overflow-hidden shadow-sm border-2 border-[var(--c-border)]">
    <!-- Image Container -->
    <div class="relative aspect-square overflow-hidden bg-[var(--c-bg)]">
      <router-link :to="`/product/${product.id}`" class="block">
        <img
          :src="product.image"
          :alt="product.name"
          loading="lazy"
          decoding="async"
          class="w-full h-full object-cover"
        />
      </router-link>
      <div class="absolute top-2 left-2 px-2 py-1 bg-[var(--c-surface)] rounded text-sm font-extrabold text-[var(--c-text)] border-2 border-[var(--c-border)]">
        {{ product.category }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <router-link :to="`/product/${product.id}`">
        <h3 class="font-extrabold text-[var(--c-text)] line-clamp-2 min-h-[3rem] mb-2 underline">
          {{ product.name }}
        </h3>
      </router-link>
      
      <div class="flex items-center justify-between mt-auto">
        <div class="flex flex-col">
          <span class="text-sm font-bold text-[var(--c-muted)]">价格</span>
          <span class="text-2xl font-extrabold text-[var(--c-danger)]">¥{{ product.price }}</span>
        </div>
        
        <button
          v-feedback
          class="a11y-hit rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)]"
          title="加入购物车"
          aria-label="加入购物车"
          :disabled="adding"
          @click="addToCart"
        >
          <ShoppingCart class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>
