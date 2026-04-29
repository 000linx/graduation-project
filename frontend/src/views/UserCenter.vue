<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-6 shadow-sm">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="text-2xl font-extrabold text-[var(--c-text)]">个人中心</div>
          <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
            <span v-if="profile.username">{{ profile.username }}</span>
            <span v-if="profile.phone">（{{ profile.phone }}）</span>
            <span v-if="!hasToken">未登录</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <el-button v-if="hasToken" :loading="logoutLoading" @click="logout">退出登录</el-button>
          <el-button v-else type="primary" @click="goHome">返回首页</el-button>
        </div>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="个人中心概览">
      <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-5 shadow-sm">
        <div class="text-sm font-semibold text-[var(--c-muted)]">待支付</div>
        <div class="mt-1 text-2xl font-extrabold text-[var(--c-text)]">
          {{ hasToken ? pendingCount : '-' }}
        </div>
        <div class="mt-3">
          <el-button :disabled="!hasToken" type="primary" plain @click="activeTab = 'orders'"
            >查看订单</el-button
          >
        </div>
      </div>

      <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-5 shadow-sm">
        <div class="text-sm font-semibold text-[var(--c-muted)]">售后处理中</div>
        <div class="mt-1 text-2xl font-extrabold text-[var(--c-text)]">
          {{ hasToken ? afterSalePendingCount : '-' }}
        </div>
        <div class="mt-3">
          <el-button :disabled="!hasToken" type="warning" plain @click="activeTab = 'orders'"
            >进入售后</el-button
          >
        </div>
      </div>

      <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-5 shadow-sm">
        <div class="text-sm font-semibold text-[var(--c-muted)]">默认地址</div>
        <div class="mt-1 text-base font-extrabold text-[var(--c-text)] truncate" :title="defaultAddressText">
          {{ hasToken ? defaultAddressText : '-' }}
        </div>
        <div class="mt-3">
          <el-button :disabled="!hasToken" type="success" plain @click="activeTab = 'address'"
            >管理地址</el-button
          >
        </div>
      </div>
    </div>

    <div class="mt-6 bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl shadow-sm">
      <el-tabs v-model="activeTab" class="px-4">
        <el-tab-pane label="我的订单" name="orders">
          <div class="py-4 space-y-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="text-sm font-semibold text-[var(--c-muted)]">
                支持状态筛选、详情查看、支付、取消、评价与售后。
              </div>
              <div class="flex items-center gap-3">
                <el-select
                  v-model="orderStatus"
                  placeholder="订单状态"
                  style="width: 180px"
                  @change="fetchOrders"
                >
                  <el-option label="全部" value="" />
                  <el-option label="待支付" value="pending" />
                  <el-option label="已支付" value="paid" />
                  <el-option label="已发货" value="shipped" />
                  <el-option label="已送达" value="delivered" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="取消申请中" value="cancel_requested" />
                  <el-option label="已取消" value="cancelled" />
                  <el-option label="售后处理中" value="after_sale_pending" />
                  <el-option label="售后已通过" value="after_sale_approved" />
                  <el-option label="售后已拒绝" value="after_sale_rejected" />
                </el-select>
                <el-button :loading="ordersLoading" @click="fetchOrders">刷新</el-button>
              </div>
            </div>

            <el-alert
              v-if="!hasToken"
              type="warning"
              show-icon
              title="未登录"
              description="请先登录后查看订单。"
            />
            <el-alert v-else-if="ordersError" type="error" show-icon :title="ordersError" />

            <el-table
              v-loading="ordersLoading"
              :data="orders"
              stripe
              size="small"
              class="bg-[var(--c-surface)] rounded-2xl border"
              :empty-text="hasToken ? '暂无订单' : '未登录'"
            >
              <el-table-column prop="_id" label="订单号" min-width="220" show-overflow-tooltip />
              <el-table-column prop="total_amount" label="金额" width="140">
                <template #default="{ row }">¥{{ Number(row.total_amount ?? 0).toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="140">
                <template #default="{ row }">
                  <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" min-width="180" show-overflow-tooltip />
              <el-table-column label="操作" width="260" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openDetail(row._id)">详情</el-button>
                  <el-button v-if="row.status === 'pending'" link type="success" @click="openPay(row._id)"
                    >支付</el-button
                  >
                  <el-button v-if="canCancel(row.status)" link type="warning" @click="cancelOrder(row._id)"
                    >取消</el-button
                  >
                  <el-button
                    v-if="row.status === 'delivered'"
                    link
                    type="primary"
                    @click="openReview(row._id)"
                    >评价</el-button
                  >
                  <el-button v-if="canAfterSale(row)" link type="danger" @click="openAfterSale(row._id)"
                    >售后</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="个人资料" name="profile">
          <div class="py-6">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户名">{{ profile.username || '-' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ profile.phone || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="通知管理" name="notifications">
          <div class="py-6 max-w-2xl space-y-4">
            <el-alert
              v-if="!hasToken"
              type="warning"
              show-icon
              title="未登录"
              description="请先登录后管理通知设置。"
            />
            <div v-else class="space-y-4">
              <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div class="text-base font-extrabold text-[var(--c-text)]">通知偏好</div>
                  <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
                    关闭后将不会收到对应渠道的提醒（立即生效，重新登录后仍保持）。
                  </div>
                </div>
                <el-button
                  :disabled="notifLoading || notifSaving"
                  type="danger"
                  plain
                  aria-label="一键关闭所有通知"
                  @click="disableAllNotifications"
                >
                  一键关闭
                </el-button>
              </div>

              <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5">
                <div class="flex items-center justify-between gap-4 py-2">
                  <div class="min-w-0">
                    <div class="font-extrabold text-[var(--c-text)]">邮件通知</div>
                    <div class="text-sm font-semibold text-[var(--c-muted)]">活动订阅、订单状态等邮件提醒</div>
                  </div>
                  <el-switch
                    v-model="notif.email_notifications"
                    :loading="notifLoading"
                    :disabled="notifLoading"
                    aria-label="切换邮件通知"
                    @change="scheduleNotifSave"
                  />
                </div>

                <div class="h-px bg-[var(--c-border)]/20 my-3" />

                <div class="flex items-center justify-between gap-4 py-2">
                  <div class="min-w-0">
                    <div class="font-extrabold text-[var(--c-text)]">站内消息</div>
                    <div class="text-sm font-semibold text-[var(--c-muted)]">站内提示与重要消息提醒</div>
                  </div>
                  <el-switch
                    v-model="notif.in_app_notifications"
                    :loading="notifLoading"
                    :disabled="notifLoading"
                    aria-label="切换站内消息"
                    @change="scheduleNotifSave"
                  />
                </div>

                <div class="h-px bg-[var(--c-border)]/20 my-3" />

                <div class="flex items-center justify-between gap-4 py-2">
                  <div class="min-w-0">
                    <div class="font-extrabold text-[var(--c-text)]">活动提醒</div>
                    <div class="text-sm font-semibold text-[var(--c-muted)]">限时活动、倒计时与促销提醒</div>
                  </div>
                  <el-switch
                    v-model="notif.activity_reminders"
                    :loading="notifLoading"
                    :disabled="notifLoading"
                    aria-label="切换活动提醒"
                    @change="scheduleNotifSave"
                  />
                </div>
              </div>

              <div
                class="text-sm font-semibold"
                :class="notifSaving ? 'text-[var(--c-muted)]' : 'text-[var(--c-success)]'"
                role="status"
                aria-live="polite"
              >
                <span v-if="notifSaving">正在保存…</span>
                <span v-else>设置已保存</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="账户安全" name="security">
          <div class="py-6 max-w-xl">
            <el-alert
              v-if="!hasToken"
              type="warning"
              show-icon
              title="未登录"
              description="请先登录后修改密码。"
              class="mb-4"
            />

            <div v-else class="space-y-4">
              <div>
                <div class="text-base font-extrabold text-[var(--c-text)]">修改密码</div>
                <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
                  修改成功后会自动退出，需要重新登录。
                </div>
              </div>

              <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="96px" status-icon>
                <el-form-item label="原密码" prop="old_password">
                  <el-input
                    v-model="pwdForm.old_password"
                    type="password"
                    show-password
                    autocomplete="current-password"
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="new_password">
                  <el-input
                    v-model="pwdForm.new_password"
                    type="password"
                    show-password
                    autocomplete="new-password"
                  />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirm_password">
                  <el-input
                    v-model="pwdForm.confirm_password"
                    type="password"
                    show-password
                    autocomplete="new-password"
                  />
                </el-form-item>
                <el-form-item>
                  <div class="flex items-center gap-3">
                    <el-button type="primary" :loading="pwdSubmitting" @click="submitChangePassword"
                      >保存</el-button
                    >
                    <el-button :disabled="pwdSubmitting" @click="resetPwdForm">重置</el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="收货地址" name="address">
          <div class="py-4 space-y-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="text-sm font-semibold text-[var(--c-muted)]">
                支持新增、编辑、删除与默认地址设置。
              </div>
              <div class="flex items-center gap-3">
                <el-button :disabled="!hasToken" type="primary" @click="openAddAddress">新增地址</el-button>
                <el-button :loading="addressLoading" :disabled="!hasToken" @click="fetchAddresses"
                  >刷新</el-button
                >
              </div>
            </div>

            <el-alert
              v-if="!hasToken"
              type="warning"
              show-icon
              title="未登录"
              description="请先登录后管理收货地址。"
            />
            <el-alert v-else-if="addressError" type="error" show-icon :title="addressError" />

            <el-table
              v-loading="addressLoading"
              :data="addresses"
              stripe
              size="small"
              class="bg-[var(--c-surface)] rounded-2xl border"
              :empty-text="hasToken ? '暂无地址' : '未登录'"
            >
              <el-table-column label="收货人" min-width="120">
                <template #default="{ row }">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{{ row.receiver }}</span>
                    <el-tag v-if="row.is_default" type="success">默认</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="phone" label="手机号" width="140" />
              <el-table-column label="地址" min-width="260" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.province }}{{ row.city }}{{ row.district }}{{ row.detail }}
                </template>
              </el-table-column>
              <el-table-column prop="label" label="标签" width="120" />
              <el-table-column label="操作" width="240" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEditAddress(row)">编辑</el-button>
                  <el-button link type="danger" @click="removeAddress(row)">删除</el-button>
                  <el-button v-if="!row.is_default" link type="success" @click="setDefault(row)"
                    >设为默认</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <el-drawer v-model="detailOpen" title="订单详情" size="520px">
    <div v-if="detailLoading" class="text-gray-500">正在加载...</div>
    <el-alert v-else-if="detailError" type="error" show-icon :title="detailError" />
    <div v-else-if="orderDetail" class="space-y-4">
      <div class="text-sm font-semibold text-[var(--c-muted)]">订单号：{{ orderDetail._id }}</div>
      <div class="flex items-center justify-between">
        <div class="text-lg font-extrabold text-[var(--c-text)]">
          金额：¥{{ Number(orderDetail.total_amount ?? 0).toFixed(2) }}
        </div>
        <el-tag :type="statusTagType(orderDetail.status)">{{ statusLabel(orderDetail.status) }}</el-tag>
      </div>
      <div class="text-sm font-semibold text-[var(--c-muted)]">
        收货地址：{{ orderDetail.shipping_address || '-' }}
      </div>
      <div class="text-sm font-semibold text-[var(--c-muted)]">支付：{{ paymentText }}</div>
      <div v-if="orderDetail.cancel_request" class="text-sm font-semibold text-[var(--c-muted)]">
        取消原因：{{ orderDetail.cancel_request.reason }}
      </div>
      <div v-if="orderDetail.after_sale" class="text-sm font-semibold text-[var(--c-muted)]">
        售后：{{ orderDetail.after_sale.type }} / {{ orderDetail.after_sale.status }} /
        {{ orderDetail.after_sale.reason }}
      </div>
      <div v-if="orderDetail.review" class="text-sm font-semibold text-[var(--c-muted)]">
        评价：{{ orderDetail.review.rating }} 星 / {{ orderDetail.review.content }}
      </div>
      <div class="text-base font-extrabold text-[var(--c-text)] mt-4">商品项</div>
      <el-table :data="orderDetail.items || []" stripe size="small" class="border rounded-xl">
        <el-table-column prop="name" label="商品" min-width="160" show-overflow-tooltip />
        <el-table-column prop="product_id" label="商品ID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="unit_price" label="单价" width="120">
          <template #default="{ row }">¥{{ Number(row.unit_price ?? 0).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>

  <el-dialog v-model="payOpen" title="订单支付" width="420px">
    <div class="space-y-4">
      <el-select v-model="payMethod" placeholder="选择支付方式" style="width: 100%">
        <el-option label="微信支付" value="wechat" />
        <el-option label="支付宝" value="alipay" />
      </el-select>
    </div>
    <template #footer>
      <el-button @click="payOpen = false">取消</el-button>
      <el-button type="primary" :loading="payLoading" :disabled="!payMethod" @click="submitPay"
        >确认支付</el-button
      >
    </template>
  </el-dialog>

  <el-dialog v-model="reviewOpen" title="订单评价" width="520px">
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="text-sm text-gray-600 w-16">评分</div>
        <el-rate v-model="reviewForm.rating" />
      </div>
      <el-input v-model="reviewForm.content" type="textarea" :rows="4" placeholder="请输入评价内容" />
    </div>
    <template #footer>
      <el-button @click="reviewOpen = false">取消</el-button>
      <el-button type="primary" :loading="reviewLoading" @click="submitReview">提交</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="afterSaleOpen" title="售后申请" width="520px">
    <div class="space-y-4">
      <el-select v-model="afterSaleForm.type" placeholder="选择售后类型" style="width: 100%">
        <el-option label="仅退款" value="refund" />
        <el-option label="退货退款" value="return" />
        <el-option label="维修" value="repair" />
      </el-select>
      <el-input v-model="afterSaleForm.reason" type="textarea" :rows="4" placeholder="请输入售后原因" />
    </div>
    <template #footer>
      <el-button @click="afterSaleOpen = false">取消</el-button>
      <el-button
        type="primary"
        :loading="afterSaleLoading"
        :disabled="!afterSaleForm.type"
        @click="submitAfterSale"
        >提交</el-button
      >
    </template>
  </el-dialog>

  <el-drawer v-model="addressOpen" :title="addressEditingId ? '编辑地址' : '新增地址'" size="520px">
    <el-alert
      v-if="!hasToken"
      type="warning"
      show-icon
      title="未登录"
      description="请先登录后管理收货地址。"
      class="mb-4"
    />

    <el-form
      v-else
      ref="addressFormRef"
      :model="addressForm"
      :rules="addressRules"
      label-position="top"
      status-icon
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <el-form-item label="收货人" prop="receiver">
          <el-input v-model="addressForm.receiver" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="addressForm.phone"
            placeholder="请输入手机号"
            inputmode="numeric"
            autocomplete="tel"
          />
        </el-form-item>
        <el-form-item label="省份" prop="province">
          <el-input v-model="addressForm.province" placeholder="如：北京市" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="addressForm.city" placeholder="如：北京市" />
        </el-form-item>
        <el-form-item label="区/县" prop="district">
          <el-input v-model="addressForm.district" placeholder="如：海淀区" />
        </el-form-item>
        <el-form-item label="标签" prop="label">
          <el-input v-model="addressForm.label" placeholder="如：家/公司（可选）" />
        </el-form-item>
      </div>
      <el-form-item label="详细地址" prop="detail">
        <el-input v-model="addressForm.detail" type="textarea" :rows="3" placeholder="街道、门牌号等" />
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="addressForm.is_default">设为默认地址</el-checkbox>
      </el-form-item>
      <el-form-item>
        <div class="flex items-center gap-3">
          <el-button type="primary" :loading="addressSaving" @click="saveAddress">保存</el-button>
          <el-button :disabled="addressSaving" @click="resetAddressForm">重置</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import http, { unwrap } from '../api/http'

