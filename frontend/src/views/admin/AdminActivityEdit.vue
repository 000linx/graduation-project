<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import http, { unwrap } from '@/api/http'

type TicketTier = {
  tier_id: string
  name: string
  price: number
  stock: number
  early_bird_price?: number | null
  early_bird_until?: string | null
}

type FormField = {
  field_id: string
  label: string
  type: 'text' | 'single' | 'multi' | 'file'
  required: boolean
  options: string[]
  options_text: string
}

type Activity = any

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id || ''))

const loading = ref(false)
const saving = ref(false)
const draftSaving = ref(false)
const lastDraftAt = ref<string>('')
const lastSaveAt = ref<string>('')

const fieldErrors = reactive<Record<string, string>>({})

const activity = ref<Activity | null>(null)

const form = reactive({
  name: '',
  subtitle: '',
  description: '',
  cover: '',
  location: { address: '', lat: null as number | null, lng: null as number | null },
  start_at: '',
  end_at: '',
  signup_deadline: '',
  publish_at: '',
  capacity: null as number | null,
  tagsText: '',
  fee_type: 'free' as 'free' | 'paid',
  ticket_tiers: [] as TicketTier[],
  form_fields: [] as FormField[]
})

const disableCriticalEdits = computed(() => {
  const a = activity.value
  return Boolean(a?.status === 'published' && a?.has_paid_orders)
})

function clearErrors() {
  for (const k of Object.keys(fieldErrors)) delete fieldErrors[k]
}

function normalizeFromServer(a: any) {
  form.name = String(a?.name || '')
  form.subtitle = String(a?.subtitle || '')
  form.description = String(a?.description || '')
  form.cover = String(a?.cover || '')
  form.location = {
    address: String(a?.location?.address || ''),
    lat: a?.location?.lat ?? null,
    lng: a?.location?.lng ?? null
  }
  form.start_at = a?.start_at ? String(a.start_at).replace(' ', 'T') : ''
  form.end_at = a?.end_at ? String(a.end_at).replace(' ', 'T') : ''
  form.signup_deadline = a?.signup_deadline ? String(a.signup_deadline).replace(' ', 'T') : ''
  form.publish_at = a?.publish_at ? String(a.publish_at).replace(' ', 'T') : ''
  form.capacity = a?.capacity ?? null
  form.tagsText = Array.isArray(a?.tags) ? a.tags.join(',') : ''
  form.fee_type = (a?.fee_type === 'paid' ? 'paid' : 'free') as any
  form.ticket_tiers = Array.isArray(a?.ticket_tiers)
    ? a.ticket_tiers.map((t: any) => ({
        tier_id: String(t?.tier_id || ''),
        name: String(t?.name || ''),
        price: Number(t?.price || 0),
        stock: Number(t?.stock || 0),
        early_bird_price: t?.early_bird_price ?? null,
        early_bird_until: t?.early_bird_until ? String(t.early_bird_until).replace(' ', 'T') : null
      }))
    : []
  form.form_fields = Array.isArray(a?.form_fields)
    ? a.form_fields.map((f: any) => ({
        field_id: String(f?.field_id || cryptoRandomId()),
        label: String(f?.label || ''),
        type: (f?.type || 'text') as any,
        required: Boolean(f?.required),
        options: Array.isArray(f?.options) ? f.options.map((x: any) => String(x)) : [],
        options_text: Array.isArray(f?.options) ? f.options.map((x: any) => String(x)).join(',') : ''
      }))
    : []
}

