<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import http, { unwrap } from '../../api/http'

type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancel_requested'
  | 'cancelled'
  | 'after_sale_pending'
  | 'after_sale_approved'
  | 'after_sale_rejected'

type OrderItem = {
  product_id?: string
  quantity: number
  unit_price?: number
  name?: string
}

type Order = {
  _id: string
  user_id?: string
  items: OrderItem[]
  total_amount?: number
  status: OrderStatus
  created_at?: string
  after_sale?: any
  shipping_address?: string
  payment?: any
  cancel_request?: any
}

const loading = ref(false)
const forbidden = ref(false)
const error = ref<string | null>(null)
const orders = ref<Order[]>([])

const statusFilter = ref<string>('')
const keyword = ref<string>('')

const filteredOrders = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  const s = statusFilter.value
  return orders.value.filter((o) => {
    if (s && String(o.status) !== s) return false
    if (!k) return true
    const text = `${o._id ?? ''} ${o.user_id ?? ''}`.toLowerCase()
    return text.includes(k)
  })
})

const drawerOpen = ref(false)
const activeOrder = ref<Order | null>(null)

const statusDialogOpen = ref(false)
const statusLoading = ref(false)
const statusForm = reactive<{ orderId: string; status: OrderStatus | '' }>({ orderId: '', status: '' })

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'shipped', label: '已发货' },
  { value: 'delivered', label: '已送达' },
  { value: 'completed', label: '已完成' },
  { value: 'cancel_requested', label: '取消申请中' },
  { value: 'cancelled', label: '已取消' },
  { value: 'after_sale_pending', label: '售后处理中' },
  { value: 'after_sale_approved', label: '售后已通过' },
  { value: 'after_sale_rejected', label: '售后已拒绝' }
]

function statusTagType(status: OrderStatus) {
  if (status === 'paid' || status === 'completed') return 'success'
  if (status === 'shipped' || status === 'delivered') return 'warning'
  if (status === 'after_sale_pending') return 'warning'
  if (status === 'after_sale_approved') return 'success'
  if (status === 'after_sale_rejected') return 'danger'
  if (status === 'cancel_requested') return 'warning'
  if (status === 'cancelled') return 'info'
  return 'default'
}

function statusLabel(status: OrderStatus) {
  return statusOptions.find((s) => s.value === status)?.label ?? status
}

