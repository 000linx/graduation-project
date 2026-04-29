<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElForm, ElMessageBox } from 'element-plus'
import http, { unwrap } from '../../api/http'

type Product = {
  _id: string
  name: string
  description?: string
  price: number
  stock: number
  category: string
  image_url?: string
}

const categories = ['全部', '耳背式', '耳内式', '隐形式', '充电款']

const loading = ref(false)
const forbidden = ref(false)
const error = ref<string | null>(null)
const items = ref<Product[]>([])
const activeCategory = ref('全部')
const keyword = ref('')

const editorOpen = ref(false)
const dialogLoading = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<InstanceType<typeof ElForm> | null>(null)

const form = reactive({
  name: '',
  category: '',
  price: 0,
  stock: 0,
  description: '',
  image_url: ''
})

const isEdit = computed(() => Boolean(editingId.value))

function resetForm() {
  form.name = ''
  form.category = ''
  form.price = 0
  form.stock = 0
  form.description = ''
  form.image_url = ''
  editingId.value = null
}

function openCreate() {
  resetForm()
  editorOpen.value = true
}

function openEdit(row: Product) {
  form.name = row.name
  form.category = row.category
  form.price = Number(row.price || 0)
  form.stock = Number(row.stock || 0)
  form.description = row.description || ''
  form.image_url = row.image_url || ''
  editingId.value = row._id
  editorOpen.value = true
}

const filteredItems = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return items.value
  return items.value.filter((p) => {
    const s = `${p.name ?? ''} ${p.category ?? ''} ${p._id ?? ''}`.toLowerCase()
    return s.includes(k)
  })
})

async function fetchProducts() {
  loading.value = true
  forbidden.value = false
  error.value = null
  try {
    const params: Record<string, string> = {}
    if (activeCategory.value && activeCategory.value !== '全部') params.category = activeCategory.value
    const resp = await http.get('/api/product/list', { params })
    const data = unwrap<{ products: any[] }>(resp)
    const list = Array.isArray(data?.products) ? data.products : []
    items.value = list.map((p) => ({
      _id: String(p._id),
      name: String(p.name ?? ''),
      description: p.description ? String(p.description) : '',
      price: Number(p.price ?? 0),
      stock: Number(p.stock ?? 0),
      category: String(p.category ?? ''),
      image_url: p.image_url ? String(p.image_url) : ''
    }))
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 403) forbidden.value = true
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!formRef.value) return
  await formRef.value.validate()
  dialogLoading.value = true
  try {
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description || '',
      image_url: form.image_url || undefined
    }
    if (editingId.value) {
      await http.put(`/api/admin/products/${editingId.value}`, payload)
    } else {
      await http.post('/api/admin/products', payload)
    }
    editorOpen.value = false
    await fetchProducts()
  } finally {
    dialogLoading.value = false
  }
}

async function remove(row: Product) {
  const ok = await ElMessageBox.confirm(`确认删除商品 ${row.name}？`, '确认删除', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(
    () => true,
    () => false
  )
  if (!ok) return
  await http.delete(`/api/admin/products/${row._id}`)
  await fetchProducts()
}

watch(activeCategory, fetchProducts)
onMounted(fetchProducts)
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div class="text-2xl font-semibold text-gray-900">商品管理</div>
        <div class="text-sm text-gray-500 mt-1">新增、编辑与维护库存</div>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <el-input v-model="keyword" placeholder="搜索名称/分类/ID" style="width: 220px" clearable />
        <el-select v-model="activeCategory" style="width: 160px" placeholder="分类">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button type="primary" @click="openCreate">新增商品</el-button>
        <el-button :loading="loading" @click="fetchProducts">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="forbidden"
      type="error"
      show-icon
      title="无权限"
      description="当前账号不是管理员，无法访问商品管理。"
    />
    <el-alert v-else-if="error" type="error" show-icon :title="error" />

    <el-table
      v-loading="loading"
      :data="filteredItems"
      stripe
      size="small"
      class="bg-white rounded-2xl border"
    >
      <el-table-column prop="name" label="名称" min-width="220" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column prop="price" label="价格" width="120">
        <template #default="{ row }">¥{{ Number(row.price || 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="120" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer
      v-model="editorOpen"
      :title="isEdit ? '编辑商品' : '新增商品'"
      size="520px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" label-width="84px" class="mt-2">
        <el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入名称' }]">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="category" :rules="[{ required: true, message: '请选择分类' }]">
          <el-select v-model="form.category" placeholder="选择分类" class="w-full">
            <el-option v-for="c in categories.filter((x) => x !== '全部')" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price" :rules="[{ required: true, message: '请输入价格' }]">
          <el-input-number v-model="form.price" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item label="库存" prop="stock" :rules="[{ required: true, message: '请输入库存' }]">
          <el-input-number v-model="form.stock" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item label="图片URL">
          <el-input v-model="form.image_url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editorOpen = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="submit">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>
