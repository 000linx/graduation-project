<script setup lang="ts">
import Header from './components/Header.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isAdminRoute = computed(() => route.path === '/admin' || route.path.startsWith('/admin/'))
</script>

<template>
  <router-view v-if="isAdminRoute" />
  <div v-else class="min-h-screen bg-gray-50 flex flex-col">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <router-view />
    </main>
    <footer class="bg-white border-t py-8 text-center text-gray-500">
      <p>&copy; 2024 助听器购物商城. All rights reserved.</p>
    </footer>
  </div>
</template>

<style>
body {
  @apply bg-gray-50 text-gray-900;
}
</style>
