import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import webExtension from 'vite-plugin-web-extension'
import path from 'path'
import baseManifest from './manifest.json'

export default defineConfig(({ mode }) => {
  const isFirefox = mode === 'firefox'

  function manifest() {
    if (!isFirefox) return baseManifest

    // Firefox doesn't support background.service_worker before v128.
    // Use background.scripts instead — works on all Firefox MV3 versions (109+).
    const { background: _bg, ...rest } = baseManifest as Record<string, unknown>
    return {
      ...rest,
      background: { scripts: ['src/background/index.ts'] },
      browser_specific_settings: {
        gecko: {
          id: 'lumina@lumina-extension',
          strict_min_version: '140.0',
          data_collection_permissions: {
            required: ['none'],
            optional: [],
          },
        },
      },
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      webExtension({
        manifest,
        browser: isFirefox ? 'firefox' : 'chrome',
      }),
    ],
    build: {
      outDir: isFirefox ? 'dist-firefox' : 'dist',
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
  }
})
