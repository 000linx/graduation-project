<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import http, { unwrap } from '../../api/http'
import { ElMessage } from 'element-plus'

type SeriesItem = { bucket: string; total_sales: number; count: number }
type SeriesResp = { items: SeriesItem[]; page: number; page_size: number; has_more: boolean }
type DetailItem = {
  _id: string
  created_at: string
  status: string
  user_id: string | null
  order_total: number
  category_total?: number
}
type DetailResp = { items: DetailItem[]; page: number; page_size: number; has_more: boolean }

const categories = ['全部', '耳背式', '耳内式', '隐形式', '充电款']
const granularityOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年', value: 'year' }
]

const granularity = ref<'day' | 'week' | 'month' | 'quarter' | 'year'>('day')
const category = ref('全部')
const dateRange = ref<[Date, Date] | null>(null)

const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(50)
const hasMore = ref(false)
const series = ref<SeriesItem[]>([])

const chartEl = ref<HTMLElement | null>(null)
let chart: any | null = null
let echartsMod: any | null = null

const empty = computed(() => !loading.value && !error.value && series.value.length === 0)

const queryParams = computed(() => {
  const p: any = {
    granularity: granularity.value,
    page: page.value,
    page_size: pageSize.value
  }
  if (category.value && category.value !== '全部') p.category = category.value
  if (dateRange.value) {
    p.start = dateRange.value[0].toISOString().slice(0, 10)
    p.end = dateRange.value[1].toISOString().slice(0, 10)
  }
  return p
})

