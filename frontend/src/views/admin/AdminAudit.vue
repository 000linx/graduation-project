<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import http, { unwrap } from '../../api/http'

type AuditLog = {
  _id?: string
  actor_user_id?: string | null
  action?: string
  resource_type?: string | null
  resource_id?: string | null
  success?: boolean
  status_code?: number
  error?: string | null
  created_at?: string
}

const loading = ref(false)
const forbidden = ref(false)
const error = ref<string | null>(null)

const logs = ref<AuditLog[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const paginationText = computed(() => {
  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(page.value * pageSize.value, total.value)
  if (total.value <= 0) return '暂无记录'
  return `${start}-${end} / ${total.value}`
})

async function fetchLogs() {
  loading.value = true
  forbidden.value = false
  error.value = null
  try {
    const resp = await http.get('/api/admin/audit', {
      params: { page: page.value, page_size: pageSize.value }
    })
    const data = unwrap<{ logs: AuditLog[]; pagination?: { total?: number } }>(resp)
    logs.value = Array.isArray(data?.logs) ? data.logs : []
    total.value = Number(data?.pagination?.total ?? 0) || 0
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 403) forbidden.value = true
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function onCurrentChange(p: number) {
  page.value = p
  fetchLogs()
}

function onSizeChange(s: number) {
  pageSize.value = s
  page.value = 1
  fetchLogs()
}

onMounted(fetchLogs)
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div class="text-2xl font-semibold text-gray-900">审计日志</div>
        <div class="text-sm text-gray-500 mt-1">查看后台关键操作的审计记录</div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-sm text-gray-500">{{ paginationText }}</div>
        <el-button :loading="loading" @click="fetchLogs">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="forbidden"
      type="error"
      show-icon
      title="无权限"
      description="当前账号无审计查看权限（admin.audit.read）。"
    />
    <el-alert v-else-if="error" type="error" show-icon :title="error" />

    <el-table v-loading="loading" :data="logs" stripe size="small" class="bg-white rounded-2xl border">
      <el-table-column prop="created_at" label="时间" min-width="160" show-overflow-tooltip />
      <el-table-column prop="action" label="动作" min-width="180" show-overflow-tooltip />
      <el-table-column prop="resource_type" label="资源" width="140" show-overflow-tooltip />
      <el-table-column prop="resource_id" label="资源ID" min-width="180" show-overflow-tooltip />
      <el-table-column prop="actor_user_id" label="操作者" min-width="160" show-overflow-tooltip />
      <el-table-column label="结果" width="120">
        <template #default="{ row }">
          <el-tag :type="row.success ? 'success' : 'danger'">{{ row.success ? '成功' : '失败' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status_code" label="状态码" width="100" />
    </el-table>

    <div class="flex justify-end">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        @current-change="onCurrentChange"
        @size-change="onSizeChange"
      />
    </div>
  </div>
</template>
