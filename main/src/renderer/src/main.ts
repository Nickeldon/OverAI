import './lib/assets/main.css'

import App from './App.svelte'
//import App from './lib/components/test.svelte'

const app = new App({
  target: document.getElementById('app')
})

export default app