const router = useRouter()
const activeTab = ref<'orders' | 'profile' | 'notifications' | 'security' | 'address'>('orders')

const hasToken = ref(false)
const logoutLoading = ref(false)

const profile = reactive<{ username: string; phone: string }>({ username: '', phone: '' })

type NotificationSettings = {
  email_notifications: boolean
  in_app_notifications: boolean
  activity_reminders: boolean
}

const notifLoading = ref(false)
const notifSaving = ref(false)
const notif = reactive<NotificationSettings>({
  email_notifications: true,
  in_app_notifications: true,
  activity_reminders: true
})
let notifPending: NotificationSettings | null = null

type Order = {
  _id: string
  status: string
  total_amount?: number
  created_at?: string
  after_sale?: any
}

const orderStatus = ref<string>('')
const ordersLoading = ref(false)
const ordersError = ref<string | null>(null)
const orders = ref<Order[]>([])

const detailOpen = ref(false)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)
const orderDetail = ref<any | null>(null)

const payOpen = ref(false)
const payLoading = ref(false)
const payOrderId = ref<string | null>(null)
const payMethod = ref<string>('')

const reviewOpen = ref(false)
const reviewLoading = ref(false)
const reviewOrderId = ref<string | null>(null)
const reviewForm = reactive({ rating: 5, content: '' })

