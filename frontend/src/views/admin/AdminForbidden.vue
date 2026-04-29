<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from '../../stores/adminAuth'

const router = useRouter()
const auth = useAdminAuthStore()

function goHome() {
  router.replace('/')
}

function goAdminLogin() {
  auth.logout()
  router.replace('/admin/login')
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-[var(--c-bg)] flex items-center justify-center">
    <div class="max-w-xl w-full mx-auto px-4 py-10">
      <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-8 shadow-sm">
        <div class="text-2xl font-extrabold text-[var(--c-text)]">无权限访问</div>
        <div class="text-base text-[var(--c-muted)] mt-2 leading-relaxed">
          仅授权管理员可访问管理后台。请使用管理员账号登录，或返回首页继续浏览。
        </div>
        <div class="mt-6 flex flex-col sm:flex-row gap-3">
          <el-button type="primary" class="a11y-hit" @click="goAdminLogin">去管理员登录</el-button>
          <el-button class="a11y-hit" @click="goHome">返回首页</el-button>
        </div>
      </div>
    </div>
  </div>
</template>
