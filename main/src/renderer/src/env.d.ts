/// <reference types="svelte" />
/// <reference types="vite/client" />
declare module 'ollama/browser'

declare interface SvelteTransitionObject {
    in:{
        type: object;
        duration: number;
        delay: number | undefined = undefined
        opacity: number | undefined = undefined
        start: number | undefined = undefined
    },

    out:{
        type: object;
        duration: number;
        delay: number | undefined = undefined
        opacity: number | undefined = undefined
        start: number | undefined = undefined
    }
}

declare interface modelQuery {
    simplified_name: string,
      name: string,
      description: {
        parameters: string,
        size: number,
        available: boolean
      }
}

declare interface optionObject {
    name: string,
    event: Function,
    values?: Array<string>,
    type: "incrementation" | "promise",
    style?: string,
    value?: string
}

declare interface userDataObject {
    lastModel: string,
    streamMode: boolean,
    useStock: boolean,
    removeTempFiles: boolean,
    autoSelInstall: boolean,
    rmTempFiles: boolean,
    theme: "light" | "dark"
}