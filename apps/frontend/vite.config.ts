import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import istanbul from 'vite-plugin-istanbul'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(),
        istanbul({
            include: 'src/*',
            exclude: ['node_modules', 'test/'],
            extension: ['.js', '.jsx', '.ts', '.tsx'],
            requireEnv: true,
        }),
    ],
})
