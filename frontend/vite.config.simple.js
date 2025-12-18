import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// إعداد بسيط: ملفات قليلة جداً
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA بسيط جداً
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        // حفظ الملفات الأساسية فقط (ليس كل assets)
        globPatterns: ['index.html', 'assets/index.js', 'assets/app.css'],
        globIgnores: ['assets/Calendar*.js'], // تجاهل ملفات كبيرة
      },
      devOptions: {
        enabled: false
      }
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
    // دمج كل شيء في ملف واحد (أو عدد قليل جداً)
    rollupOptions: {
      output: {
        // لا code splitting - كل شيء في ملف واحد
        manualChunks: undefined,
        // أسماء ملفات بسيطة
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      },
    },
    // تعطيل التحذيرات
    chunkSizeWarningLimit: 5000,
    // تصغير سريع
    minify: "esbuild",
  },
});