async function fetchOrders() {
  loading.value = true
  forbidden.value = false
  error.value = null
  try {
    const resp = await http.get('/api/admin/orders')
    const data = unwrap<{ orders: any[] }>(resp)
    const list = Array.isArray(data?.orders) ? data.orders : []
    orders.value = list.map((o) => ({
      _id: String(o._id),
      user_id: o.user_id ? String(o.user_id) : undefined,
      items: Array.isArray(o.items)
        ? o.items.map((it: any) => ({
            product_id: it.product_id ? String(it.product_id) : undefined,
            quantity: Number(it.quantity ?? 0),
            unit_price:
              it.unit_price != null ? Number(it.unit_price) : it.price != null ? Number(it.price) : undefined,
            name: it.name ? String(it.name) : undefined
          }))
        : [],
      total_amount: o.total_amount != null ? Number(o.total_amount) : undefined,
      status: (o.status ?? 'pending') as OrderStatus,
      created_at: o.created_at ? String(o.created_at) : undefined,
      after_sale: o.after_sale ?? null,
      shipping_address: o.shipping_address ? String(o.shipping_address) : undefined,
      payment: o.payment ?? null,
      cancel_request: o.cancel_request ?? null
    }))
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 403) forbidden.value = true
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function openDetail(row: Order) {
  activeOrder.value = row
  drawerOpen.value = true
}

async function openStatus(row: Order) {
  statusForm.orderId = row._id
  statusForm.status = row.status
  statusDialogOpen.value = true
}

async function submitStatus() {
  if (!statusForm.orderId || !statusForm.status) return
  statusLoading.value = true
  try {
    await http.put(`/api/admin/orders/${statusForm.orderId}/status`, { status: statusForm.status })
    const target = orders.value.find((o) => o._id === statusForm.orderId)
    if (target) target.status = statusForm.status as OrderStatus
    statusDialogOpen.value = false
  } finally {
    statusLoading.value = false
  }
}

const activeItems = computed(() => activeOrder.value?.items ?? [])

const afterSaleDialogOpen = ref(false)
const afterSaleLoading = ref(false)
const afterSaleForm = reactive<{ orderId: string; status: 'approved' | 'rejected' | ''; remark: string }>({
  orderId: '',
  status: '',
  remark: ''
})

function openAfterSale(row: Order) {
  afterSaleForm.orderId = row._id
  afterSaleForm.status = ''
  afterSaleForm.remark = ''
  afterSaleDialogOpen.value = true
}

async function submitAfterSale() {
  if (!afterSaleForm.orderId || !afterSaleForm.status) return
  afterSaleLoading.value = true
  try {
    await http.put(`/api/admin/orders/${afterSaleForm.orderId}/after_sale`, {
      status: afterSaleForm.status,
      remark: afterSaleForm.remark
    })
    afterSaleDialogOpen.value = false
    await fetchOrders()
  } finally {
    afterSaleLoading.value = false
  }
}

onMounted(fetchOrders)
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div class="text-2xl font-semibold text-gray-900">订单管理</div>
        <div class="text-sm text-gray-500 mt-1">查看订单明细并更新状态</div>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <el-input v-model="keyword" placeholder="搜索订单号/用户ID" style="width: 220px" clearable />
        <el-select v-model="statusFilter" placeholder="状态" style="width: 180px" clearable>
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-button :loading="loading" @click="fetchOrders">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="forbidden"
      type="error"
      show-icon
      title="无权限"
      description="当前账号不是管理员，无法访问订单管理。"
    />
    <el-alert v-else-if="error" type="error" show-icon :title="error" />

    <el-table
      v-loading="loading"
      :data="filteredOrders"
      stripe
      size="small"
      class="bg-white rounded-2xl border"
    >
      <el-table-column prop="_id" label="订单号" min-width="240" show-overflow-tooltip />
      <el-table-column prop="total_amount" label="金额" width="140">
        <template #default="{ row }">¥{{ Number(row.total_amount || 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="140">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" min-width="200">
        <template #default="{ row }">
          <span v-if="row.created_at">{{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDetail(row)">明细</el-button>
          <el-button type="primary" link @click="openStatus(row)">改状态</el-button>
          <el-button v-if="row.status === 'after_sale_pending'" type="danger" link @click="openAfterSale(row)"
            >处理售后</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="drawerOpen" title="订单明细" size="520px">
      <div v-if="activeOrder" class="space-y-4">
        <div class="bg-gray-50 rounded-xl p-4">
          <div class="text-sm text-gray-500">订单号</div>
          <div class="text-sm font-medium text-gray-900 mt-1">{{ activeOrder._id }}</div>
          <div class="text-sm text-gray-500 mt-3">用户ID</div>
          <div class="text-sm text-gray-700 mt-1">{{ activeOrder.user_id || '-' }}</div>
          <div class="text-sm text-gray-500 mt-3">状态</div>
          <div class="mt-1">
            <el-tag :type="statusTagType(activeOrder.status)">{{ statusLabel(activeOrder.status) }}</el-tag>
          </div>
          <div class="text-sm text-gray-500 mt-3">金额</div>
          <div class="text-sm text-gray-700 mt-1">
            ¥{{ Number(activeOrder.total_amount || 0).toFixed(2) }}
          </div>
          <div class="text-sm text-gray-500 mt-3">收货地址</div>
          <div class="text-sm text-gray-700 mt-1">{{ activeOrder.shipping_address || '-' }}</div>
          <div class="text-sm text-gray-500 mt-3">支付</div>
          <div class="text-sm text-gray-700 mt-1">
            {{ activeOrder.payment?.status || '-'
            }}{{ activeOrder.payment?.method ? `(${activeOrder.payment.method})` : '' }}
          </div>
          <div v-if="activeOrder.cancel_request" class="text-sm text-gray-600 mt-3">
            取消原因：{{ activeOrder.cancel_request.reason }}
          </div>
          <div v-if="activeOrder.after_sale" class="text-sm text-gray-600 mt-3">
            售后：{{ activeOrder.after_sale.type }} / {{ activeOrder.after_sale.status }} /
            {{ activeOrder.after_sale.reason }}
          </div>
        </div>

        <el-table :data="activeItems" class="bg-white rounded-2xl border" size="small">
          <el-table-column prop="product_id" label="商品ID" min-width="220" />
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column prop="unit_price" label="单价" width="120">
            <template #default="{ row }">{{
              row.unit_price != null ? `¥${Number(row.unit_price).toFixed(2)}` : '-'
            }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <el-dialog v-model="statusDialogOpen" title="修改订单状态" width="420px" :close-on-click-modal="false">
      <el-select v-model="statusForm.status" class="w-full" placeholder="选择状态">
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
      <template #footer>
        <el-button @click="statusDialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="statusLoading" @click="submitStatus">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="afterSaleDialogOpen" title="处理售后" width="520px" :close-on-click-modal="false">
      <div class="space-y-4">
        <el-select v-model="afterSaleForm.status" class="w-full" placeholder="选择处理结果">
          <el-option label="通过" value="approved" />
          <el-option label="拒绝" value="rejected" />
        </el-select>
        <el-input v-model="afterSaleForm.remark" type="textarea" :rows="4" placeholder="处理备注（可选）" />
      </div>
      <template #footer>
        <el-button @click="afterSaleDialogOpen = false">取消</el-button>
        <el-button
          type="primary"
          :loading="afterSaleLoading"
          :disabled="!afterSaleForm.status"
          @click="submitAfterSale"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
