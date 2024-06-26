/// <reference types="svelte" />
/// <reference types="vite/client" />
declare module 'ollama/browser'

declare interface SvelteTransitionObject {
    in:{
        type: object;
        duration: number;
        delay: number | undefined = undefined
    },

    out:{
        type: object;
        duration: number;
        delay: number | undefined = undefined
    }
}