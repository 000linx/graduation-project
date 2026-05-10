<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import http, { unwrap } from '@/api/http'

type Activity = {
  _id: string
  name: string
  cover?: string
  start_at?: string
  end_at?: string
  status?: string
  time_status?: string
  signup_count?: number
  capacity?: number | null
}

const router = useRouter()
const loading = ref(false)
const items = ref<Activity[]>([])
const total = ref(0)

const query = reactive({
  q: '',
  status: '',
  start: '',
  end: '',
  sort_by: 'created_at',
  sort_dir: -1,
  page: 1,
  page_size: 20
})

const statusOptions = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '定时发布', value: 'scheduled' },
  { label: '已发布', value: 'published' },
  { label: '已下架', value: 'offline' }
]

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / query.page_size)))

function timeStatusLabel(s: string) {
  if (s === 'not_started') return '未开始'
  if (s === 'ongoing') return '进行中'
  if (s === 'ended') return '已结束'
  return '未知'
}

function timeStatusTag(s: string) {
  if (s === 'ongoing') return 'success'
  if (s === 'not_started') return 'warning'
  if (s === 'ended') return 'info'
  return 'default'
}

async function fetchList() {
  loading.value = true
  try {
    const res = await http.get('/api/admin/activities', {
      params: {
        q: query.q || undefined,
        status: query.status || undefined,
        start: query.start || undefined,
        end: query.end || undefined,
        sort_by: query.sort_by,
        sort_dir: query.sort_dir,
        page: query.page,
        page_size: query.page_size
      }
    })
    const data = unwrap(res) as any
    items.value = data?.items || []
    total.value = Number(data?.total || 0)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function create() {
  try {
    await ElMessageBox.confirm('创建一个新的活动草稿？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    const res = await http.post('/api/admin/activities', {})
    const data = unwrap(res) as any
    const id = String(data?.activity_id || '')
    if (!id) throw new Error('create failed')
    router.push(`/admin/activities/${id}`)
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  }
}

function edit(row: Activity) {
  router.push(`/admin/activities/${row._id}`)
}

onMounted(() => fetchList())
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="text-xl font-extrabold">活动管理</div>
        <div class="text-sm text-gray-500 mt-1">支持分页/搜索/排序与状态管理。</div>
      </div>
      <div class="flex items-center gap-2 flex-nowrap overflow-x-auto">
        <el-button type="primary" @click="create">新建活动</el-button>
        <el-button :loading="loading" @click="fetchList">刷新</el-button>
      </div>
    </div>

    <div class="bg-white border rounded-2xl p-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <el-input v-model="query.q" placeholder="搜索：名称/状态" clearable @keyup.enter="query.page = 1; fetchList()" />
        <el-select v-model="query.status" placeholder="状态" clearable @change="query.page = 1; fetchList()">
          <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-input v-model="query.start" placeholder="开始时间 ISO（可选）" clearable />
        <el-input v-model="query.end" placeholder="结束时间 ISO（可选）" clearable />
        <el-select v-model="query.sort_by" placeholder="排序" @change="fetchList()">
          <el-option label="创建时间" value="created_at" />
          <el-option label="开始时间" value="start_at" />
          <el-option label="状态" value="status" />
        </el-select>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <el-button type="primary" :loading="loading" @click="query.page = 1; fetchList()">查询</el-button>
        <el-button @click="query.sort_dir = query.sort_dir === 1 ? -1 : 1; fetchList()">
          {{ query.sort_dir === 1 ? '升序' : '降序' }}
        </el-button>
        <div class="text-sm text-gray-500">共 {{ total }} 条</div>
      </div>
    </div>

    <el-table v-loading="loading" :data="items" stripe size="small" class="bg-white rounded-2xl border">
      <el-table-column prop="name" label="活动名称" min-width="220" show-overflow-tooltip />
      <el-table-column label="封面" width="90">
        <template #default="{ row }">
          <img v-if="row.cover" :src="row.cover" class="w-16 h-10 object-cover rounded-md border" />
          <div v-else class="text-xs text-gray-400">无</div>
        </template>
      </el-table-column>
      <el-table-column label="开始/结束时间" min-width="240">
        <template #default="{ row }">
          <div class="text-xs text-gray-600">{{ row.start_at || '-' }}</div>
          <div class="text-xs text-gray-600">{{ row.end_at || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="当前状态" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="timeStatusTag(String(row.time_status))">{{ timeStatusLabel(String(row.time_status)) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="报名/名额" width="140">
        <template #default="{ row }">{{ Number(row.signup_count || 0) }}/{{ row.capacity ?? '不限' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="edit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex items-center justify-end gap-2">
      <el-button :disabled="query.page <= 1" @click="query.page -= 1; fetchList()">上一页</el-button>
      <div class="text-sm text-gray-500">{{ query.page }} / {{ pageCount }}</div>
      <el-button :disabled="query.page >= pageCount" @click="query.page += 1; fetchList()">下一页</el-button>
    </div>
  </div>
</template>

