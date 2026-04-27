<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAdminAuthStore } from '../../stores/adminAuth'
import { useA11yStore } from '../../stores/a11y'
import http from '../../api/http'

const router = useRouter()
const route = useRoute()
const auth = useAdminAuthStore()
const a11y = useA11yStore()

const mobileNavOpen = ref(false)

const allNavItems = [
  { index: '/admin', label: '概览', perm: 'admin.stats.read' },
  { index: '/admin/users', label: '用户管理', perm: 'admin.users.read' },
  { index: '/admin/products', label: '商品管理', perm: 'admin.products.update' },
  { index: '/admin/orders', label: '订单管理', perm: 'admin.orders.read' },
  { index: '/admin/sales', label: '销售报表', perm: 'admin.stats.read' },
  { index: '/admin/audit', label: '审计日志', perm: 'admin.audit.read' }
] as const

function hasPermission(required: string) {
  const granted = new Set((auth.permissions || []).map(String))
  if (granted.has('*')) return true
  if (granted.has(required)) return true
  for (const p of granted) {
    if (p.endsWith('.*') && required.startsWith(p.slice(0, -1))) return true
  }
  return false
}

const navItems = computed(() => allNavItems.filter((it) => hasPermission(it.perm)))

const active = computed(() => {
  const p = route.path
  if (p.startsWith('/admin/users')) return '/admin/users'
  if (p.startsWith('/admin/products')) return '/admin/products'
  if (p.startsWith('/admin/orders')) return '/admin/orders'
  if (p.startsWith('/admin/sales')) return '/admin/sales'
  if (p.startsWith('/admin/audit')) return '/admin/audit'
  return '/admin'
})

async function logout() {
  try {
    await http.post('/api/admin/logout', { refresh_token: auth.refreshToken })
  } catch {
  } finally {
    auth.logout()
    ElMessage.success('已退出')
    router.replace('/')
  }
}

onMounted(() => {
  auth.syncFromStorage()
  if (auth.accessToken && !auth.verified) {
    auth.verifyAdmin().finally(() => {
      const items = navItems.value
      if (!items.length) {
        router.replace('/admin/forbidden')
        return
      }
      if (route.path === '/admin' && active.value === '/admin' && !hasPermission('admin.stats.read')) {
        router.replace(items[0].index)
      }
    })
    return
  }
  const items = navItems.value
  if (!items.length) {
    router.replace('/admin/forbidden')
    return
  }
  if (route.path === '/admin' && active.value === '/admin' && !hasPermission('admin.stats.read')) {
    router.replace(items[0].index)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="min-h-screen flex">
      <aside v-if="auth.isAuthed" class="hidden md:flex md:w-60 bg-white border-r flex-col">
        <div class="flex items-center px-5 border-b" :class="a11y.largeTextEnabled ? 'min-h-16 py-3' : 'h-16'">
          <div class="text-base font-semibold text-gray-900">管理后台</div>
        </div>
        <el-menu :default-active="active" router class="border-0 flex-1">
          <el-menu-item v-for="it in navItems" :key="it.index" :index="it.index">
            <span>{{ it.label }}</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <div class="flex-1 min-w-0">
        <header
          class="bg-white border-b flex items-center justify-between px-4 md:px-6"
          :class="a11y.largeTextEnabled ? 'min-h-16 py-3 flex-wrap gap-3' : 'h-16'"
        >
          <div class="flex items-center gap-3 min-w-0">
            <el-button v-if="auth.isAuthed" class="md:hidden" @click="mobileNavOpen = true">菜单</el-button>
            <div class="min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">{{ String(route.meta?.title ?? '后台管理') }}</div>
              <div class="text-xs text-gray-500 truncate">/admin</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div v-if="auth.userName || auth.userPhone" class="hidden sm:block text-sm text-gray-600">
              {{ auth.userName || auth.userPhone }}
            </div>
            <el-button v-if="auth.isAuthed" @click="logout">退出</el-button>
          </div>
        </header>

        <main class="p-4 md:p-6">
          <div class="max-w-6xl mx-auto">
            <router-view />
          </div>
        </main>
      </div>
    </div>
  </div>

  <el-drawer v-model="mobileNavOpen" title="后台菜单" direction="ltr" size="240px">
    <el-menu :default-active="active" router class="border-0" @select="mobileNavOpen = false">
      <el-menu-item v-for="it in navItems" :key="it.index" :index="it.index">
        <span>{{ it.label }}</span>
      </el-menu-item>
    </el-menu>
  </el-drawer>
</template>
