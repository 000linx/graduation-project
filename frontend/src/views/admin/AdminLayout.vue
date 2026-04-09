<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAdminAuthStore } from '../../stores/adminAuth'
import http from '../../api/http'

const router = useRouter()
const route = useRoute()
const auth = useAdminAuthStore()

const mobileNavOpen = ref(false)
const loginLoading = ref(false)
const loginError = ref<string | null>(null)

const form = reactive({
  phone: '',
  password: ''
})

const navItems = [
  { index: '/admin', label: '概览' },
  { index: '/admin/users', label: '用户管理' },
  { index: '/admin/products', label: '商品管理' },
  { index: '/admin/orders', label: '订单管理' }
]

const active = computed(() => {
  const p = route.path
  if (p.startsWith('/admin/users')) return '/admin/users'
  if (p.startsWith('/admin/products')) return '/admin/products'
  if (p.startsWith('/admin/orders')) return '/admin/orders'
  return '/admin'
})

async function submitLogin() {
  loginLoading.value = true
  loginError.value = null
  try {
    await auth.login(form.phone.trim(), form.password)
    ElMessage.success('登录成功')
    await router.replace(active.value)
  } catch (e: any) {
    loginError.value = e?.response?.data?.message || e?.message || '登录失败'
  } finally {
    loginLoading.value = false
  }
}

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
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="min-h-screen flex">
      <aside v-if="auth.isAuthed" class="hidden md:flex md:w-60 bg-white border-r flex-col">
        <div class="h-16 flex items-center px-5 border-b">
          <div class="text-base font-semibold text-gray-900">管理后台</div>
        </div>
        <el-menu :default-active="active" router class="border-0 flex-1">
          <el-menu-item v-for="it in navItems" :key="it.index" :index="it.index">
            <span>{{ it.label }}</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <div class="flex-1 min-w-0">
        <header class="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
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
            <router-view v-if="auth.isAuthed" />

            <div v-else class="max-w-md mx-auto mt-12 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div class="text-lg font-semibold text-gray-900">管理员登录</div>
              <div class="text-sm text-gray-500 mt-1">请输入管理员账号登录后访问后台功能</div>
              <div v-if="loginError" class="text-sm text-red-600 mt-3">{{ loginError }}</div>
              <div class="mt-5 space-y-4">
                <el-input v-model="form.phone" placeholder="手机号" />
                <el-input v-model="form.password" type="password" show-password placeholder="密码" />
                <el-button type="primary" class="w-full" :loading="loginLoading" @click="submitLogin">登录</el-button>
              </div>
            </div>
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
