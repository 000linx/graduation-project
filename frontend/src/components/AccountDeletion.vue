<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="resetFlow"
  >
    <div v-if="flowStep === 'idle'" class="space-y-5 py-2">
      <el-alert
        type="error"
        :closable="false"
        show-icon
        title="危险操作"
        description="注销账户是不可逆操作，请仔细阅读以下说明后再决定。"
      />
      <div class="space-y-3 text-sm text-[var(--c-text)]">
        <div class="font-extrabold">注销账户后，以下数据将被永久删除：</div>
        <ul class="list-disc pl-5 space-y-1.5 text-[var(--c-muted)]">
          <li>个人资料（用户名、手机号、邮箱、收货地址）</li>
          <li>听力档案与偏好设置</li>
          <li>购物车中的商品</li>
          <li>订单记录（已完成订单保留用于财务审计，个人身份信息将被匿名化）</li>
          <li>保养预约与历史记录</li>
          <li>已绑定的设备信息</li>
        </ul>
        <div class="font-extrabold mt-3">注销后无法恢复：</div>
        <ul class="list-disc pl-5 space-y-1.5 text-[var(--c-muted)]">
          <li>一旦冷静期结束，数据将被永久删除且无法恢复</li>
          <li>同一手机号在90天内无法重新注册</li>
          <li>正在进行的订单将自动取消并退款</li>
          <li>有效的优惠券与积分将被清零</li>
        </ul>
        <div class="font-extrabold mt-3 text-orange-600">关联服务影响：</div>
        <ul class="list-disc pl-5 space-y-1.5 text-orange-500">
          <li>绑定设备将自动解绑</li>
          <li>保养预约将被取消</li>
          <li>邮件通知将停止发送</li>
        </ul>
      </div>
      <div class="pt-2">
        <div class="text-sm font-semibold text-[var(--c-muted)] mb-2">
          在继续之前，您可以选择导出您的个人数据（符合GDPR规定）：
        </div>
        <el-button type="info" plain :loading="exportLoading" @click="handleExportData">
          <span class="flex items-center gap-1.5">
            <Download :size="16" />
            导出我的数据
          </span>
        </el-button>
      </div>
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-[var(--c-border)]/30">
        <el-button @click="visible = false">我再想想</el-button>
        <el-button type="danger" @click="flowStep = 'verify'">继续注销</el-button>
      </div>
    </div>

    <div v-else-if="flowStep === 'verify'" class="space-y-5 py-2">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="身份验证"
        description="请输入您的登录密码以确认身份。"
      />
      <el-form
        ref="verifyFormRef"
        :model="verifyForm"
        :rules="verifyRules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item label="登录密码" prop="password">
          <el-input
            v-model="verifyForm.password"
            type="password"
            show-password
            placeholder="请输入当前登录密码"
            autocomplete="current-password"
            @keyup.enter="submitDeletion"
          />
        </el-form-item>
      </el-form>
      <div class="pt-2">
        <el-checkbox v-model="verifyForm.confirmed" class="font-semibold">
          我已了解注销后果，确认要注销账户
        </el-checkbox>
      </div>
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-[var(--c-border)]/30">
        <el-button @click="flowStep = 'idle'">返回</el-button>
        <el-button
          type="danger"
          :loading="submitting"
          :disabled="!verifyForm.confirmed"
          @click="submitDeletion"
        >
          确认注销
        </el-button>
      </div>
    </div>

    <div v-else-if="flowStep === 'result'" class="space-y-5 py-2">
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
          <Clock :size="24" class="text-orange-500" />
        </div>
        <div>
          <div class="text-lg font-extrabold text-[var(--c-text)]">注销申请已提交</div>
          <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
            您的账户已进入{{ coolingDays }}天冷静期
          </div>
        </div>
      </div>

      <div class="bg-[var(--c-bg)] border-2 border-[var(--c-border)] rounded-2xl p-5 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-[var(--c-muted)]">冷静期截止时间</span>
          <span class="text-sm font-extrabold text-[var(--c-text)]">{{ formattedCoolingUntil }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-[var(--c-muted)]">剩余天数</span>
          <span class="text-sm font-extrabold text-orange-500">{{ remainingDays }} 天</span>
        </div>
      </div>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="冷静期说明"
        description="冷静期内您的账户将被冻结，无法登录和使用。如果您改变主意，可以在此页面撤销注销申请，账户将恢复正常。冷静期结束后，所有数据将被永久删除且不可恢复。"
      />

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-[var(--c-border)]/30">
        <el-button type="warning" plain :loading="cancelLoading" @click="handleCancelDeletion">
          撤销注销，恢复账户
        </el-button>
      </div>
    </div>

    <div v-else-if="flowStep === 'cancelled'" class="space-y-5 py-2">
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <ShieldCheck :size="24" class="text-green-500" />
        </div>
        <div>
          <div class="text-lg font-extrabold text-[var(--c-text)]">注销已撤销</div>
          <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">账户已恢复正常使用</div>
        </div>
      </div>
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-[var(--c-border)]/30">
        <el-button type="primary" @click="visible = false">知道了</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Clock, Download, ShieldCheck } from 'lucide-vue-next'