const afterSaleOpen = ref(false)
const afterSaleLoading = ref(false)
const afterSaleOrderId = ref<string | null>(null)
const afterSaleForm = reactive({ type: '', reason: '' })

const pwdFormRef = ref<FormInstance>()
const pwdSubmitting = ref(false)
const pwdForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const pwdRules: FormRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== pwdForm.new_password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

type Address = {
  _id: string
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  label?: string
  is_default: boolean
}

const addressLoading = ref(false)
const addressError = ref<string | null>(null)
const addresses = ref<Address[]>([])

const pendingCount = computed(() => {
  return orders.value.filter((o) => String(o.status) === 'pending').length
})

const afterSalePendingCount = computed(() => {
  return orders.value.filter((o) => String(o.status) === 'after_sale_pending').length
})

const defaultAddressText = computed(() => {
  const d = addresses.value.find((a) => a.is_default)
  if (!d) return '暂无默认地址'
  const label = d.label ? `${d.label} · ` : ''
  return `${label}${d.province}${d.city}${d.district}${d.detail}`
})

const addressOpen = ref(false)
const addressSaving = ref(false)
const addressEditingId = ref<string | null>(null)
const addressFormRef = ref<FormInstance>()
const addressForm = reactive({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  label: '',
  is_default: false
})

