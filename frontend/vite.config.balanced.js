import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

// إعداد متوازن: عدد معقول من الملفات (10-15 ملف)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA مبسط جداً
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Plan',
        short_name: 'Plan',
        theme_color: '#3b82f6',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
      },
      devOptions: {
        enabled: false // تعطيل في Development
      }
    }),
    // Gzip فقط (بدون Brotli)
    viteCompression({
      verbose: false, // إخفاء الرسائل
      disable: false,
      threshold: 50240, // ضغط الملفات الأكبر من 50KB فقط
      algorithm: "gzip",
      ext: ".gz",
      deleteOriginFile: false,
    }),
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
    // تقسيم معقول
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // دمج كل node_modules في ملف واحد
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // دمج كل components التطبيق في ملف واحد
          if (id.includes('/src/')) {
            return 'app';
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
