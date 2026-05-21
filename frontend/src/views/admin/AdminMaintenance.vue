<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http, { unwrap } from '../../api/http'

type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'

type Appointment = {
  _id: string
  user_id?: string
  order_id?: string
  product_id?: string
  contact_name?: string
  contact_phone?: string
  status: AppointmentStatus
  scheduled_start?: string
  scheduled_end?: string
  created_at?: string
  updated_at?: string
  notes?: string
  reject_reason?: string
  cancel_reason?: string
}

const loading = ref(false)
const error = ref<string | null>(null)
const forbidden = ref(false)

const appointments = ref<Appointment[]>([])
const total = ref(0)

const query = reactive({
  user_id: '',
  status: '',
  start: '',
  end: '',
  page: 1,
  page_size: 20
})

const statusOptions: { label: string; value: string }[] = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
  { label: '已拒绝', value: 'rejected' }
]

const selection = ref<Appointment[]>([])

const drawerOpen = ref(false)
const detailLoading = ref(false)
const detail = ref<{ appointment: any; history: any[]; record: any | null } | null>(null)

const rejectDialogOpen = ref(false)
const rejectForm = reactive({ appointment_id: '', reason: '' })
const rescheduleDialogOpen = ref(false)
const rescheduleForm = reactive({ appointment_id: '', new_start: '' })
const completeDialogOpen = ref(false)
const completeForm = reactive({
  appointment_id: '',
  technician_name: '',
  total_cost: 0,
  report: '',
  item_name: '',
  item_fee: 0,
  part_name: '',
  part_qty: 1,
  part_unit_price: 0
})

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
    rejected: '已拒绝'
  }
  return map[String(s)] ?? String(s)
}

function statusTagType(s: string) {
  const v = String(s)
  if (v === 'confirmed' || v === 'completed') return 'success'
  if (v === 'pending') return 'warning'
  if (v === 'rejected') return 'danger'
  if (v === 'cancelled') return 'info'
  return 'default'
}

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / query.page_size)))

async function fetchList() {
  loading.value = true
  error.value = null
  forbidden.value = false
  try {
    const res = await http.get('/api/admin/maintenance/appointments', {
      params: {
        user_id: query.user_id || undefined,
        status: query.status || undefined,
        start: query.start || undefined,
        end: query.end || undefined,
        page: query.page,
        page_size: query.page_size
      }
    })
    const data = unwrap(res) as any
    appointments.value = data.items || []
    total.value = Number(data.total || 0)
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (msg.includes('403')) forbidden.value = true
    else error.value = msg || '加载失败'
  } finally {
    loading.value = false
  }
}

