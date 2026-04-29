<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import http, { unwrap } from '@/api/http'
import { notify } from '@/utils/notify'
import { toZhAuthErrorMessage } from '@/utils/apiErrorZh'

const router = useRouter()
const route = useRoute()

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitError = ref('')

const form = reactive({
  username: '',
  phone: '',
  password: '',
  confirm_password: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, message: '用户名至少 2 个字符', trigger: 'blur' }
  ],
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
  ],
  confirm_password: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (String(value || '') !== String(form.password || '')) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
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
  submitError.value = ''
  try {
    const payload = {
      username: form.username.trim(),
      phone: form.phone.trim(),
      password: form.password
    }
    await http.post('/api/user/register', payload)

    let loginResp: any
    try {
      loginResp = await http.post('/api/user/login', { phone: payload.phone, password: payload.password })
    } catch (e: any) {
      submitError.value = '注册成功，但自动登录失败，请手动登录'
      notify(submitError.value, { tone: 'warning', flash: true })
      await router.replace('/login')
      return
    }
    const loginData = unwrap<{ tokens?: { access_token?: string; refresh_token?: string } }>(loginResp)
    const tokens = loginData?.tokens
    const accessToken = tokens?.access_token
    const refreshToken = tokens?.refresh_token
    if (!accessToken) {
      submitError.value = '注册成功，但自动登录失败，请手动登录'
      notify(submitError.value, { tone: 'warning', flash: true })
      await router.replace('/login')
      return
    }

    localStorage.setItem('access_token', String(accessToken))
    if (refreshToken) localStorage.setItem('refresh_token', String(refreshToken))

    notify('注册成功', { tone: 'success' })
    await router.replace(redirectTo.value)
  } catch (e: any) {
    const msg = toZhAuthErrorMessage(
      { status: e?.response?.status, message: e?.response?.data?.message || e?.message, url: '/api/user/register' },
      '注册失败'
    )
    submitError.value = msg
    notify(submitError.value, { tone: 'error', flash: true })
  } finally {
    loading.value = false
  }
}

watch(
  () => `${form.username}|${form.phone}|${form.password}|${form.confirm_password}`,
  () => {
    if (submitError.value) submitError.value = ''
  }
)
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" class="mt-8" label-position="top" status-icon>
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" placeholder="请输入用户名" autocomplete="username" />
    </el-form-item>
    <el-form-item label="手机号" prop="phone">
      <el-input
        v-model="form.phone"
        placeholder="请输入 11 位手机号"
        inputmode="numeric"
        autocomplete="tel"
      />
    </el-form-item>
    <el-form-item label="密码" prop="password">
      <el-input
        v-model="form.password"
        type="password"
        show-password
        placeholder="请输入密码"
        autocomplete="new-password"
      />
    </el-form-item>
    <el-form-item label="确认密码" prop="confirm_password">
      <el-input
        v-model="form.confirm_password"
        type="password"
        show-password
        placeholder="请再次输入密码"
        autocomplete="new-password"
        @keyup.enter="submit"
      />
    </el-form-item>
    <div
      v-if="submitError"
      class="mb-3 rounded-xl border-2 border-[var(--c-danger)]/40 bg-[var(--c-surface)] px-4 py-3 text-sm font-extrabold text-[var(--c-danger)]"
      role="alert"
      aria-live="assertive"
    >
      {{ submitError }}
    </div>
    <el-form-item class="mt-2">
      <el-button type="primary" class="w-full" :loading="loading" @click="submit">注册并登录</el-button>
    </el-form-item>
  </el-form>
</template>
