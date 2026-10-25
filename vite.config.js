import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_APP_MODE: "site" (ibnrondonopolis.com), "membros" (membros.ibnrondonopolis.com) ou "admin" (admin.ibnrondonopolis.com)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const app = env.VITE_APP_MODE || 'site'
  const titulos = { membros: 'IBN Membros', admin: 'IBN Admin' }
  return {
    plugins: [
      react(),
      {
        name: 'ibn-app-mode',
        transformIndexHtml(html) {
          if (app === 'site') return html
          return html
            .replace('/site.webmanifest', `/manifest-${app}.webmanifest`)
            .replace('href="/apple-touch-icon.png"', app === 'admin' ? 'href="/apple-touch-icon-admin.png"' : 'href="/apple-touch-icon.png"')
            .replace('<meta name="apple-mobile-web-app-title" content="IBN Rondonópolis" />', `<meta name="apple-mobile-web-app-title" content="${titulos[app]}" />`)
            .replace(/<title>[^<]*<\/title>/, `<title>${titulos[app]} | IBN Rondonópolis</title>\n    <meta name="robots" content="noindex" />`)
            .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
        },
      },
    ],
    build: {
      rollupOptions: {
        output: { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'] } },
      },
    },
  }
})
