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
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }, 
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
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

function goRegister() {
  const q = route.query.redirect
  router.push({ path: '/register', query: typeof q === 'string' && q.length > 0 ? { redirect: q } : {} })
}
</script>

<template>
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
    <div class="flex items-center justify-center mt-1">
      <el-button text class="text-xs" @click="goRegister">没有账号？去注册</el-button>
    </div>
    <div class="text-xs text-gray-500 leading-relaxed text-center mt-2">
      登录即表示你同意平台服务条款与隐私政策。
    </div>
  </el-form>
</template>