import http, { unwrap } from '../api/http'
import dayjs from 'dayjs'

const emit = defineEmits<{
  logout: []
}>()

const visible = ref(false)
const flowStep = ref<'idle' | 'verify' | 'result' | 'cancelled'>('idle')
const submitting = ref(false)
const cancelLoading = ref(false)
const exportLoading = ref(false)

const coolingDays = ref(15)
const coolingUntil = ref<string | null>(null)
const deletionRequestedAt = ref<string | null>(null)

const verifyFormRef = ref<FormInstance>()
const verifyForm = reactive({
  password: '',
  confirmed: false
})

const verifyRules: FormRules = {
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => {
  switch (flowStep.value) {
    case 'idle':
      return '注销账户'
    case 'verify':
      return '身份验证'
    case 'result':
      return '注销申请已提交'
    case 'cancelled':
      return '注销已撤销'
    default:
      return '注销账户'
  }
})

const formattedCoolingUntil = computed(() => {
  if (!coolingUntil.value) return '-'
  return dayjs(coolingUntil.value).format('YYYY-MM-DD HH:mm')
})

const remainingDays = computed(() => {
  if (!coolingUntil.value) return coolingDays.value
  const now = dayjs()
  const end = dayjs(coolingUntil.value)
  const diff = end.diff(now, 'day')
  return Math.max(0, diff)
})

async function fetchDeletionStatus() {
  try {
    const resp = await http.get('/api/user/deletion/status')
    const data = unwrap<{
      account_status: string
      deletion_cooling_until?: string
      deletion_requested_at?: string
    }>(resp)
    if (data?.account_status === 'pending_deletion') {
      coolingUntil.value = data.deletion_cooling_until || null
      deletionRequestedAt.value = data.deletion_requested_at || null
      flowStep.value = 'result'
      visible.value = true
    }
  } catch {}
}

function resetFlow() {
  flowStep.value = 'idle'
  verifyForm.password = ''
  verifyForm.confirmed = false
  verifyFormRef.value?.resetFields()
}

async function submitDeletion() {
  const form = verifyFormRef.value
  if (!form) return
  const ok = await form.validate().catch(() => false)
  if (!ok) return

  submitting.value = true
  try {
    const resp = await http.post('/api/user/deletion/request', {
      password: verifyForm.password
    })
    const data = unwrap<{
      account_status: string
      deletion_cooling_until: string
      cooling_days: number
      message: string
    }>(resp)
    coolingUntil.value = data?.deletion_cooling_until || null
    coolingDays.value = data?.cooling_days || 15
    flowStep.value = 'result'
    ElMessage.warning('注销申请已提交，账户即将退出登录')
    setTimeout(() => {
      emit('logout')
    }, 2000)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleCancelDeletion() {
  cancelLoading.value = true
  try {
    await http.post('/api/user/deletion/cancel')
    flowStep.value = 'cancelled'
    ElMessage.success('注销已撤销，账户恢复正常')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '撤销失败')
  } finally {
    cancelLoading.value = false
  }
}

async function handleExportData() {
  exportLoading.value = true
  try {
    const resp = await http.get('/api/user/deletion/export')
    const data = unwrap<{ user_data: Record<string, unknown>; exported_at: string; notice: string }>(resp)
    const blob = new Blob([JSON.stringify(data?.user_data || {}, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `personal-data-export-${dayjs().format('YYYYMMDD-HHmmss')}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('数据已导出，请妥善保管')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '导出失败')
  } finally {
    exportLoading.value = false
  }
}

function open() {
  visible.value = true
  fetchDeletionStatus()
}

defineExpose({ open })
</script>
