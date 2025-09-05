// main/protocols.ts
import { protocol } from "electron"
import path from "node:path"
import fs from "node:fs/promises"
import mime from "mime"
import { getExternalDataDir } from "./getExternalResourcesDir"

const sanitize = (p: string) =>
    path.normalize(p).replace(/^(\.\.(\/|\\|$))+/g, "")

export async function registerDataProtocol() {
    const dataDir = getExternalDataDir()

    protocol.handle("uploads", async (req) => {
        const raw = decodeURIComponent(req.url.replace("uploads://", ""))
        const rel = sanitize(raw.replace(/^\/+/, "")) // "images/a.png"
        const filePath = path.join(dataDir, rel)

        try {
            const buf = await fs.readFile(filePath)
            const mimeType = mime.getType(filePath) || "application/octet-stream"
            return new Response(new Uint8Array(buf), {
                headers: { "Content-Type": mimeType },
            })
        } catch {
            return new Response("Not found", { status: 404 })
        }
    })

}
