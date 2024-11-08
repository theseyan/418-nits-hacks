/**
 * 418 I'm A Teapot
 * App entrypoint
*/

import App from './App.svelte';

const app = new App({
    target: document.getElementById('app_root'),
})

export default app;