const addressRules: FormRules = {
  receiver: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const v = String(value || '').trim()
        if (!/^1\d{10}$/.test(v)) callback(new Error('请输入 11 位手机号'))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  district: [{ required: true, message: '请输入区/县', trigger: 'blur' }],
  detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const paymentText = computed(() => {
  const p = orderDetail.value?.payment
  if (!p) return '-'
  const s = p.status || '-'
  const m = p.method ? `(${p.method})` : ''
  return `${s}${m}`
})

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    shipped: '已发货',
    delivered: '已送达',
    completed: '已完成',
    cancel_requested: '取消申请中',
    cancelled: '已取消',
    after_sale_pending: '售后处理中',
    after_sale_approved: '售后已通过',
    after_sale_rejected: '售后已拒绝'
  }
  return map[String(status)] ?? String(status)
}

function statusTagType(status: string) {
  const s = String(status)
  if (s === 'paid' || s === 'completed') return 'success'
  if (s === 'shipped' || s === 'delivered' || s === 'after_sale_pending') return 'warning'
  if (s === 'after_sale_rejected') return 'danger'
  if (s === 'cancelled') return 'info'
  return 'default'
}

function canCancel(status: string) {
  return !['cancelled', 'completed', 'cancel_requested'].includes(String(status))
}

