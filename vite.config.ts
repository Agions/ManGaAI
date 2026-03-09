import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
    }),
  ],

  esbuild: {
    jsx: 'automatic',
  },

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
    optimizeDeps: {
      exclude: [
        '@tauri-apps/api',
        '@tauri-apps/api/core',
        '@tauri-apps/api/tauri',
        '@tauri-apps/api/event',
        '@tauri-apps/api/dialog',
        '@tauri-apps/api/fs',
        '@tauri-apps/api/path',
        '@tauri-apps/api/notification',
        '@tauri-apps/api/window',
        '@tauri-apps/api/shell',
      ],
    },
    ssr: {
      external: [
        '@tauri-apps/api',
        '@tauri-apps/api/core',
        '@tauri-apps/api/tauri',
        '@tauri-apps/api/event',
        '@tauri-apps/api/dialog',
        '@tauri-apps/api/fs',
        '@tauri-apps/api/path',
        '@tauri-apps/api/notification',
        '@tauri-apps/api/window',
        '@tauri-apps/api/shell',
      ],
    },
  },

  preview: {
    port: 1420,
    strictPort: true,
  },

  css: {
    devSourcemap: true,
    minify: true,
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          '@primary-color': '#1890ff',
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    minify: 'terser',
    target: 'esnext',
    // `antd-core` 当前约 900KB，先将阈值调到 1MB，避免 CI 被非阻塞告警淹没
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      external: [
        '@tauri-apps/api',
        '@tauri-apps/api/core',
        '@tauri-apps/api/tauri',
        '@tauri-apps/api/event',
        '@tauri-apps/api/dialog',
        '@tauri-apps/api/fs',
        '@tauri-apps/api/path',
        '@tauri-apps/api/notification',
        '@tauri-apps/api/window',
        '@tauri-apps/api/shell',
      ],
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/@ant-design/icons')) {
            return 'antd-icons'
          }
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) {
            if (id.includes('antd/es/locale')) return 'antd-locale'
            if (id.includes('antd/es/date-picker') || id.includes('antd/es/calendar')) return 'antd-date'
            if (id.includes('antd/es/table')) return 'antd-table'
            if (id.includes('antd/es/form')) return 'antd-form'
            if (id.includes('antd/es/select') || id.includes('antd/es/tree-select')) return 'antd-select'
            if (id.includes('antd/es/modal') || id.includes('antd/es/drawer')) return 'antd-overlay'
            if (id.includes('antd/es/upload')) return 'antd-upload'
            if (
              id.includes('antd/es/layout') ||
              id.includes('antd/es/menu') ||
              id.includes('antd/es/dropdown') ||
              id.includes('antd/es/breadcrumb') ||
              id.includes('antd/es/tabs')
            ) return 'antd-navigation'
            if (
              id.includes('antd/es/button') ||
              id.includes('antd/es/space') ||
              id.includes('antd/es/grid') ||
              id.includes('antd/es/typography') ||
              id.includes('antd/es/divider') ||
              id.includes('antd/es/tag') ||
              id.includes('antd/es/badge')
            ) return 'antd-basic'
            if (
              id.includes('antd/es/input') ||
              id.includes('antd/es/checkbox') ||
              id.includes('antd/es/radio') ||
              id.includes('antd/es/switch') ||
              id.includes('antd/es/slider') ||
              id.includes('antd/es/input-number') ||
              id.includes('antd/es/color-picker')
            ) return 'antd-input'
            if (
              id.includes('antd/es/message') ||
              id.includes('antd/es/notification') ||
              id.includes('antd/es/alert') ||
              id.includes('antd/es/spin') ||
              id.includes('antd/es/skeleton') ||
              id.includes('antd/es/result') ||
              id.includes('antd/es/empty') ||
              id.includes('antd/es/progress') ||
              id.includes('antd/es/statistic')
            ) return 'antd-feedback'
            if (
              id.includes('antd/es/card') ||
              id.includes('antd/es/list') ||
              id.includes('antd/es/descriptions') ||
              id.includes('antd/es/collapse') ||
              id.includes('antd/es/steps') ||
              id.includes('antd/es/timeline') ||
              id.includes('antd/es/tooltip') ||
              id.includes('antd/es/popover')
            ) return 'antd-display'
            return 'antd-core'
          }
          if (id.includes('node_modules/axios') || id.includes('node_modules/uuid')) {
            return 'utils-vendor'
          }
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor'
          }
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'i18n-vendor'
          }
          if (id.includes('html2canvas')) {
            return 'html2canvas'
          }
        },
      },
    },
  },
})