async function openDetail(row: Appointment) {
  drawerOpen.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await http.get(`/api/admin/maintenance/appointments/${row._id}`)
    detail.value = unwrap(res) as any
  } catch (e: any) {
    ElMessage.error(e?.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

async function confirmOne(id: string) {
  await http.post(`/api/admin/maintenance/appointments/${id}/confirm`)
  ElMessage.success('已确认')
  await fetchList()
}

function openReject(id: string) {
  rejectForm.appointment_id = id
  rejectForm.reason = ''
  rejectDialogOpen.value = true
}

async function doReject() {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  await http.post(`/api/admin/maintenance/appointments/${rejectForm.appointment_id}/reject`, {
    reason: rejectForm.reason
  })
  rejectDialogOpen.value = false
  ElMessage.success('已拒绝')
  await fetchList()
}

function openReschedule(id: string) {
  rescheduleForm.appointment_id = id
  rescheduleForm.new_start = ''
  rescheduleDialogOpen.value = true
}

async function doReschedule() {
  if (!rescheduleForm.new_start.trim()) {
    ElMessage.warning('请输入新时间（ISO）')
    return
  }
  await http.post(`/api/admin/maintenance/appointments/${rescheduleForm.appointment_id}/reschedule`, {
    new_start: rescheduleForm.new_start
  })
  rescheduleDialogOpen.value = false
  ElMessage.success('已改期')
  await fetchList()
}

function openComplete(id: string) {
  completeForm.appointment_id = id
  completeForm.technician_name = ''
  completeForm.total_cost = 0
  completeForm.report = ''
  completeForm.item_name = ''
  completeForm.item_fee = 0
  completeForm.part_name = ''
  completeForm.part_qty = 1
  completeForm.part_unit_price = 0
  completeDialogOpen.value = true
}

async function doComplete() {
  const items = completeForm.item_name.trim()
    ? [{ name: completeForm.item_name.trim(), fee: Number(completeForm.item_fee || 0) }]
    : []
  const replaced_parts = completeForm.part_name.trim()
    ? [
        {
          name: completeForm.part_name.trim(),
          qty: Number(completeForm.part_qty || 1),
          unit_price: Number(completeForm.part_unit_price || 0)
        }
      ]
    : []
  await http.post(`/api/admin/maintenance/appointments/${completeForm.appointment_id}/complete`, {
    technician: { name: completeForm.technician_name || '' },
    items,
    replaced_parts,
    total_cost: Number(completeForm.total_cost || 0),
    report: completeForm.report || ''
  })
  completeDialogOpen.value = false
  ElMessage.success('已完成并生成记录')
  await fetchList()
}

async function batch(action: 'confirm' | 'reject' | 'cancel') {
  if (!selection.value.length) {
    ElMessage.warning('请先勾选预约')
    return
  }
  let reason: string | undefined
  if (action === 'reject' || action === 'cancel') {
    try {
      reason = await ElMessageBox.prompt('请输入原因（可选）', '批量操作', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then((r) => r.value)
    } catch {
      return
    }
  }
  try {
    const res = await http.post('/api/admin/maintenance/appointments/batch', {
      action,
      ids: selection.value.map((x) => x._id),
      reason
    })
    const data = unwrap(res) as any
    const ok = Number(data?.ok ?? 0)
    const failed = Number(data?.failed ?? 0)
    if (failed > 0) {
      ElMessage.warning(`操作完成：${ok} 条成功，${failed} 条失败（可能因状态不符）`)
    } else {
      ElMessage.success(`批量操作已完成，共处理 ${ok} 条`)
    }
    await fetchList()
  } catch (e: any) {
    ElMessage.error(e?.message || '批量操作失败')
  }
}

async function exportPdf(recordId: string) {
  try {
    const res = await http.get(`/api/admin/maintenance/records/${recordId}/pdf`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maintenance-record-${recordId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败')
  }
}

function search() {
  query.page = 1
  fetchList()
}

function prevPage() {
  if (query.page <= 1) return
  query.page -= 1
  fetchList()
}

function nextPage() {
  if (query.page >= pageCount.value) return
  query.page += 1
  fetchList()
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="text-xl font-extrabold">保养预约管理</div>
        <div class="text-sm text-gray-500 mt-1">
          支持按用户/时间/状态筛选，支持确认/拒绝/改期/完成与批量处理。
        </div>
      </div>
      <div class="flex items-center gap-2 flex-nowrap overflow-x-auto">
        <el-button :disabled="loading" type="success" plain @click="batch('confirm')">批量确认</el-button>
        <el-button :disabled="loading" type="danger" plain @click="batch('reject')">批量拒绝</el-button>
        <el-button :disabled="loading" type="warning" plain @click="batch('cancel')">批量取消</el-button>
        <el-button :loading="loading" @click="fetchList">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="forbidden"
      type="error"
      show-icon
      title="无权限"
      description="你没有访问保养预约模块的权限。"
    />
    <el-alert v-else-if="error" type="error" show-icon :title="error" />

    <div class="bg-white border rounded-2xl p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <el-input v-model="query.user_id" placeholder="用户ID（可选）" clearable />
        <el-select v-model="query.status" placeholder="状态" clearable>
          <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-input v-model="query.start" placeholder="开始时间 ISO（可选）" clearable />
        <el-input v-model="query.end" placeholder="结束时间 ISO（可选）" clearable />
      </div>
      <div class="mt-3 flex items-center gap-2">
        <el-button type="primary" :loading="loading" @click="search">查询</el-button>
        <div class="text-sm text-gray-500">共 {{ total }} 条</div>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="appointments"
      stripe
      size="small"
      class="bg-white rounded-2xl border"
      @selection-change="selection = $event"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column prop="_id" label="预约号" min-width="220" show-overflow-tooltip />
      <el-table-column prop="user_id" label="用户" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" min-width="200">
        <template #default="{ row }">
          <div class="text-sm">{{ row.scheduled_start }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="contact_phone" label="联系方式" width="140" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button v-if="row.status === 'pending'" link type="success" @click="confirmOne(row._id)"
            >确认</el-button
          >
          <el-button v-if="row.status === 'pending'" link type="danger" @click="openReject(row._id)"
            >拒绝</el-button
          >
          <el-button
            v-if="['pending', 'confirmed'].includes(String(row.status))"
            link
            type="warning"
            @click="openReschedule(row._id)"
            >改期</el-button
          >
          <el-button v-if="row.status === 'confirmed'" link type="success" @click="openComplete(row._id)"
            >完成</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <div class="flex items-center justify-end gap-2">
      <el-button :disabled="query.page <= 1" @click="prevPage">上一页</el-button>
      <div class="text-sm text-gray-500">{{ query.page }} / {{ pageCount }}</div>
      <el-button :disabled="query.page >= pageCount" @click="nextPage">下一页</el-button>
    </div>

    <el-drawer v-model="drawerOpen" title="预约详情" size="520px">
      <div v-loading="detailLoading" class="space-y-4">
        <el-descriptions v-if="detail?.appointment" :column="1" border>
          <el-descriptions-item label="预约号">{{ detail.appointment._id }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ detail.appointment.user_id }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{
            statusLabel(detail.appointment.status)
          }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ detail.appointment.scheduled_start }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ detail.appointment.contact_phone }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.appointment.notes || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div>
          <div class="font-semibold mb-2">历史保养记录（最近 20 条）</div>
          <el-table :data="detail?.history || []" stripe size="small" class="rounded-2xl border">
            <el-table-column prop="_id" label="记录号" min-width="200" show-overflow-tooltip />
            <el-table-column prop="created_at" label="时间" min-width="180" show-overflow-tooltip />
            <el-table-column label="费用" width="120">
              <template #default="{ row }">¥{{ Number(row.total_cost ?? 0).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="detail?.record">
          <div class="font-semibold mb-2">本次保养记录</div>
          <el-button type="primary" plain @click="exportPdf(detail.record._id)">导出PDF</el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="rejectDialogOpen" title="拒绝预约" width="520px">
      <el-input v-model="rejectForm.reason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="rejectDialogOpen = false">取消</el-button>
        <el-button type="danger" @click="doReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rescheduleDialogOpen" title="改期" width="520px">
      <div class="text-sm text-gray-500 mb-2">请输入 ISO 时间（例如 2026-05-02T10:30）</div>
      <el-input v-model="rescheduleForm.new_start" placeholder="新开始时间" />
      <template #footer>
        <el-button @click="rescheduleDialogOpen = false">取消</el-button>
        <el-button type="warning" @click="doReschedule">确认改期</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogOpen" title="完成保养并生成记录" width="640px">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <el-input v-model="completeForm.technician_name" placeholder="技师姓名" />
        <el-input v-model.number="completeForm.total_cost" placeholder="总费用" />
        <el-input v-model="completeForm.item_name" placeholder="保养项目（可选）" />
        <el-input v-model.number="completeForm.item_fee" placeholder="项目费用（可选）" />
        <el-input v-model="completeForm.part_name" placeholder="更换配件（可选）" />
        <el-input v-model.number="completeForm.part_qty" placeholder="数量（可选）" />
        <el-input v-model.number="completeForm.part_unit_price" placeholder="单价（可选）" />
      </div>
      <div class="mt-3">
        <el-input v-model="completeForm.report" type="textarea" :rows="4" placeholder="保养报告（可选）" />
      </div>
      <template #footer>
        <el-button @click="completeDialogOpen = false">取消</el-button>
        <el-button type="success" @click="doComplete">确认完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>
