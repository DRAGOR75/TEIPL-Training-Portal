import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [], // We can add setup files here later if needed
        exclude: [...configDefaults.exclude, 'tests/e2e/**'],
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
})