async function loadSeries(reset = false) {
  if (reset) {
    page.value = 1
    series.value = []
  }
  loading.value = true
  error.value = null
  try {
    const resp = await http.get('/api/admin/sales/series', { params: queryParams.value })
    const data = unwrap<SeriesResp>(resp)
    const list = Array.isArray(data?.items) ? data.items : []
    hasMore.value = Boolean(data?.has_more)
    if (page.value === 1) series.value = list
    else series.value = [...series.value, ...list]
    await nextTick()
    renderChart()
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value += 1
  await loadSeries(false)
}

function fmtAmount(v: number) {
  const n = Number(v || 0)
  return n.toFixed(2)
}

async function ensureChart() {
  if (!chartEl.value) return
  if (!echartsMod) {
    echartsMod = await import('echarts')
  }
  if (!chart) {
    chart = echartsMod.init(chartEl.value, undefined, { renderer: 'canvas' })
    chart.on('click', (params: any) => {
      const bucket = String(params?.name ?? '')
      if (!bucket) return
      openDetail(bucket)
    })
  }
}

function renderChart() {
  if (!chartEl.value) return
  if (!echartsMod || !chart) return

  const x = series.value.map((s) => s.bucket)
  const y = series.value.map((s) => Number(s.total_sales || 0))

  chart.setOption(
    {
      grid: { left: 44, right: 18, top: 36, bottom: 40 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (ps: any[]) => {
          const p = ps?.[0]
          const idx = p?.dataIndex ?? 0
          const it = series.value[idx]
          const bucket = it?.bucket ?? ''
          const total = fmtAmount(it?.total_sales ?? 0)
          const cnt = it?.count ?? 0
          return `${bucket}<br/>销售额：¥${total}<br/>订单/项数：${cnt}<br/>点击查看明细`
        }
      },
      xAxis: {
        type: 'category',
        data: x,
        axisLabel: { color: '#6B7280' },
        axisLine: { lineStyle: { color: '#E5E7EB' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#6B7280' },
        splitLine: { lineStyle: { color: '#F3F4F6' } }
      },
      series: [
        {
          type: 'bar',
          data: y,
          barMaxWidth: 42,
          itemStyle: { color: '#2563EB', borderRadius: [6, 6, 0, 0] },
          emphasis: { itemStyle: { color: '#1D4ED8' } }
        }
      ]
    },
    { notMerge: true, lazyUpdate: true }
  )
}

function resizeChart() {
  try {
    chart?.resize()
  } catch {
  }
}

useResizeObserver(chartEl, () => resizeChart())

onMounted(async () => {
  await ensureChart()
  await loadSeries(true)
})

onBeforeUnmount(() => {
  try {
    chart?.dispose()
  } catch {
  }
  chart = null
})

watch([granularity, category, dateRange], async () => {
  await loadSeries(true)
})

const detailOpen = ref(false)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)
const detailBucket = ref<string | null>(null)
const detailPage = ref(1)
const detailHasMore = ref(false)
const detailItems = ref<DetailItem[]>([])

const detailTitle = computed(() => {
  const g = granularityOptions.find((x) => x.value === granularity.value)?.label ?? ''
  const c = category.value && category.value !== '全部' ? ` · ${category.value}` : ''
  return `明细（${g}：${detailBucket.value ?? '-'}${c}）`
})

async function fetchDetail(reset = false) {
  if (!detailBucket.value) return
  if (reset) {
    detailPage.value = 1
    detailItems.value = []
  }
  detailLoading.value = true
  detailError.value = null
  try {
    const params: any = {
      granularity: granularity.value,
      bucket: detailBucket.value,
      page: detailPage.value,
      page_size: 20
    }
    if (category.value && category.value !== '全部') params.category = category.value
    const resp = await http.get('/api/admin/sales/detail', { params })
    const data = unwrap<DetailResp>(resp)
    const list = Array.isArray(data?.items) ? data.items : []
    detailHasMore.value = Boolean(data?.has_more)
    if (detailPage.value === 1) detailItems.value = list
    else detailItems.value = [...detailItems.value, ...list]
  } catch (e: any) {
    detailError.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    detailLoading.value = false
  }
}

async function openDetail(bucket: string) {
  detailBucket.value = bucket
  detailOpen.value = true
  await fetchDetail(true)
}

async function loadMoreDetail() {
  if (!detailHasMore.value || detailLoading.value) return
  detailPage.value += 1
  await fetchDetail(false)
}

function exportPng() {
  try {
    const url = chart?.getDataURL?.({ type: 'png', pixelRatio: 2, backgroundColor: '#FFFFFF' })
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-${granularity.value}.png`
    a.click()
  } catch {
    ElMessage.error('导出失败')
  }
}

function exportCsv() {
  const rows = [['bucket', 'total_sales', 'count'], ...series.value.map((s) => [s.bucket, String(s.total_sales), String(s.count)])]
  const csv = rows.map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sales-${granularity.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="bg-white border rounded-2xl p-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div class="text-lg font-semibold text-gray-900">销售额趋势</div>
        <div class="text-sm text-gray-500 mt-1">支持日/周/月/季度/年维度，支持分类筛选，点击柱子查看明细</div>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <el-select v-model="granularity" style="width: 120px" placeholder="维度">
          <el-option v-for="g in granularityOptions" :key="g.value" :label="g.label" :value="g.value" />
        </el-select>
        <el-select v-model="category" style="width: 140px" placeholder="分类" clearable>
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
        />
        <el-button :loading="loading" @click="loadSeries(true)">刷新</el-button>
        <el-dropdown>
          <el-button>导出</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="exportPng">导出 PNG</el-dropdown-item>
              <el-dropdown-item @click="exportCsv">导出 CSV</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div v-if="error" class="mt-4">
      <el-alert type="error" show-icon :title="error" />
    </div>

    <div v-else class="mt-4">
      <div v-if="empty" class="py-10">
        <el-empty description="暂无销售数据" />
      </div>
      <div v-else class="relative">
        <div ref="chartEl" class="w-full h-[360px]" />
        <div v-if="loading" class="absolute inset-0 bg-white/60 flex items-center justify-center text-sm text-gray-600">
          正在加载...
        </div>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <div class="text-xs text-gray-500">
        共 {{ series.length }} 个区间
        <span v-if="hasMore">（可继续加载）</span>
      </div>
      <el-button v-if="hasMore" :loading="loading" @click="loadMore">加载更多</el-button>
    </div>
  </div>

  <el-drawer v-model="detailOpen" :title="detailTitle" size="720px">
    <el-alert v-if="detailError" type="error" show-icon :title="detailError" class="mb-3" />
    <el-table v-loading="detailLoading" :data="detailItems" stripe size="small" class="border rounded-xl">
      <el-table-column prop="_id" label="订单ID" min-width="220" show-overflow-tooltip />
      <el-table-column prop="created_at" label="时间" min-width="170" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="user_id" label="用户ID" min-width="220" show-overflow-tooltip />
      <el-table-column prop="order_total" label="订单金额" width="140">
        <template #default="{ row }">¥{{ Number(row.order_total || 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column v-if="category !== '全部'" prop="category_total" label="该分类金额" width="160">
        <template #default="{ row }">¥{{ Number(row.category_total || 0).toFixed(2) }}</template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex justify-end">
      <el-button v-if="detailHasMore" :loading="detailLoading" @click="loadMoreDetail">加载更多</el-button>
    </div>
  </el-drawer>
</template>
