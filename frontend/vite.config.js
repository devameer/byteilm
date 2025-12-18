import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA Configuration
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Plan - نظام إدارة التعلم',
        short_name: 'Plan',
        description: 'منصة تعليمية متكاملة لإدارة الدورات والمحتوى التعليمي',
        theme_color: '#3b82f6',
        background_color: '#1f2937',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        dir: 'rtl',
        lang: 'ar',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Pre-cache فقط الملفات الأساسية
        globPatterns: ['**/*.{js,css,html,ico}'],
        // تقليل عدد الملفات المخزنة
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB max
      },
      devOptions: {
        enabled: true // Enable PWA in dev mode for testing
      }
    }),
    // Gzip compression - فقط للملفات الكبيرة
    viteCompression({
      verbose: false, // إخفاء الرسائل
      disable: false,
      threshold: 100240, // فقط للملفات الأكبر من 100KB
      algorithm: "gzip",
      ext: ".gz",
      deleteOriginFile: false,
    }),
    // تعطيل Brotli compression لتقليل عدد الملفات
    // viteCompression({
    //   verbose: false,
    //   disable: false,
    //   threshold: 100240,
    //   algorithm: "brotliCompress",
    //   ext: ".br",
    //   deleteOriginFile: false,
    // }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/sanctum": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/storage": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Code splitting محسّن - يحمل فقط ما تحتاجه
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // دمج المكتبات الكبيرة في ملفات منفصلة
          if (id.includes('node_modules')) {
            // مكتبات كبيرة - كل واحدة في ملف منفصل
            if (id.includes('fullcalendar')) return 'fullcalendar';
            if (id.includes('chart.js') || id.includes('react-chartjs')) return 'charts';
            if (id.includes('video.js') || id.includes('react-player')) return 'video';

            // React core - ملف منفصل
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }

            // باقي المكتبات في vendor
            return 'vendor';
          }

          // ⚠️ لا تدمج الصفحات - دعها تُحمّل عند الطلب (Lazy Loading)
          // كل صفحة ستكون في ملف منفصل يُحمّل عند زيارتها فقط

          // دمج Components المشتركة فقط
          if (id.includes('/src/components/') && !id.includes('/pages/')) {
            return 'components';
          }

          // Hooks و Services و Contexts - ملف واحد
          if (id.includes('/src/hooks/') ||
              id.includes('/src/services/') ||
              id.includes('/src/contexts/')) {
            return 'app-core';
          }
        },
        // أسماء ملفات مع hash للتخزين المؤقت
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
    },
    chunkSizeWarningLimit: 2000,
    minify: "esbuild",
  },
});
