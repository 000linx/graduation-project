<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  phone: '',
  password: ''
})

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const v = String(value || '').trim()
        if (!/^1\d{10}$/.test(v)) callback(new Error('请输入 11 位手机号'))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位', trigger: 'blur' }]
}

const redirectTo = computed(() => {
  const q = route.query.redirect
  return typeof q === 'string' && q.length > 0 ? q : '/profile'
})

async function submit() {
  const inst = formRef.value
  if (!inst) return
  const ok = await inst.validate().catch(() => false)
  if (!ok) return

  loading.value = true
  try {
    const resp = await axios.post('/api/user/login', {
      phone: form.phone.trim(),
      password: form.password
    })
    const tokens = resp?.data?.data?.tokens
    const accessToken = tokens?.access_token
    const refreshToken = tokens?.refresh_token
    if (!accessToken) {
      ElMessage.error('登录失败：未获取到令牌')
      return
    }

    localStorage.setItem('access_token', String(accessToken))
    if (refreshToken) localStorage.setItem('refresh_token', String(refreshToken))

    ElMessage.success('登录成功')
    await router.replace(redirectTo.value)
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '登录失败'
    ElMessage.error(String(msg))
  } finally {
    loading.value = false
  }
}

function goHome() {
  router.replace('/')
}

onMounted(() => {
  const token = localStorage.getItem('access_token')
  if (token) router.replace(redirectTo.value)
})
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 py-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div class="hidden lg:block">
          <div class="text-3xl font-extrabold text-gray-900">欢迎回来</div>
          <div class="text-gray-500 mt-3 leading-relaxed">
            登录后可查看订单、进行支付、提交评价与售后申请。
          </div>
          <div class="mt-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div class="text-sm text-gray-600">提示</div>
            <ul class="mt-3 text-sm text-gray-500 space-y-2">
              <li>· 使用手机号登录</li>
              <li>· 若提示登录过期，请重新登录</li>
              <li>· 修改密码后会自动退出</li>
            </ul>
          </div>
        </div>

        <div class="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-gray-900">用户登录</div>
              <div class="text-sm text-gray-500 mt-1">请输入手机号与密码</div>
            </div>
            <el-button text @click="goHome">返回首页</el-button>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" class="mt-8" label-position="top" status-icon>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入 11 位手机号" inputmode="numeric" autocomplete="tel" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" autocomplete="current-password" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" class="w-full" :loading="loading" @click="submit">登录</el-button>
            </el-form-item>
            <div class="text-xs text-gray-500 leading-relaxed">
              登录即表示你同意平台服务条款与隐私政策。
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>
