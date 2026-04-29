<script setup lang="ts">
import { useRouter } from 'vue-router'
import UserRegister from '../components/auth/UserRegister.vue'
import { BadgeCheck, Eye, ShieldCheck } from 'lucide-vue-next'

const router = useRouter()

function goLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-[var(--c-bg)] flex items-center justify-center">
    <div class="max-w-6xl w-full mx-auto px-4 py-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div
          class="hidden lg:block bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-8 shadow-sm"
          aria-label="注册说明"
        >
          <div class="text-3xl font-extrabold text-[var(--c-text)]">创建你的账号</div>
          <div class="text-[var(--c-muted)] mt-3 leading-relaxed">
            注册后可同步购物车、保存地址、查看订单状态，并获得更准确的个性化推荐。
          </div>

          <div class="mt-8 space-y-3">
            <div class="flex items-start gap-3">
              <div
                class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center"
              >
                <ShieldCheck class="h-5 w-5 icon-tone--success" aria-hidden="true" />
              </div>
              <div>
                <div class="text-base font-extrabold text-[var(--c-text)]">隐私与安全</div>
                <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
                  登录过期会自动退出，避免账号被误用。
                </div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div
                class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center"
              >
                <BadgeCheck class="h-5 w-5 icon-tone--success" aria-hidden="true" />
              </div>
              <div>
                <div class="text-base font-extrabold text-[var(--c-text)]">无障碍支持</div>
                <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
                  支持大字号、高对比、清晰焦点与读屏播报。
                </div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div
                class="h-10 w-10 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] flex items-center justify-center"
              >
                <Eye class="h-5 w-5 icon-tone--info" aria-hidden="true" />
              </div>
              <div>
                <div class="text-base font-extrabold text-[var(--c-text)]">提示</div>
                <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
                  请使用常用手机号注册，便于后续找回与通知。
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-8 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-extrabold text-[var(--c-text)]">注册账号</div>
              <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">填写信息完成注册</div>
            </div>
            <el-button text @click="goLogin">去登录</el-button>
          </div>
          <UserRegister />
        </div>
      </div>
    </div>
  </div>
</template>
