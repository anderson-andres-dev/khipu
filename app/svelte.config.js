// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  // El cargador de CSS virtual de vite-plugin-svelte puede recibir la
  // peticion del <style> antes de que exista el resultado compilado y termina
  // sirviendo el .svelte completo como CSS. En el webview de Tauri ocurre de
  // forma reproducible y deja componentes sin estilo. Inyectar el CSS
  // compilado junto al modulo elimina esa carrera; esta app es un unico
  // bundle de escritorio y no necesita extraer CSS por componente.
  vitePlugin: {
    emitCss: false,
  },
  kit: {
    adapter: adapter({
      fallback: "index.html",
    }),
  },
};

export default config;
