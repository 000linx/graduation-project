<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import http, { unwrap } from '../../api/http'

type AdminUser = {
  _id: string
  username?: string
  phone?: string
  role?: 'user' | 'admin'
  created_at?: string
}

const loading = ref(false)
const forbidden = ref(false)
const error = ref<string | null>(null)
const users = ref<AdminUser[]>([])

const keyword = ref('')
const detailOpen = ref(false)
const activeUser = ref<AdminUser | null>(null)

const filteredUsers = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return users.value
  return users.value.filter((u) => {
    const s = `${u.username ?? ''} ${u.phone ?? ''} ${u._id ?? ''}`.toLowerCase()
    return s.includes(k)
  })
})

async function fetchUsers() {
  loading.value = true
  forbidden.value = false
  error.value = null
  try {
    const resp = await http.get('/api/admin/users')
    const data = unwrap<{ users: AdminUser[] }>(resp)
    users.value = Array.isArray(data?.users) ? data.users : []
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 403) forbidden.value = true
    error.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function toggleRole(row: AdminUser) {
  const nextRole = row.role === 'admin' ? 'user' : 'admin'
  const ok = await ElMessageBox.confirm(
    `确认将用户 ${row.phone || row.username || row._id} 设置为 ${nextRole === 'admin' ? '管理员' : '普通用户'}？`,
    '确认操作',
    { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
  ).then(
    () => true,
    () => false
  )
  if (!ok) return

  await http.put(`/api/admin/users/${row._id}/role`, { role: nextRole })
  row.role = nextRole
}

function openDetail(row: AdminUser) {
  activeUser.value = row
  detailOpen.value = true
}

onMounted(fetchUsers)
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div class="text-2xl font-semibold text-gray-900">用户管理</div>
        <div class="text-sm text-gray-500 mt-1">查看用户列表并维护角色</div>
      </div>
      <div class="flex items-center gap-3">
        <el-input v-model="keyword" placeholder="搜索用户名/手机号/ID" style="width: 220px" clearable />
        <el-button :loading="loading" @click="fetchUsers">刷新</el-button>
      </div>
    </div>

    <el-alert v-if="forbidden" type="error" show-icon title="无权限" description="当前账号不是管理员，无法访问用户管理。" />
    <el-alert v-else-if="error" type="error" show-icon :title="error" />

    <el-table v-loading="loading" :data="filteredUsers" stripe size="small" class="bg-white rounded-2xl border">
      <el-table-column prop="username" label="用户名" min-width="140" show-overflow-tooltip />
      <el-table-column prop="phone" label="手机号" min-width="180" show-overflow-tooltip />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">{{ row.role === 'admin' ? '管理员' : '用户' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDetail(row)">详情</el-button>
          <el-button type="primary" link @click="toggleRole(row)">
            {{ row.role === 'admin' ? '设为用户' : '设为管理员' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <el-drawer v-model="detailOpen" title="用户详情" size="420px">
    <div v-if="activeUser" class="space-y-4">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户ID">{{ activeUser._id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ activeUser.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ activeUser.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ activeUser.role === 'admin' ? '管理员' : '用户' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ activeUser.created_at || '-' }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </el-drawer>
</template>
