<script setup lang="ts">
import Header from './components/Header.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// @ts-ignore  // 临时忽略类型声明缺失，建议后续添加 element-plus.d.ts 声明文件
import { ElConfigProvider } from 'element-plus'
import { useA11yStore } from './stores/a11y'
import { useRecoStore } from './stores/reco'
import SpeechCaptionOverlay from './components/a11y/SpeechCaptionOverlay.vue'
import A11yBanner from './components/a11y/A11yBanner.vue'
import A11yLiveRegion from './components/a11y/A11yLiveRegion.vue'

const route = useRoute()
const isAdminRoute = computed(() => (route.path === '/admin' || route.path.startsWith('/admin/')) && route.path !== '/admin/login')

const a11y = useA11yStore()
a11y.init()
const reco = useRecoStore()
reco.init()

const elSize = computed(() => (a11y.fontScale >= 1.125 ? 'large' : 'default'))
</script>

<template>
  <el-config-provider :size="elSize">
    <router-view v-if="isAdminRoute" />
    <div v-else class="min-h-screen flex flex-col bg-[var(--c-bg)] text-[var(--c-text)]">
      <Header />
      <main class="flex-grow container mx-auto px-4 py-8">
        <router-view />
      </main>
      <footer class="border-t py-8 text-center text-[var(--c-muted)] bg-[var(--c-surface)] border-[var(--c-border)]">
        <p>&copy; 2024 助听器购物商城. All rights reserved.</p>
      </footer>
    </div>
    <A11yBanner />
    <SpeechCaptionOverlay />
    <A11yLiveRegion />
  </el-config-provider>
</template>
