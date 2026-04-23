<script setup lang="ts">
import { useRouter } from 'vue-router'
import UserRegister from '../components/auth/UserRegister.vue'

const router = useRouter()

function goLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
    <div class="max-w-md w-full mx-auto px-4 py-10">
      <div class="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-bold text-gray-900">注册账号</div>
            <div class="text-sm text-gray-500 mt-1">填写信息完成注册</div>
          </div>
          <el-button text @click="goLogin">去登录</el-button>
        </div>
        <UserRegister />
      </div>
    </div>
  </div>
</template>