function canAfterSale(order: any) {
  const status = String(order?.status || '')
  if (order?.after_sale) return false
  return ['paid', 'shipped', 'delivered', 'completed'].includes(status)
}

async function fetchProfile() {
  if (!hasToken.value) return
  try {
    const resp = await http.get('/api/user/profile')
    const data = unwrap<{ username?: string; phone?: string; notification_settings?: NotificationSettings }>(resp)
    profile.username = String(data?.username ?? '')
    profile.phone = String(data?.phone ?? '')
    const s = data?.notification_settings
    if (s && typeof s === 'object') {
      notif.email_notifications = Boolean((s as any).email_notifications)
      notif.in_app_notifications = Boolean((s as any).in_app_notifications)
      notif.activity_reminders = Boolean((s as any).activity_reminders)
    }
  } catch {
    profile.username = ''
    profile.phone = ''
  }
}

async function fetchNotificationSettings() {
  if (!hasToken.value) return
  notifLoading.value = true
  try {
    const resp = await http.get('/api/user/notification_settings')
    const data = unwrap<{ notification_settings?: NotificationSettings }>(resp)
    const s = data?.notification_settings
    if (s && typeof s === 'object') {
      notif.email_notifications = Boolean((s as any).email_notifications)
      notif.in_app_notifications = Boolean((s as any).in_app_notifications)
      notif.activity_reminders = Boolean((s as any).activity_reminders)
    }
  } catch {
  } finally {
    notifLoading.value = false
  }
}

