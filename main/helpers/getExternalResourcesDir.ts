// main/getExternalDataDir.ts
import { app } from "electron"
import path from "path"
import fs from "fs"

export function getExternalDataDir() {
    let baseDir: string

    if (!app.isPackaged) {
        // Dev mode → ambil dari root project
        baseDir = process.cwd()
    } else {
        // Prod mode → samping executable / AppImage / Mac .app
        switch (process.platform) {
            case "win32":
                baseDir = path.dirname(app.getPath("exe"))
                break
            case "linux":
                baseDir = process.env.APPIMAGE
                    ? path.dirname(process.env.APPIMAGE)
                    : path.dirname(app.getPath("exe"))
                break
            case "darwin":
                baseDir = path.join(path.dirname(app.getPath("exe")), "..") // MyApp.app/Contents
                break
            default:
                baseDir = process.cwd()
                break
        }
    }

    const dataDir = path.join(baseDir, "uploads")
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true, mode: 0o775 })
    }
    return dataDir
}
