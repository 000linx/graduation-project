<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import http, { unwrap } from '../api/http'
import { notify } from '../utils/notify'
import { useRecoStore } from '../stores/reco'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const reco = useRecoStore()
const cart = useCartStore()
const loading = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)

type Address = {
  _id: string
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  label?: string
  is_default?: boolean
}

const addresses = ref<Address[]>([])
const addressLoading = ref(false)
const selectedAddressId = ref('')

const payMethod = ref<'wechat' | 'alipay' | 'card'>('wechat')
const couponCode = ref<string>('')

const couponOptions = [
  { label: 'OFF10 · 9折', value: 'OFF10' },
  { label: 'OFF50 · 立减50', value: 'OFF50' }
]

const form = reactive({
  shipping_address: ''
})

const orderRows = computed(() => {
  return cart.items.map((it) => {
    const p = cart.products[it.product_id]
    const name = String(p?.name ?? it.product_id)
    const unit = Number(p?.price ?? 0)
    const qty = Number(it.quantity ?? 0)
    return {
      product_id: it.product_id,
      name,
      unit_price: unit,
      quantity: qty,
      subtotal: unit * qty
    }
  })
})

const totalAmount = computed(() => orderRows.value.reduce((sum, r) => sum + r.subtotal, 0))
const couponDiscount = computed(() => {
  const code = String(couponCode.value || '').trim().toUpperCase()
  if (!code) return 0
  if (code === 'OFF10') return Math.min(totalAmount.value * 0.1, totalAmount.value)
  if (code === 'OFF50') return Math.min(50, totalAmount.value)
  return 0
})
const payableAmount = computed(() => Math.max(totalAmount.value - couponDiscount.value, 0))

const canSubmit = computed(() => cart.items.length > 0 && form.shipping_address.trim().length > 0)

function formatAddress(a: Address) {
  const label = a.label ? `${a.label} · ` : ''
  return `${label}${a.receiver} ${a.phone}，${a.province}${a.city}${a.district}${a.detail}`
}

async function fetchCart() {
  loading.value = true
  error.value = null
  try {
    await cart.fetchCart()
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function fetchAddresses() {
  addressLoading.value = true
  try {
    const resp = await http.get('/api/user/addresses')
    const data = unwrap<{ addresses: any[] }>(resp)
    const raw = Array.isArray(data?.addresses) ? data.addresses : []
    addresses.value = raw
      .map((x) => ({
        _id: String(x?._id ?? x?.id ?? ''),
        receiver: String(x?.receiver ?? ''),
        phone: String(x?.phone ?? ''),
        province: String(x?.province ?? ''),
        city: String(x?.city ?? ''),
        district: String(x?.district ?? ''),
        detail: String(x?.detail ?? ''),
        label: x?.label ? String(x.label) : undefined,
        is_default: Boolean(x?.is_default)
      }))
      .filter((x) => x._id)

    const def = addresses.value.find((x) => x.is_default)
    if (def && !selectedAddressId.value) selectedAddressId.value = def._id
  } catch {
    addresses.value = []
  } finally {
    addressLoading.value = false
  }
}

async function submitOrder() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const payload = {
      shipping_address: form.shipping_address.trim(),
      items: cart.items.map((x) => ({ product_id: x.product_id, quantity: x.quantity })),
      pay_method: payMethod.value,
      coupon_code: couponCode.value ? String(couponCode.value).trim() : undefined
    }
    await http.post('/api/order/create', payload)
    await reco.track('purchase', { meta: { items: payload.items } })
    notify('订单创建成功', { tone: 'success' })
    await router.replace('/profile')
  } catch (e: any) {
    notify(e?.response?.data?.message || e?.message || '创建订单失败', { tone: 'error', flash: true })
  } finally {
    submitting.value = false
  }
}

watch(
  () => selectedAddressId.value,
  (id) => {
    if (!id) return
    const a = addresses.value.find((x) => x._id === id)
    if (!a) return
    form.shipping_address = formatAddress(a)
  }
)

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    await cart.init()
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
  await fetchAddresses()
})
</script>

