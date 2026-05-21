<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useRecoStore } from '../stores/reco'
import { useA11yStore } from '../stores/a11y'
import { useUserAuthStore } from '../stores/userAuth'
import HearingProfileForm from '../components/reco/HearingProfileForm.vue'
import { notify } from '../utils/notify'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const cart = useCartStore()
const reco = useRecoStore()
const a11y = useA11yStore()
const userAuth = useUserAuthStore()
const { t } = useI18n()

const debTimer = ref<number | null>(null)
const autoEnabled = ref(false)
const lastSig = ref('')
const liveText = ref('')

const topItems = computed(() => reco.items.slice(0, 12))
const updatedAt = ref<number | null>(null)

const perfEnabled = computed(() => {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    return params.has('perf')
  } catch {
    return false
  }
})

const firstDataMarked = ref(false)

const filterChips = computed(() => {
  const chips: Array<{ key: string; label: string }> = []
  if (reco.profile.hearing_level) chips.push({ key: 'level', label: `听损：${reco.profile.hearing_level}` })
  if (reco.profile.budget_min != null || reco.profile.budget_max != null) {
    const min = reco.profile.budget_min != null ? `¥${reco.profile.budget_min}` : '不限'
    const max = reco.profile.budget_max != null ? `¥${reco.profile.budget_max}` : '不限'
    chips.push({ key: 'budget', label: `预算：${min} - ${max}` })
  }
  if (reco.profile.scenes.length)
    chips.push({
      key: 'scenes',
      label: `场景：${reco.profile.scenes.slice(0, 2).join('、')}${reco.profile.scenes.length > 2 ? '…' : ''}`
    })
  if (reco.profile.brands.length)
    chips.push({
      key: 'brands',
      label: `品牌：${reco.profile.brands.slice(0, 2).join('、')}${reco.profile.brands.length > 2 ? '…' : ''}`
    })
  return chips
})

const presets = [
  {
    label: '新手入门 · 轻度 · 日常交流',
    profile: {
      hearing_level: '轻度',
      scenes: ['日常交流'],
      budget_min: 1500,
      budget_max: 3000,
      brands: [] as string[]
    }
  },
  {
    label: '电视/会议 · 中度 · 续航优先',
    profile: {
      hearing_level: '中度',
      scenes: ['看电视', '会议'],
      budget_min: 2500,
      budget_max: 4500,
      brands: [] as string[]
    }
  },
  {
    label: '户外/通勤 · 中度 · 降噪优先',
    profile: {
      hearing_level: '中度',
      scenes: ['户外', '通勤'],
      budget_min: 3000,
      budget_max: 6000,
      brands: [] as string[]
    }
  }
]

function scheduleFetch() {
  if (!autoEnabled.value) return
  if (!reco.profile.hearing_level) return
  if (debTimer.value) window.clearTimeout(debTimer.value)
  debTimer.value = window.setTimeout(async () => {
    await refresh()
  }, 200)
}

function signature(items: any[]) {
  return (items || []).map((x) => `${x?.rank}:${x?.product?._id}`).join('|')
}

async function refresh() {
  await reco.fetchRecommendations()
  updatedAt.value = Date.now()
  const sig = signature(reco.items)
  if (sig && sig !== lastSig.value) {
    lastSig.value = sig
    liveText.value = `推荐结果已更新，共 ${reco.items.length} 条`
    await reco.track('impression', {
      meta: { items: reco.items.map((x) => ({ product_id: x.product?._id, rank: x.rank })) }
    })
  }

  if (perfEnabled.value && !firstDataMarked.value && reco.items.length) {
    firstDataMarked.value = true
    try {
      performance.mark('reco:dataReady')
      await nextTick()
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            performance.mark('reco:uiPaint')
            performance.measure('reco:renderDelay', 'reco:dataReady', 'reco:uiPaint')
            const entries = performance.getEntriesByName('reco:renderDelay')
            const last = entries[entries.length - 1] as PerformanceMeasure | undefined
            const ms = Math.round(Number(last?.duration ?? 0))
            console.info('[perf] reco:renderDelayMs', ms)
          } catch {}
        })
      })
    } catch {}
  }
}

async function applyPreset(p: (typeof presets)[number]) {
  reco.profile.hearing_level = p.profile.hearing_level as any
  reco.profile.scenes = [...p.profile.scenes]
  reco.profile.budget_min = p.profile.budget_min
  reco.profile.budget_max = p.profile.budget_max
  reco.profile.brands = [...p.profile.brands]
  reco.persistProfile()
  autoEnabled.value = true
  await refresh()
}

async function openProduct(item: any) {
  await reco.track('click', { product_id: item.product?._id, rank: item.rank })
  router.push(`/product/${item.product?._id}`)
}

function imageOf(p: any) {
  return String(p?.image_url || p?.image || '')
}

async function addFromReco(item: any) {
  const ok = userAuth.verified ? true : await userAuth.verifyUser()
  if (!ok) {
    notify('请先登录后再加入购物车', { tone: 'warning', flash: true })
    router.push({ path: '/login', query: { redirect: '/recommendations' } })
    return
  }
  try {
    await cart.addToCart(String(item.product?._id), 1)
    await reco.track('add_to_cart', { product_id: item.product?._id, rank: item.rank })
    notify('已加入购物车', { tone: 'success' })
  } catch (e: any) {
    notify(e?.response?.data?.message || e?.message || '加入失败', { tone: 'error', flash: true })
  }
}

