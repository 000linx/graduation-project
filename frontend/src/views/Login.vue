<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginMode } from '../hooks/useLoginMode'
import UserLogin from '../components/auth/UserLogin.vue'
import AdminLogin from '../components/auth/AdminLogin.vue'
import { ShieldAlert, User } from 'lucide-vue-next'
import { useUserAuthStore } from '../stores/userAuth'

const router = useRouter()
const { isUserMode, isAdminMode, toggleMode } = useLoginMode()
const userAuth = useUserAuthStore()

function goHome() {
  router.replace('/')
}

onMounted(async () => {
  if (isUserMode.value) {
    const ok = userAuth.verified ? true : await userAuth.verifyUser()
    if (ok) router.replace('/profile')
  }
})

// Keyboard accessible trigger
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    toggleMode()
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-[var(--c-bg)] flex items-center justify-center">
    <div class="max-w-6xl w-full mx-auto px-4 py-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <!-- 左侧信息区 -->
        <div class="hidden lg:block relative overflow-hidden transition-all duration-300">
          <transition name="fade-slide" mode="out-in">
            <div v-if="isUserMode" key="user-info">
              <div class="text-3xl font-extrabold text-[var(--c-text)]">欢迎回来</div>
              <div class="text-[var(--c-muted)] mt-3 leading-relaxed">
                一键登录，畅享极速下单与专属会员权益！
              </div>
              <div
                class="mt-8 bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-6 shadow-sm"
              >
                <div class="text-base text-[var(--c-text)] font-extrabold">提示</div>
                <ul class="mt-3 text-base text-[var(--c-muted)] space-y-2">
                  <li>· 使用手机号登录</li>
                  <li>· 若提示登录过期，请重新登录</li>
                  <li>· 修改密码后会自动退出</li>
                </ul>
              </div>
            </div>
            <div v-else key="admin-info">
              <div class="text-3xl font-extrabold text-[var(--c-text)]">管理后台</div>
              <div class="text-[var(--c-muted)] mt-3 leading-relaxed">
                您正在登录系统管理后台，请使用管理员账号授权进入。
              </div>
              <div
                class="mt-8 bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-6 shadow-sm"
              >
                <div class="text-base text-[var(--c-text)] font-extrabold flex items-center gap-2">
                  <ShieldAlert class="w-4 h-4 icon-tone--danger" />
                  安全提醒
                </div>
                <ul class="mt-3 text-base text-[var(--c-muted)] space-y-2">
                  <li>· 管理员操作将被全程审计记录</li>
                  <li>· 请勿在公共设备上保存后台密码</li>
                  <li>· 离开座位前请务必登出后台</li>
                </ul>
              </div>
            </div>
          </transition>
        </div>

        <!-- 右侧登录区 -->
        <div
          class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-8 shadow-sm relative transition-all duration-300"
        >
          <!-- 顶部区域 -->
          <div class="flex items-center justify-between mb-2">
            <transition name="fade-slide" mode="out-in">
              <div v-if="isUserMode" key="user-title">
                <div class="text-2xl font-extrabold text-[var(--c-text)]">用户登录</div>
                <div class="text-base text-[var(--c-muted)] mt-1">请输入手机号与密码</div>
              </div>
              <div v-else key="admin-title">
                <div class="text-2xl font-extrabold text-[var(--c-text)] flex items-center gap-2">
                  <ShieldAlert class="w-6 h-6 icon-tone--danger" />
                  管理员登录
                </div>
                <div class="text-base text-[var(--c-muted)] mt-1">仅授权管理员访问</div>
              </div>
            </transition>

            <el-button text @click="goHome" class="hidden sm:inline-flex">返回首页</el-button>
          </div>

          <!-- 登录表单区 -->
          <div class="min-h-[300px] relative">
            <transition name="fade-slide" mode="out-in">
              <UserLogin v-if="isUserMode" key="user-form" />
              <AdminLogin v-else key="admin-form" />
            </transition>
          </div>

          <!-- 底部切换区：满足键盘访问性，移动端 ≥48x48，视觉层级低，无刷新切换 -->
          <div class="mt-6 flex justify-center border-t border-[var(--c-border)] pt-6">
            <div
              role="button"
              tabindex="0"
              v-feedback
              class="switch-mode-btn group flex items-center justify-center gap-2 text-base font-extrabold text-[var(--c-muted)] rounded-lg cursor-pointer"
              @click="toggleMode"
              @keydown="onKeydown"
              :aria-label="isUserMode ? '切换到管理员登录' : '切换到用户登录'"
            >
              <span v-if="isUserMode" class="flex items-center gap-1.5 py-3 px-4">
                <ShieldAlert class="w-4 h-4 opacity-70 group-hover:opacity-100 icon-tone--danger" />
                后台登录
              </span>
              <span v-else class="flex items-center gap-1.5 py-3 px-4">
                <User class="w-4 h-4 opacity-70 group-hover:opacity-100" />
                用户登录
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 动画过渡，耗时 <= 300ms */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 保证移动端点击区域 >= 48x48 */
.switch-mode-btn {
  min-width: 48px;
  min-height: 48px;
}
</style>