function scheduleNotifSave() {
  if (!hasToken.value) return
  const snap: NotificationSettings = {
    email_notifications: Boolean(notif.email_notifications),
    in_app_notifications: Boolean(notif.in_app_notifications),
    activity_reminders: Boolean(notif.activity_reminders)
  }
  if (notifSaving.value) {
    notifPending = snap
    return
  }
  void saveNotificationSettings(snap)
}

async function saveNotificationSettings(s: NotificationSettings) {
  if (!hasToken.value) return
  notifSaving.value = true
  try {
    const resp = await http.put('/api/user/notification_settings', s)
    const data = unwrap<{ notification_settings?: NotificationSettings }>(resp)
    const out = data?.notification_settings
    if (out && typeof out === 'object') {
      notif.email_notifications = Boolean((out as any).email_notifications)
      notif.in_app_notifications = Boolean((out as any).in_app_notifications)
      notif.activity_reminders = Boolean((out as any).activity_reminders)
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    notifSaving.value = false
    if (notifPending) {
      const next = notifPending
      notifPending = null
      void saveNotificationSettings(next)
    }
  }
}

function disableAllNotifications() {
  notif.email_notifications = false
  notif.in_app_notifications = false
  notif.activity_reminders = false
  scheduleNotifSave()
}

async function fetchOrders() {
  if (!hasToken.value) return
  ordersLoading.value = true
  ordersError.value = null
  try {
    const resp = await http.get('/api/order/history', {
      params: orderStatus.value ? { status: orderStatus.value } : {}
    })
    const data = unwrap<{ orders: Order[] }>(resp)
    orders.value = Array.isArray(data?.orders) ? data.orders : []
  } catch (e: any) {
    ordersError.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    ordersLoading.value = false
  }
}

async function fetchAddresses() {
  if (!hasToken.value) return
  addressLoading.value = true
  addressError.value = null
  try {
    const resp = await http.get('/api/user/addresses')
    const data = unwrap<{ addresses: Address[] }>(resp)
    addresses.value = Array.isArray(data?.addresses) ? data.addresses : []
  } catch (e: any) {
    addressError.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    addressLoading.value = false
  }
}

function resetAddressForm() {
  addressForm.receiver = ''
  addressForm.phone = ''
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.detail = ''
  addressForm.label = ''
  addressForm.is_default = false
  addressFormRef.value?.clearValidate()
}

function openAddAddress() {
  addressEditingId.value = null
  resetAddressForm()
  addressOpen.value = true
}

function openEditAddress(row: Address) {
  addressEditingId.value = row._id
  addressForm.receiver = row.receiver
  addressForm.phone = row.phone
  addressForm.province = row.province
  addressForm.city = row.city
  addressForm.district = row.district
  addressForm.detail = row.detail
  addressForm.label = row.label || ''
  addressForm.is_default = Boolean(row.is_default)
  addressOpen.value = true
}

async function saveAddress() {
  if (!hasToken.value) return
  const formInst = addressFormRef.value
  if (!formInst) return
  const ok = await formInst.validate().catch(() => false)
  if (!ok) return

  addressSaving.value = true
  try {
    const payload = {
      receiver: addressForm.receiver.trim(),
      phone: addressForm.phone.trim(),
      province: addressForm.province.trim(),
      city: addressForm.city.trim(),
      district: addressForm.district.trim(),
      detail: addressForm.detail.trim(),
      label: addressForm.label.trim() || undefined,
      is_default: Boolean(addressForm.is_default)
    }

    if (addressEditingId.value) {
      await http.put(`/api/user/addresses/${encodeURIComponent(addressEditingId.value)}`, payload)
      ElMessage.success('地址已更新')
    } else {
      await http.post('/api/user/addresses', payload)
      ElMessage.success('地址已新增')
    }

    addressOpen.value = false
    await fetchAddresses()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    addressSaving.value = false
  }
}

async function removeAddress(row: Address) {
  if (!hasToken.value) return
  const ok = await ElMessageBox.confirm('确认删除该地址吗？', '删除地址', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).catch(() => false)
  if (!ok) return

  try {
    await http.delete(`/api/user/addresses/${encodeURIComponent(row._id)}`)
    ElMessage.success('已删除')
    await fetchAddresses()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

async function setDefault(row: Address) {
  if (!hasToken.value) return
  try {
    await http.put(`/api/user/addresses/${encodeURIComponent(row._id)}/default`)
    ElMessage.success('默认地址已更新')
    await fetchAddresses()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '设置失败')
  }
}

async function openDetail(orderId: string) {
  detailOpen.value = true
  detailLoading.value = true
  detailError.value = null
  orderDetail.value = null
  try {
    const resp = await http.get(`/api/order/${encodeURIComponent(orderId)}`)
    orderDetail.value = unwrap<any>(resp)
  } catch (e: any) {
    detailError.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    detailLoading.value = false
  }
}

function openPay(orderId: string) {
  payOrderId.value = orderId
  payMethod.value = ''
  payOpen.value = true
}

async function submitPay() {
  if (!payOrderId.value || !payMethod.value) return
  payLoading.value = true
  try {
    await http.post(`/api/order/${encodeURIComponent(payOrderId.value)}/pay`, {
      payment_method: payMethod.value
    })
    ElMessage.success('支付成功')
    payOpen.value = false
    await fetchOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '支付失败')
  } finally {
    payLoading.value = false
  }
}

async function cancelOrder(orderId: string) {
  const { value, action } = await ElMessageBox.prompt('请输入取消原因（可选）', '取消订单', {
    confirmButtonText: '提交',
    cancelButtonText: '取消',
    inputPlaceholder: '原因'
  }).catch(() => ({ value: '', action: 'cancel' }))
  if (action !== 'confirm') return

  try {
    await http.put(`/api/order/${encodeURIComponent(orderId)}/cancel`, { reason: value })
    ElMessage.success('已提交取消申请')
    await fetchOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '取消失败')
  }
}

