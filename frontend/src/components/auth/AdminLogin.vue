<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { RefreshCw } from 'lucide-vue-next'

import { useAdminAuthStore } from '../../stores/adminAuth'
import { notify } from '@/utils/notify'
import { toZhAuthErrorMessage } from '@/utils/apiErrorZh'

const router = useRouter()
const auth = useAdminAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitError = ref('')

const form = reactive({
  phone: '',
  password: '',
  captcha: ''
})

const captchaCode = ref('ABCD')

const refreshCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let res = ''
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaCode.value = res
}

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
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value.toUpperCase() !== captchaCode.value) {
          callback(new Error('验证码错误'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

async function submit() {
  const inst = formRef.value
  if (!inst) return
  const ok = await inst.validate().catch(() => false)
  if (!ok) return

  loading.value = true
  submitError.value = ''
  try {
    await auth.login(form.phone.trim(), form.password)
    try {
      window.dispatchEvent(new Event('auth:admin_login'))
    } catch {}

    notify('管理员登录成功', { tone: 'success' })
    await router.replace('/admin')
  } catch (e: any) {
    const msg = toZhAuthErrorMessage(
      { status: e?.response?.status, message: e?.response?.data?.message || e?.message, url: '/api/admin/login' },
      '管理员登录失败'
    )
    submitError.value = msg
    notify(submitError.value, { tone: 'error', flash: true })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    class="mt-8 admin-login-form"
    label-position="top"
    status-icon
  >
    <el-form-item label="管理员账号 (手机号)" prop="phone">
      <el-input
        v-model="form.phone"
        placeholder="请输入管理员手机号"
        inputmode="numeric"
        autocomplete="tel"
      />
    </el-form-item>

    <el-form-item label="管理员密码" prop="password">
      <el-input
        v-model="form.password"
        type="password"
        show-password
        placeholder="请输入管理员密码"
        autocomplete="current-password"
      />
    </el-form-item>

    <el-form-item label="验证码" prop="captcha">
      <div class="flex items-center w-full gap-3">
        <el-input v-model="form.captcha" placeholder="请输入验证码" class="flex-1" @keyup.enter="submit" />
        <div
          class="h-10 px-4 bg-gray-100 border border-gray-200 rounded flex items-center justify-center cursor-pointer select-none tracking-widest font-bold text-gray-700 text-lg relative overflow-hidden group"
          @click="refreshCaptcha"
          title="点击刷新验证码"
        >
          <span class="relative z-10">{{ captchaCode }}</span>
          <div
            class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDIgMloiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')]"
          ></div>
        </div>
      </div>
    </el-form-item>

    <div
      v-if="submitError"
      class="mb-3 rounded-xl border-2 border-[var(--c-danger)]/40 bg-[var(--c-surface)] px-4 py-3 text-sm font-extrabold text-[var(--c-danger)]"
      role="alert"
      aria-live="assertive"
    >
      {{ submitError }}
    </div>

    <el-form-item class="mt-6">
      <el-button
        type="primary"
        class="w-full !bg-gray-800 !border-gray-800 hover:!bg-gray-700"
        :loading="loading"
        @click="submit"
      >
        登录后台
      </el-button>
    </el-form-item>
  </el-form>
</template>

<style>
/* 强制覆盖 element-plus 的错误提示样式为指定红色与 12px */
.admin-login-form .el-form-item__error {
  color: #e02020 !important;
  font-size: 12px !important;
}
</style>
