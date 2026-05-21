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
  submitError.value = ''
  try {
    const resp = await http.post('/api/user/login', {
      phone: form.phone.trim(),
      password: form.password
    })
    unwrap(resp)

    notify('登录成功', { tone: 'success' })
    await router.replace(redirectTo.value)
  } catch (e: any) {
    const msg = toZhAuthErrorMessage(
      {
        status: e?.response?.status,
        message: e?.response?.data?.message || e?.message,
        url: '/api/user/login'
      },
      '登录失败'
    )
    submitError.value = msg
    notify(submitError.value, { tone: 'error', flash: true })
  } finally {
    loading.value = false
  }
}

function goRegister() {
  const q = route.query.redirect
  router.push({ path: '/register', query: typeof q === 'string' && q.length > 0 ? { redirect: q } : {} })
}

watch(
  () => `${form.phone}|${form.password}`,
  () => {
    if (submitError.value) submitError.value = ''
  }
)
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" class="mt-8" label-position="top" status-icon>
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
        autocomplete="current-password"
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