function openReview(orderId: string) {
  reviewOrderId.value = orderId
  reviewForm.rating = 5
  reviewForm.content = ''
  reviewOpen.value = true
}

async function submitReview() {
  if (!reviewOrderId.value) return
  reviewLoading.value = true
  try {
    await http.post(`/api/order/${encodeURIComponent(reviewOrderId.value)}/review`, {
      rating: reviewForm.rating,
      content: reviewForm.content
    })
    ElMessage.success('评价已提交')
    reviewOpen.value = false
    await fetchOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '提交失败')
  } finally {
    reviewLoading.value = false
  }
}

function openAfterSale(orderId: string) {
  afterSaleOrderId.value = orderId
  afterSaleForm.type = ''
  afterSaleForm.reason = ''
  afterSaleOpen.value = true
}

async function submitAfterSale() {
  if (!afterSaleOrderId.value || !afterSaleForm.type) return
  afterSaleLoading.value = true
  try {
    await http.post(`/api/order/${encodeURIComponent(afterSaleOrderId.value)}/after_sale`, {
      type: afterSaleForm.type,
      reason: afterSaleForm.reason
    })
    ElMessage.success('售后申请已提交')
    afterSaleOpen.value = false
    await fetchOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '提交失败')
  } finally {
    afterSaleLoading.value = false
  }
}

function goHome() {
  router.replace('/')
}

async function logout() {
  logoutLoading.value = true
  try {
    await http.post('/api/user/logout', { refresh_token: localStorage.getItem('refresh_token') })
  } catch {
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    try {
      window.dispatchEvent(new Event('auth:logout'))
    } catch {}
    hasToken.value = false
    profile.username = ''
    profile.phone = ''
    orders.value = []
    ElMessage.success('已退出')
    logoutLoading.value = false
    router.replace('/')
  }
}

function resetPwdForm() {
  pwdForm.old_password = ''
  pwdForm.new_password = ''
  pwdForm.confirm_password = ''
  pwdFormRef.value?.clearValidate()
}

async function submitChangePassword() {
  if (!hasToken.value) return
  const form = pwdFormRef.value
  if (!form) return
  const ok = await form.validate().catch(() => false)
  if (!ok) return

  pwdSubmitting.value = true
  try {
    await http.post('/api/user/change_password', {
      old_password: pwdForm.old_password,
      new_password: pwdForm.new_password,
      confirm_password: pwdForm.confirm_password
    })
    ElMessage.success('密码修改成功，请重新登录')
    resetPwdForm()
    await logout()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '修改失败')
  } finally {
    pwdSubmitting.value = false
  }
}

onMounted(async () => {
  hasToken.value = Boolean(localStorage.getItem('access_token'))
  if (hasToken.value) {
    await fetchProfile()
    await fetchOrders()
    await fetchAddresses()
    await fetchNotificationSettings()
  }
})
</script>
