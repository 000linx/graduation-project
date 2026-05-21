<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import http, { unwrap } from '@/api/http'
import { useUserAuthStore } from '@/stores/userAuth'

const route = useRoute()
const router = useRouter()
const userAuth = useUserAuthStore()

const id = computed(() => String(route.params.id || ''))
const hasToken = computed(() => userAuth.verified)

type FormField = {
  field_id?: string
  label: string
  type: 'text' | 'single' | 'multi' | 'file'
  required?: boolean
  options?: string[]
}

type TicketTier = {
  tier_id: string
  name: string
  price: number
  stock: number
  sold: number
  early_bird_price?: number | null
  early_bird_until?: string | null
}

type Activity = {
  _id: string
  name: string
  subtitle?: string
  description?: string
  cover?: string
  location?: { address?: string }
  start_at?: string
  end_at?: string
  signup_deadline?: string
  time_status?: string
  signup_count?: number
  capacity?: number | null
  fee_type?: 'free' | 'paid'
  ticket_tiers?: TicketTier[]
  form_fields?: FormField[]
}

const loading = ref(false)
const activity = ref<Activity | null>(null)
const submitting = ref(false)

const form = reactive({
  ticket_tier_id: '',
  answers: {} as Record<string, any>
})

function fieldKey(f: FormField, idx: number) {
  return String(f.field_id || `f_${idx}`)
}

async function fetchDetail() {
  loading.value = true
  try {
    const res = await http.get(`/api/activity/${id.value}`)
    activity.value = unwrap(res) as Activity
    const tiers = activity.value?.ticket_tiers || []
    if (!form.ticket_tier_id && tiers.length) form.ticket_tier_id = String(tiers[0].tier_id)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function pickPrice(t: TicketTier) {
  if (t.early_bird_price != null && t.early_bird_until) {
    return t.early_bird_price
  }
  return t.price
}

async function onFileChange(file: any, key: string) {
  try {
    const raw = file?.raw as File
    if (!raw) return
    const reader = new FileReader()
    const dataUrl: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('read failed'))
      reader.readAsDataURL(raw)
    })
    form.answers[key] = dataUrl
  } catch {
    ElMessage.error('文件读取失败')
  }
}

async function submit() {
  if (!activity.value) return
  if (!hasToken.value) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  const fields = activity.value.form_fields || []
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    const k = fieldKey(f, i)
    if (
      f.required &&
      (form.answers[k] == null ||
        form.answers[k] === '' ||
        (Array.isArray(form.answers[k]) && form.answers[k].length === 0))
    ) {
      ElMessage.warning(`请填写：${f.label}`)
      return
    }
  }
  if (activity.value.fee_type === 'paid' && !form.ticket_tier_id) {
    ElMessage.warning('请选择票价档位')
    return
  }

  submitting.value = true
  try {
    await http.post(`/api/activity/${activity.value._id}/register`, {
      ticket_tier_id: activity.value.fee_type === 'paid' ? form.ticket_tier_id : undefined,
      answers: form.answers
    })
    ElMessage.success('报名成功')
    await fetchDetail()
  } catch (e: any) {
    ElMessage.error(e?.message || '报名失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await userAuth.verifyUser()
  await fetchDetail()
})
</script>

<template>
  <main class="container mx-auto px-4 py-8 space-y-6" id="main-content">
    <el-button @click="router.back()">返回</el-button>

    <div
      v-loading="loading"
      class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl overflow-hidden"
    >
      <div class="h-60 bg-[var(--c-bg)] overflow-hidden">
        <img v-if="activity?.cover" :src="activity.cover" alt="cover" class="w-full h-full object-cover" />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-[var(--c-muted)] font-semibold"
        >
          无封面
        </div>
      </div>
      <div class="p-6 space-y-3">
        <div class="text-2xl font-extrabold text-[var(--c-text)]">{{ activity?.name || '' }}</div>
        <div class="text-sm font-semibold text-[var(--c-muted)]">{{ activity?.subtitle || '' }}</div>
        <div class="text-sm text-[var(--c-muted)]">
          <div>时间：{{ activity?.start_at || '-' }} ~ {{ activity?.end_at || '-' }}</div>
          <div>地址：{{ activity?.location?.address || '-' }}</div>
          <div>报名：{{ Number(activity?.signup_count || 0) }}/{{ activity?.capacity ?? '不限' }}</div>
        </div>
        <div class="prose max-w-none whitespace-pre-wrap text-[var(--c-text)]">
          {{ activity?.description || '' }}
        </div>
      </div>
    </div>

    <div
      v-if="activity"
      class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-6 space-y-4"
    >
      <div class="text-lg font-extrabold text-[var(--c-text)]">报名</div>
      <el-alert
        v-if="!hasToken"
        type="warning"
        show-icon
        title="未登录"
        description="登录后可报名参加活动。"
      />

      <div v-if="activity.fee_type === 'paid'">
        <div class="text-sm font-semibold text-[var(--c-muted)] mb-2">票价档位</div>
        <el-radio-group v-model="form.ticket_tier_id">
          <el-radio v-for="t in activity.ticket_tiers || []" :key="t.tier_id" :value="t.tier_id">
            {{ t.name }} - ¥{{ pickPrice(t).toFixed(2) }}（剩余
            {{ Math.max(0, (t.stock || 0) - (t.sold || 0)) }}）
          </el-radio>
        </el-radio-group>
      </div>

      <div class="space-y-4">
        <div v-for="(f, idx) in activity.form_fields || []" :key="fieldKey(f, idx)">
          <div class="text-sm font-semibold text-[var(--c-muted)] mb-2">
            {{ f.label }}<span v-if="f.required" class="text-[var(--c-danger)]">*</span>
          </div>
          <el-input v-if="f.type === 'text'" v-model="form.answers[fieldKey(f, idx)]" placeholder="请输入" />
          <el-radio-group v-else-if="f.type === 'single'" v-model="form.answers[fieldKey(f, idx)]">
            <el-radio v-for="o in f.options || []" :key="o" :value="o">{{ o }}</el-radio>
          </el-radio-group>
          <el-checkbox-group v-else-if="f.type === 'multi'" v-model="form.answers[fieldKey(f, idx)]">
            <el-checkbox v-for="o in f.options || []" :key="o" :label="o">{{ o }}</el-checkbox>
          </el-checkbox-group>
          <el-upload
            v-else-if="f.type === 'file'"
            :auto-upload="false"
            :limit="1"
            :on-change="(file: any) => onFileChange(file, fieldKey(f, idx))"
          >
            <el-button>选择文件</el-button>
          </el-upload>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <el-button type="primary" :loading="submitting" @click="submit">提交报名</el-button>
      </div>
    </div>
  </main>
</template>
