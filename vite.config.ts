import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "sitemap.xml",
        "browserconfig.xml",
        "pwa-*.png",
        "icons/*.png",
        "screenshots/*.png",
      ],
      manifest: {
        name: "نوبهار - جامعه نخبگان",
        short_name: "نوبهار",
        description: "پلتفرم انتشار محتوای تخصصی برای نخبگان ایرانی. مقالات علمی، تحلیلی و فرهنگی با کیفیت بالا.",
        start_url: "/",
        id: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        background_color: "#faf8f5",
        theme_color: "#0f766e",
        orientation: "portrait-primary",
        dir: "rtl",
        lang: "fa-IR",
        prefer_related_applications: false,
        categories: ["news", "social", "education", "lifestyle"],
        icons: [
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/screenshots/mobile-home.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "صفحه اصلی نوبهار",
          },
          {
            src: "/screenshots/mobile-article.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "مشاهده مقاله",
          },
          {
            src: "/screenshots/desktop-home.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "صفحه اصلی دسکتاپ",
          },
        ],
        shortcuts: [
          {
            name: "نوشتن مقاله",
            short_name: "نوشتن",
            description: "نوشتن مقاله جدید",
            url: "/write",
          },
          {
            name: "ذخیره‌شده‌ها",
            short_name: "ذخیره‌ها",
            description: "مقالات ذخیره شده شما",
            url: "/bookmarks",
          },
          {
            name: "اعلانات",
            short_name: "اعلانات",
            description: "مشاهده اعلانات",
            url: "/notifications",
          },
        ],
        share_target: {
          action: "/write",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url",
          },
        },
        handle_links: "preferred",
        iarc_rating_id: "",
        protocol_handlers: [
          {
            protocol: "web+nawbahar",
            url: "/article/%s",
          },
        ],
        launch_handler: {
          client_mode: ["navigate-existing", "auto"],
        },
        edge_side_panel: {
          preferred_width: 400,
        },
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webp,jpg,jpeg}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/auth/, /^\/~oauth/],
        importScripts: ['/sw-push.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/articles/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "articles-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/profiles/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "profiles-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "external-images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: "module",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
        },
      },
    },
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
}));