<template>
  <div class="max-w-6xl mx-auto py-10 px-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-3xl font-extrabold text-[var(--c-text)]">订单结算</h1>
        <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
          确认商品与收货信息，然后选择支付方式提交订单。
        </div>
      </div>
      <el-button @click="fetchCart" :loading="loading">刷新购物车</el-button>
    </div>

    <el-steps :active="1" finish-status="success" class="mb-6" aria-label="结算步骤">
      <el-step title="结算" />
      <el-step title="支付" />
      <el-step title="完成" />
    </el-steps>

    <el-alert v-if="error" type="error" show-icon :title="error" class="mb-6" />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section
        class="lg:col-span-7 bg-[var(--c-surface)] rounded-3xl p-6 shadow-sm border-2 border-[var(--c-border)] space-y-6"
        aria-label="收货与支付"
      >
        <div>
          <div class="text-lg font-extrabold text-[var(--c-text)]">收货信息</div>
          <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
            如果你已在个人中心维护地址，可直接选择自动填充。
          </div>
        </div>

        <div v-if="addresses.length" class="space-y-2">
          <div class="text-sm font-semibold text-[var(--c-muted)]">选择地址</div>
          <el-select
            v-model="selectedAddressId"
            placeholder="选择默认/最近使用地址"
            style="width: 100%"
            :loading="addressLoading"
          >
            <el-option v-for="a in addresses" :key="a._id" :label="formatAddress(a)" :value="a._id" />
          </el-select>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-semibold text-[var(--c-muted)]">详细地址</div>
          <el-input
            v-model="form.shipping_address"
            data-testid="checkout-shipping-address"
            type="textarea"
            :rows="3"
            placeholder="请输入收货地址"
          />
        </div>

        <div class="pt-4 border-t border-[var(--c-border)]/30 space-y-3" aria-label="支付方式">
          <div class="text-lg font-extrabold text-[var(--c-text)]">支付方式</div>
          <el-radio-group v-model="payMethod">
            <el-radio-button label="wechat">微信支付</el-radio-button>
            <el-radio-button label="alipay">支付宝</el-radio-button>
            <el-radio-button label="card">银行卡</el-radio-button>
          </el-radio-group>
          <div class="text-xs font-semibold text-[var(--c-muted)]">
            演示环境为模拟支付，提交订单后可在个人中心查看状态。
          </div>
        </div>

        <div class="pt-4 border-t border-[var(--c-border)]/30 space-y-3" aria-label="优惠券">
          <div class="text-lg font-extrabold text-[var(--c-text)]">优惠券</div>
          <el-select v-model="couponCode" placeholder="选择优惠券（可选）" style="width: 100%">
            <el-option label="不使用优惠券" value="" />
            <el-option v-for="c in couponOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
          <div class="text-xs font-semibold text-[var(--c-muted)]">演示用优惠券：OFF10 / OFF50</div>
        </div>
      </section>

      <section
        class="lg:col-span-5 bg-[var(--c-surface)] rounded-3xl p-6 shadow-sm border-2 border-[var(--c-border)] space-y-4"
        aria-label="订单确认"
      >
        <div class="flex items-center justify-between">
          <div class="text-lg font-extrabold text-[var(--c-text)]">商品清单</div>
          <div class="text-sm font-semibold text-[var(--c-muted)]">{{ cart.items.length }} 项</div>
        </div>

        <el-table
          v-loading="loading"
          :data="orderRows"
          stripe
          class="border rounded-xl"
          size="small"
          :empty-text="loading ? '加载中' : '购物车为空'"
        >
          <el-table-column prop="name" label="商品" min-width="180" show-overflow-tooltip />
          <el-table-column prop="unit_price" label="单价" width="110">
            <template #default="{ row }">¥{{ Number(row.unit_price ?? 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="90" />
          <el-table-column prop="subtotal" label="小计" width="120">
            <template #default="{ row }">¥{{ Number(row.subtotal ?? 0).toFixed(2) }}</template>
          </el-table-column>
        </el-table>

        <div
          class="pt-3 border-t border-[var(--c-border)]/30 space-y-2 text-sm font-semibold text-[var(--c-muted)]"
        >
          <div class="flex items-center justify-between">
            <span>商品金额</span>
            <span class="text-[var(--c-text)] font-extrabold">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
          <div class="flex items-center justify-between" v-if="couponDiscount > 0">
            <span>优惠券</span>
            <span class="text-[var(--c-text)] font-extrabold">-¥{{ couponDiscount.toFixed(2) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>运费</span>
            <span class="text-[var(--c-text)] font-extrabold">¥0.00</span>
          </div>
          <div class="flex items-center justify-between text-base">
            <span>应付</span>
            <span class="text-[var(--c-text)] font-extrabold">¥{{ payableAmount.toFixed(2) }}</span>
          </div>
        </div>

        <el-button
          type="primary"
          data-testid="checkout-submit"
          class="w-full"
          :disabled="!canSubmit"
          :loading="submitting"
          @click="submitOrder"
        >
          提交订单
        </el-button>
        <div class="text-xs font-semibold text-[var(--c-muted)]">
          提交即代表你同意服务条款与隐私政策（演示）。
        </div>
      </section>
    </div>
  </div>
</template>
