import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      },
      external: [
        'node-telegram-bot-api',
        'ssh2',
        'mysql2',
        'node-cron',
        'util',
        'events',
        'path',
        'child_process',
        'querystring',
        'stream',
        'url',
        'fs',
        'https',
        'http',
        'os',
        'tls',
        'crypto',
        'net',
        'dns',
        'process',
        'timers',
        'zlib',
        'buffer',
        'assert'
      ]
    },
    minify: false,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