onMounted(async () => {
  reco.init()
  cart.init()
  if (reco.profile.hearing_level) {
    autoEnabled.value = true
    await refresh()
  }
})

watch(
  () => [
    reco.profile.hearing_level,
    reco.profile.scenes.join(','),
    reco.profile.budget_min,
    reco.profile.budget_max,
    reco.profile.brands.join(',')
  ],
  () => scheduleFetch()
)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-start md:items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-[var(--c-text)]">{{ t('reco.title') }}</h1>
        <div class="text-base font-bold text-[var(--c-muted)] mt-1">{{ t('reco.subtitle') }}</div>
        <div
          v-if="filterChips.length"
          class="mt-3 flex flex-nowrap gap-2 overflow-x-auto"
          aria-label="筛选摘要"
        >
          <span
            v-for="c in filterChips"
            :key="c.key"
            class="px-3 py-1 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-xs font-extrabold text-[var(--c-text)]"
          >
            {{ c.label }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button v-feedback class="a11y-hit" @click="router.push('/')">返回首页</el-button>
        <el-button
          v-feedback
          class="a11y-hit"
          :disabled="!reco.profile.hearing_level"
          @click="((autoEnabled = true), refresh())"
        >
          刷新推荐
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6" :class="a11y.largeTextEnabled ? 'lg:grid-cols-1' : 'lg:grid-cols-3'">
      <div
        class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-6 lg:sticky lg:top-24 h-fit"
      >
        <HearingProfileForm @recommended="((autoEnabled = true), refresh())" />
      </div>

      <div class="lg:col-span-2">
        <div v-if="!reco.profile.hearing_level" class="mb-4 space-y-3">
          <el-alert
            type="info"
            show-icon
            :title="t('reco.needLevel')"
            :description="t('reco.needLevelDesc')"
          />
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" :aria-label="t('reco.presetAria')">
            <button
              v-for="p in presets"
              :key="p.label"
              v-feedback
              type="button"
              class="a11y-hit justify-start text-left rounded-2xl border-2 border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3"
              :aria-label="`应用示例配置：${p.label}`"
              @click="applyPreset(p)"
            >
              <div class="text-sm font-extrabold text-[var(--c-text)]">{{ p.label }}</div>
              <div class="mt-1 text-xs font-semibold text-[var(--c-muted)]">{{ t('reco.presetHint') }}</div>
            </button>
          </div>
        </div>
        <el-alert v-else-if="reco.error" type="error" show-icon :title="reco.error" class="mb-4" />

        <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div class="space-y-1">
              <h2 class="text-xl font-extrabold text-[var(--c-text)]">推荐结果</h2>
              <div class="text-sm font-bold text-[var(--c-muted)]">
                实验分组：{{ reco.variant }}<span v-if="updatedAt"> · 已更新</span>
              </div>
            </div>
            <div class="text-sm font-bold text-[var(--c-muted)]">结果数：{{ topItems.length }}</div>
          </div>

          <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ liveText }}</div>

          <div class="mt-4">
            <div v-if="reco.loading" class="space-y-3">
              <el-skeleton :rows="6" animated />
            </div>

            <el-empty v-else-if="topItems.length === 0" description="暂无推荐结果" />

            <div v-else class="space-y-4">
              <div
                v-for="item in topItems"
                :key="item.product?._id"
                class="rounded-2xl border-2 border-[var(--c-border)] p-4"
              >
                <div class="flex flex-col md:flex-row gap-4">
                  <button
                    type="button"
                    class="w-full md:w-32 md:h-32 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] overflow-hidden"
                    v-feedback
                    :aria-label="`查看详情：${item.product?.name || ''}`"
                    @click="openProduct(item)"
                  >
                    <img
                      v-if="imageOf(item.product)"
                      :src="imageOf(item.product)"
                      :alt="item.product?.name"
                      loading="lazy"
                      decoding="async"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center text-sm font-extrabold text-[var(--c-muted)]"
                    >
                      暂无图片
                    </div>
                  </button>

                  <div class="flex-1 space-y-2">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="text-base font-extrabold text-[var(--c-text)]">
                          #{{ item.rank }} {{ item.product?.name }}
                        </div>
                        <div class="text-sm font-bold text-[var(--c-muted)]">
                          分类：{{ item.product?.category || '-' }} · 价格：¥{{
                            Number(item.product?.price ?? 0).toFixed(0)
                          }}
                          <span v-if="item.product?.stock != null">
                            · 库存：{{ Number(item.product?.stock ?? 0) }}</span
                          >
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <el-button v-feedback class="a11y-hit" @click="openProduct(item)">查看详情</el-button>
                        <el-button type="primary" v-feedback class="a11y-hit" @click="addFromReco(item)"
                          >加入购物车</el-button
                        >
                      </div>
                    </div>
                    <div v-if="Array.isArray(item.reasons) && item.reasons.length" class="pt-1">
                      <div class="text-sm font-extrabold text-[var(--c-text)]">推荐理由</div>
                      <div class="mt-2 flex flex-nowrap gap-2 overflow-x-auto">
                        <span
                          v-for="r in item.reasons"
                          :key="r.factor"
                          class="px-3 py-2 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-sm font-extrabold text-[var(--c-text)]"
                        >
                          {{ r.detail }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
