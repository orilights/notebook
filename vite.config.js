import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    base: path.resolve(__dirname, './dist/')
})