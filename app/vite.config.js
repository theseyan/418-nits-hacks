import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte()],
    server: {
        port: 8080,
    },
    resolve: {
        alias: {
            $ui: path.resolve("./src/lib/ui"),
        },
    },
})
