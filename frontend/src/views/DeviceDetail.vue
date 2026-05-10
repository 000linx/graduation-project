<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Cpu, Calendar, ShieldCheck, Tag, GitBranch, Clock, BarChart3, Battery, Activity } from 'lucide-vue-next'
import { useDeviceStore, type DeviceItem } from '@/stores/device'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const store = useDeviceStore()

const device = ref<DeviceItem | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const deviceId = route.params.id as string

onMounted(async () => {
  loading.value = true
  try {
    device.value = await store.fetchDeviceDetail(deviceId)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
})

function goBack() {
  router.back()
}

const statusColor = (s: string) => {
  switch (s) {
    case 'online': return 'var(--c-success, #22c55e)'
    case 'offline': return 'var(--c-muted, #9ca3af)'
    case 'maintenance': return 'var(--c-warning, #f59e0b)'
    default: return 'var(--c-muted, #9ca3af)'
  }
}

const statusLabel = (s: string) => {
  switch (s) {
    case 'online': return '在线'
    case 'offline': return '离线'
    case 'maintenance': return '待维护'
    default: return s
  }
}

const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

async function reportRepair() {
  ElMessage.info('报修功能已跳转至保养预约页面')
  router.push('/profile')
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <button
      v-feedback
      type="button"
      class="a11y-hit flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] font-extrabold mb-6"
      @click="goBack"
      aria-label="返回上一页"
    >
      <ArrowLeft class="w-4 h-4" />
      返回
    </button>

    <div v-if="loading" class="text-center py-20">
      <div class="animate-pulse space-y-4">
        <div class="h-8 w-64 bg-[var(--c-border)]/20 rounded mx-auto" />
        <div class="h-4 w-48 bg-[var(--c-border)]/20 rounded mx-auto" />
      </div>
    </div>

    <div v-else-if="error" class="text-center py-20">
      <div class="text-[var(--c-danger)] font-extrabold text-lg">{{ error }}</div>
      <el-button class="mt-4" @click="goBack">返回上一页</el-button>
    </div>

    <template v-else-if="device">
      <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-2xl bg-[var(--c-bg)] border-2 border-[var(--c-border)] flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="device.thumbnail" :src="device.thumbnail" :alt="device.model" class="w-full h-full object-cover" />
            <Cpu v-else class="w-10 h-10 icon-tone--muted" />
          </div>
          <div class="min-w-0">
            <div class="text-2xl font-extrabold text-[var(--c-text)]">{{ device.model }}</div>
            <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">{{ device.serial_no }}</div>
            <div class="mt-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold border" :style="{ color: statusColor(device.status), borderColor: statusColor(device.status), background: statusColor(device.status) + '15' }">
                {{ statusLabel(device.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-[var(--c-bg)] border-2 border-[var(--c-border)] rounded-2xl p-4">
            <div class="flex items-center gap-2 text-[var(--c-muted)] text-xs font-semibold">
              <GitBranch class="w-3.5 h-3.5" /> 固件版本
            </div>
            <div class="mt-1 text-lg font-extrabold text-[var(--c-text)]">{{ device.firmware_version }}</div>
          </div>
          <div class="bg-[var(--c-bg)] border-2 border-[var(--c-border)] rounded-2xl p-4">
            <div class="flex items-center gap-2 text-[var(--c-muted)] text-xs font-semibold">
              <Clock class="w-3.5 h-3.5" /> 最近同步
            </div>
            <div class="mt-1 text-lg font-extrabold text-[var(--c-text)] truncate">{{ device.last_sync || '未同步' }}</div>
          </div>
          <div class="bg-[var(--c-bg)] border-2 border-[var(--c-border)] rounded-2xl p-4">
            <div class="flex items-center gap-2 text-[var(--c-muted)] text-xs font-semibold">
              <Battery class="w-3.5 h-3.5" /> 电池循环
            </div>
            <div class="mt-1 text-lg font-extrabold text-[var(--c-text)]">{{ device.usage_stats.battery_cycles }}</div>
          </div>
          <div class="bg-[var(--c-bg)] border-2 border-[var(--c-border)] rounded-2xl p-4">
            <div class="flex items-center gap-2 text-[var(--c-muted)] text-xs font-semibold">
              <Activity class="w-3.5 h-3.5" /> 总使用时长
            </div>
            <div class="mt-1 text-lg font-extrabold text-[var(--c-text)]">{{ device.usage_stats.total_hours }}h</div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-center gap-3 bg-[var(--c-bg)] border-2 border-[var(--c-border)] rounded-2xl p-4">
            <Calendar class="w-5 h-5 icon-tone--info" />
            <div>
              <div class="text-xs font-semibold text-[var(--c-muted)]">购买日期</div>
              <div class="font-extrabold text-[var(--c-text)]">{{ device.purchase_date || '未知' }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-[var(--c-bg)] border-2 border-[var(--c-border)] rounded-2xl p-4">
            <ShieldCheck class="w-5 h-5 icon-tone--info" />
            <div>
              <div class="text-xs font-semibold text-[var(--c-muted)]">保修截止</div>
              <div class="font-extrabold text-[var(--c-text)]">{{ device.warranty_end || '--' }}</div>
            </div>
          </div>
        </div>

        <div class="mt-6 bg-[var(--c-bg)] border-2 border-[var(--c-border)] rounded-2xl p-5">
          <div class="flex items-center gap-2 mb-4">
            <BarChart3 class="w-5 h-5 icon-tone--info" />
            <div class="text-base font-extrabold text-[var(--c-text)]">近7天使用时长（小时）</div>
          </div>
          <div class="grid grid-cols-7 gap-2">
            <div v-for="(h, i) in device.usage_stats.last_7_days_hours" :key="i" class="flex flex-col items-center gap-1">
              <div class="w-full bg-[var(--c-border)]/20 rounded-lg overflow-hidden" style="height: 80px">
                <div
                  class="w-full bg-[var(--c-primary)]/60 rounded-b-lg transition-all duration-300"
                  :style="{ height: `${Math.min(100, (h / 24) * 100)}%`, marginTop: 'auto' }"
                />
              </div>
              <span class="text-[10px] font-extrabold text-[var(--c-muted)]">{{ dayLabels[i] }}</span>
              <span class="text-xs font-extrabold text-[var(--c-text)]">{{ h }}h</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-3">
          <el-button type="warning" plain @click="reportRepair">报修</el-button>
          <el-button @click="router.push('/profile')">返回个人中心</el-button>
        </div>
      </div>
    </template>
  </div>
</template>
