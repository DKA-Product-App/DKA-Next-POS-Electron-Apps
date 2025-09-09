// global.d.ts
export {}

declare global {
    interface Window {
        electron?: {
            versions?: {
                app?: string
                dev?: boolean;
                electron?: string
                chrome?: string
                node?: string
            }
        }
    }
}
