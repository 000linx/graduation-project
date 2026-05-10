<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import http, { unwrap } from '@/api/http'

type Activity = {
  _id: string
  name: string
  subtitle?: string
  cover?: string
  start_at?: string
  end_at?: string
  time_status?: 'not_started' | 'ongoing' | 'ended' | 'unknown'
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
  page: 1,
  page_size: 12
})

const statusOptions = [
  { label: '全部', value: '' },
  { label: '未开始', value: 'not_started' },
  { label: '进行中', value: 'ongoing' },
  { label: '已结束', value: 'ended' }
] as const

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / query.page_size)))

function statusLabel(s: string) {
  if (s === 'not_started') return '未开始'
  if (s === 'ongoing') return '进行中'
  if (s === 'ended') return '已结束'
  return '未知'
}

function statusTagType(s: string) {
  if (s === 'ongoing') return 'success'
  if (s === 'not_started') return 'warning'
  if (s === 'ended') return 'info'
  return 'default'
}

async function fetchList() {
  loading.value = true
  try {
    const res = await http.get('/api/activity/list', {
      params: {
        q: query.q || undefined,
        status: query.status || undefined,
        page: query.page,
        page_size: query.page_size,
        sort_by: 'start_at',
        sort_dir: 1
      }
    })
    const data = unwrap(res) as any
    items.value = data?.items || []
    total.value = Number(data?.total || 0)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载活动失败')
  } finally {
    loading.value = false
  }
}

function openDetail(id: string) {
  router.push(`/activities/${id}`)
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <main class="container mx-auto px-4 py-8 space-y-6" id="main-content">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="text-2xl font-extrabold text-[var(--c-text)]">活动</div>
        <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">浏览最新活动并报名参加。</div>
      </div>
      <div class="flex items-center gap-2 flex-nowrap overflow-x-auto">
        <el-input v-model="query.q" placeholder="搜索活动名称" clearable style="width: 220px" @keyup.enter="query.page = 1; fetchList()" />
        <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px" @change="query.page = 1; fetchList()">
          <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="query.page = 1; fetchList()">查询</el-button>
      </div>
    </div>

    <div v-loading="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="a in items"
        :key="a._id"
        class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition"
      >
        <div class="h-40 bg-[var(--c-bg)] overflow-hidden">
          <img v-if="a.cover" :src="a.cover" alt="cover" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-[var(--c-muted)] font-semibold">无封面</div>
        </div>
        <div class="p-4 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="text-base font-extrabold text-[var(--c-text)] truncate">{{ a.name }}</div>
              <div class="text-sm font-semibold text-[var(--c-muted)] truncate">{{ a.subtitle || '' }}</div>
            </div>
            <el-tag size="small" :type="statusTagType(String(a.time_status))">{{ statusLabel(String(a.time_status)) }}</el-tag>
          </div>
          <div class="text-sm text-[var(--c-muted)]">
            <div>开始：{{ a.start_at || '-' }}</div>
            <div>结束：{{ a.end_at || '-' }}</div>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-sm font-semibold text-[var(--c-muted)]">
              报名：{{ Number(a.signup_count || 0) }}/{{ a.capacity ?? '不限' }}
            </div>
            <el-button type="primary" plain size="small" @click="openDetail(a._id)">查看</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2">
      <el-button :disabled="query.page <= 1" @click="query.page -= 1; fetchList()">上一页</el-button>
      <div class="text-sm font-semibold text-[var(--c-muted)]">{{ query.page }} / {{ pageCount }}</div>
      <el-button :disabled="query.page >= pageCount" @click="query.page += 1; fetchList()">下一页</el-button>
    </div>
  </main>
</template>

