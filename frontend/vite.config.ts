import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      dts: 'auto-imports.d.ts',
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      dts: 'components.d.ts',
      resolvers: [ElementPlusResolver({ importStyle: 'css' })],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    cssCodeSplit: false,
    target: 'es2020',
    minify: 'esbuild',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus')) return 'vendor_element'
            if (id.includes('echarts')) return 'vendor_charts'
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vendor_vue'
            if (id.includes('axios')) return 'vendor_axios'
            if (id.includes('lucide')) return 'vendor_icons'
            return 'vendor'
          }
        },
      },
    },
  },
})