function toPayload() {
  const tags = String(form.tagsText || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  return {
    name: form.name,
    subtitle: form.subtitle,
    description: form.description,
    cover: form.cover,
    location: form.location,
    start_at: form.start_at,
    end_at: form.end_at,
    signup_deadline: form.signup_deadline || null,
    capacity: form.capacity,
    tags,
    fee_type: form.fee_type,
    ticket_tiers: form.ticket_tiers,
    form_fields: form.form_fields.map((f) => ({
      field_id: f.field_id,
      label: f.label,
      type: f.type,
      required: f.required,
      options: f.options
    }))
  }
}

async function fetchDetail() {
  loading.value = true
  try {
    const res = await http.get(`/api/admin/activities/${id.value}`)
    const a = unwrap(res) as any
    activity.value = a
    normalizeFromServer(a)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function saveDraft() {
  if (draftSaving.value) return
  draftSaving.value = true
  try {
    const res = await http.put(`/api/admin/activities/${id.value}/draft`, toPayload())
    const a = unwrap(res) as any
    activity.value = a
    lastDraftAt.value = new Date().toLocaleTimeString()
  } catch {
  } finally {
    draftSaving.value = false
  }
}

async function save() {
  clearErrors()
  try {
    await ElMessageBox.confirm('确认保存活动？保存会进行完整校验。', '二次确认', { type: 'warning' })
  } catch {
    return
  }
  saving.value = true
  try {
    const res = await http.put(`/api/admin/activities/${id.value}`, toPayload())
    const a = unwrap(res) as any
    activity.value = a
    lastSaveAt.value = new Date().toLocaleTimeString()
    ElMessage.success('保存成功')
  } catch (e: any) {
    const fields = e?.response?.data?.data?.fields
    if (fields && typeof fields === 'object') {
      for (const k of Object.keys(fields)) fieldErrors[k] = String(fields[k])
      ElMessage.error('校验失败，请检查红色提示字段')
    } else {
      ElMessage.error(e?.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

async function publishNow() {
  try {
    await ElMessageBox.confirm('确认立即发布活动？', '二次确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await http.post(`/api/admin/activities/${id.value}/publish`, { mode: 'now' })
    ElMessage.success('已发布')
    await fetchDetail()
  } catch (e: any) {
    ElMessage.error(e?.message || '发布失败')
  }
}

async function schedulePublish() {
  const publish_at = String(form.publish_at || '').trim()
  try {
    await ElMessageBox.confirm('确认定时发布？', '二次确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await http.post(`/api/admin/activities/${id.value}/publish`, { mode: 'schedule', publish_at })
    ElMessage.success('已设置定时发布')
    await fetchDetail()
  } catch (e: any) {
    ElMessage.error(e?.message || '设置失败')
  }
}

async function offline() {
  try {
    await ElMessageBox.confirm('确认强制下架该活动？', '二次确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await http.post(`/api/admin/activities/${id.value}/offline`, {})
    ElMessage.success('已下架')
    await fetchDetail()
  } catch (e: any) {
    ElMessage.error(e?.message || '下架失败')
  }
}

const versionsOpen = ref(false)
const versionsLoading = ref(false)
const versions = ref<any[]>([])

async function openVersions() {
  versionsOpen.value = true
  versionsLoading.value = true
  try {
    const res = await http.get(`/api/admin/activities/${id.value}/versions`)
    versions.value = unwrap(res) as any[]
  } catch (e: any) {
    ElMessage.error(e?.message || '加载版本失败')
  } finally {
    versionsLoading.value = false
  }
}

async function rollback(versionId: string) {
  try {
    await ElMessageBox.confirm('确认回滚到该版本？回滚会再次进行校验并生成新版本。', '二次确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await http.post(`/api/admin/activities/${id.value}/rollback`, { version_id: versionId })
    ElMessage.success('回滚成功')
    versionsOpen.value = false
    await fetchDetail()
  } catch (e: any) {
    const fields = e?.response?.data?.data?.fields
    if (fields && typeof fields === 'object') {
      for (const k of Object.keys(fields)) fieldErrors[k] = String(fields[k])
      ElMessage.error('回滚校验失败')
    } else {
      ElMessage.error(e?.message || '回滚失败')
    }
  }
}

function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function addTier() {
  form.ticket_tiers.push({
    tier_id: cryptoRandomId(),
    name: '',
    price: 0,
    stock: 0,
    early_bird_price: null,
    early_bird_until: null
  })
}

function removeTier(i: number) {
  form.ticket_tiers.splice(i, 1)
}

function addField() {
  form.form_fields.push({
    field_id: cryptoRandomId(),
    label: '',
    type: 'text',
    required: false,
    options: [],
    options_text: ''
  })
}

function removeField(i: number) {
  form.form_fields.splice(i, 1)
}

function moveField(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= form.form_fields.length) return
  const tmp = form.form_fields[i]
  form.form_fields[i] = form.form_fields[j]
  form.form_fields[j] = tmp
}

function updateFieldOptionsText(field: FormField, v: any) {
  field.options_text = String(v || '')
  field.options = field.options_text
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

async function compressCover(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })
    const targetW = Math.min(1200, img.width)
    const ratio = 16 / 9
    const srcW = img.width
    const srcH = img.height
    let cropW = srcW
    let cropH = Math.round(srcW / ratio)
    if (cropH > srcH) {
      cropH = srcH
      cropW = Math.round(srcH * ratio)
    }
    const sx = Math.round((srcW - cropW) / 2)
    const sy = Math.round((srcH - cropH) / 2)
    const scale = targetW / cropW
    const targetH = Math.round(cropH * scale)
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no ctx')
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, targetW, targetH)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function onCoverChange(file: any) {
  const raw = file?.raw as File
  if (!raw) return
  try {
    const dataUrl = await compressCover(raw)
    form.cover = dataUrl
    ElMessage.success('封面已处理（居中裁剪 16:9 + 压缩）')
  } catch {
    ElMessage.error('封面处理失败')
  }
}

const autosaveTimer = ref<number | null>(null)

onMounted(async () => {
  await fetchDetail()
  autosaveTimer.value = window.setInterval(() => {
    saveDraft()
  }, 30000)
})

onBeforeUnmount(() => {
  if (autosaveTimer.value != null) window.clearInterval(autosaveTimer.value)
})
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between gap-3 flex-nowrap overflow-x-auto">
      <div>
        <div class="text-xl font-extrabold">编辑活动</div>
        <div class="text-sm text-gray-500 mt-1">
          ID：{{ id }} <span v-if="activity?.status">｜状态：{{ activity.status }}</span>
        </div>
        <div class="text-xs text-gray-400 mt-1" v-if="lastDraftAt">草稿已自动保存：{{ lastDraftAt }}</div>
        <div class="text-xs text-gray-400 mt-1" v-if="lastSaveAt">上次保存：{{ lastSaveAt }}</div>
      </div>
      <div class="flex items-center gap-2 flex-nowrap overflow-x-auto">
        <el-button :loading="draftSaving" @click="saveDraft">手动保存草稿</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        <el-button type="success" plain @click="publishNow">立即发布</el-button>
        <el-button type="success" plain @click="schedulePublish">定时发布</el-button>
        <el-button type="warning" plain @click="offline">强制下架</el-button>
        <el-button @click="openVersions">版本历史</el-button>
        <el-button @click="router.push('/admin/activities')">返回列表</el-button>
      </div>
    </div>

    <el-alert
      v-if="disableCriticalEdits"
      type="warning"
      show-icon
      title="已有付费订单，禁止修改关键字段"
      description="该活动已发布且存在付费报名记录，仅允许修改描述/封面/地址/标签等不影响订单的数据。"
    />

    <div v-loading="loading" class="bg-white border rounded-2xl p-5 space-y-6">
      <div class="text-base font-extrabold">基础信息</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <el-form-item label="活动名称" required>
          <el-input v-model="form.name" placeholder="请输入活动名称" />
          <div v-if="fieldErrors.name" class="text-xs text-red-500 mt-1">{{ fieldErrors.name }}</div>
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" placeholder="请输入副标题" />
        </el-form-item>
        <el-form-item label="封面图（自动裁剪/压缩）">
          <div class="flex items-center gap-3 flex-nowrap overflow-x-auto">
            <el-upload :auto-upload="false" :limit="1" :on-change="onCoverChange">
              <el-button>选择图片</el-button>
            </el-upload>
            <img v-if="form.cover" :src="form.cover" class="w-40 h-24 object-cover rounded-lg border" />
          </div>
        </el-form-item>
        <el-form-item label="活动地址">
          <el-input v-model="form.location.address" placeholder="请输入活动地址" />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-input
            v-model="form.start_at"
            :disabled="disableCriticalEdits"
            placeholder="ISO 例如 2026-05-02T10:30"
          />
          <div v-if="fieldErrors.start_at" class="text-xs text-red-500 mt-1">{{ fieldErrors.start_at }}</div>
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-input
            v-model="form.end_at"
            :disabled="disableCriticalEdits"
            placeholder="ISO 例如 2026-05-02T12:00"
          />
          <div v-if="fieldErrors.end_at" class="text-xs text-red-500 mt-1">{{ fieldErrors.end_at }}</div>
        </el-form-item>
        <el-form-item label="报名截止时间">
          <el-input
            v-model="form.signup_deadline"
            :disabled="disableCriticalEdits"
            placeholder="ISO 例如 2026-05-01T18:00"
          />
          <div v-if="fieldErrors.signup_deadline" class="text-xs text-red-500 mt-1">
            {{ fieldErrors.signup_deadline }}
          </div>
        </el-form-item>
        <el-form-item label="定时发布时间">
          <el-input
            v-model="form.publish_at"
            :disabled="disableCriticalEdits"
            placeholder="ISO 例如 2026-05-01T20:00"
          />
        </el-form-item>
        <el-form-item label="人数上限">
          <el-input
            v-model.number="form.capacity"
            :disabled="disableCriticalEdits"
            placeholder="留空表示不限"
          />
          <div v-if="fieldErrors.capacity" class="text-xs text-red-500 mt-1">{{ fieldErrors.capacity }}</div>
        </el-form-item>
        <el-form-item label="活动标签（逗号分隔）" class="md:col-span-2">
          <el-input v-model="form.tagsText" placeholder="例如：新品,讲座,试听" />
        </el-form-item>
        <el-form-item label="详细描述" class="md:col-span-2">
          <el-input v-model="form.description" type="textarea" :rows="6" placeholder="请输入活动详细描述" />
        </el-form-item>
      </div>

      <div class="h-px bg-gray-100" />

      <div class="text-base font-extrabold">高级设置</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <el-form-item label="费用类型">
          <el-radio-group v-model="form.fee_type" :disabled="disableCriticalEdits">
            <el-radio value="free">免费</el-radio>
            <el-radio value="paid">付费</el-radio>
          </el-radio-group>
          <div v-if="fieldErrors.fee_type" class="text-xs text-red-500 mt-1">{{ fieldErrors.fee_type }}</div>
        </el-form-item>
      </div>

      <div v-if="form.fee_type === 'paid'" class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="font-semibold">票价档位</div>
          <el-button :disabled="disableCriticalEdits" @click="addTier">新增档位</el-button>
        </div>
        <div v-if="fieldErrors.ticket_tiers" class="text-xs text-red-500">{{ fieldErrors.ticket_tiers }}</div>
        <el-table :data="form.ticket_tiers" stripe size="small" class="rounded-2xl border">
          <el-table-column label="名称" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.name" :disabled="disableCriticalEdits" />
            </template>
          </el-table-column>
          <el-table-column label="价格" width="120">
            <template #default="{ row }">
              <el-input v-model.number="row.price" :disabled="disableCriticalEdits" />
            </template>
          </el-table-column>
          <el-table-column label="库存" width="120">
            <template #default="{ row }">
              <el-input v-model.number="row.stock" :disabled="disableCriticalEdits" />
            </template>
          </el-table-column>
          <el-table-column label="早鸟价" width="140">
            <template #default="{ row }">
              <el-input v-model.number="row.early_bird_price" :disabled="disableCriticalEdits" />
            </template>
          </el-table-column>
          <el-table-column label="早鸟截止" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.early_bird_until" :disabled="disableCriticalEdits" placeholder="ISO" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ $index }">
              <el-button link type="danger" :disabled="disableCriticalEdits" @click="removeTier($index)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="h-px bg-gray-100" />

      <div class="flex items-center justify-between">
        <div class="text-base font-extrabold">报名表单字段</div>
        <el-button @click="addField">新增字段</el-button>
      </div>
      <div v-if="fieldErrors.form_fields" class="text-xs text-red-500">{{ fieldErrors.form_fields }}</div>
      <div class="space-y-3">
        <div v-for="(f, idx) in form.form_fields" :key="f.field_id" class="border rounded-2xl p-4 bg-gray-50">
          <div class="flex items-center justify-between gap-2 flex-nowrap overflow-x-auto">
            <div class="font-semibold">字段 {{ idx + 1 }}</div>
            <div class="flex items-center gap-2">
              <el-button size="small" @click="moveField(idx, -1)" :disabled="idx === 0">上移</el-button>
              <el-button
                size="small"
                @click="moveField(idx, 1)"
                :disabled="idx === form.form_fields.length - 1"
                >下移</el-button
              >
              <el-button size="small" type="danger" plain @click="removeField(idx)">删除</el-button>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <el-input v-model="f.label" placeholder="字段名称" />
            <el-select v-model="f.type" placeholder="类型" style="width: 100%">
              <el-option label="文本" value="text" />
              <el-option label="单选" value="single" />
              <el-option label="多选" value="multi" />
              <el-option label="文件" value="file" />
            </el-select>
            <el-switch v-model="f.required" active-text="必填" inactive-text="选填" />
          </div>
          <div v-if="['single', 'multi'].includes(f.type)" class="mt-3">
            <div class="text-sm text-gray-500 mb-1">选项（逗号分隔）</div>
            <el-input v-model="f.options_text" @input="updateFieldOptionsText(f, $event)" />
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="versionsOpen" title="版本历史" width="860px">
      <div v-loading="versionsLoading">
        <el-table :data="versions" stripe size="small" class="rounded-2xl border">
          <el-table-column prop="version_no" label="版本" width="80" />
          <el-table-column prop="action" label="动作" width="120" />
          <el-table-column prop="actor_admin_id" label="管理员" min-width="160" show-overflow-tooltip />
          <el-table-column prop="created_at" label="时间" min-width="180" show-overflow-tooltip />
          <el-table-column label="变更字段摘要" min-width="260">
            <template #default="{ row }">
              <div class="text-xs text-gray-600">
                {{ Array.isArray(row.changed_summary) ? row.changed_summary.join(', ') : '' }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="warning" @click="rollback(row._id)">回滚</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="versionsOpen = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
