'use client';

import React from "react"
import {alpha, Box, Skeleton} from "@mui/material";
import Image from 'next/image'
// =============================================================
// IPC IMAGE HOOK — ambil base64 dari main via channel: "api.product:read.image"

// =============================================================
export const guessMime = (filename: string) =>
    /\.png$/i.test(filename)  ? 'image/png'  :
        /\.webp$/i.test(filename) ? 'image/webp' :
            /\.gif$/i.test(filename)  ? 'image/gif'  :
                /\.avif$/i.test(filename) ? 'image/avif' :
                    'image/jpeg'

export const basename = (p: string) => p.split('/').filter(Boolean).pop() || ''

export function useIpcImage(uploadPath?: string | null) {
    const [src, setSrc] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState<boolean>(!!uploadPath)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!uploadPath || !/^\/uploads\//i.test(uploadPath)) {
            setSrc(null); setLoading(false); setError(null)
            return
        }
        const name = basename(uploadPath)
        setLoading(true); setError(null)

        // Preload must expose an invoker. Adjust to your bridge if needed.
        const invoker: undefined | ((ch: string, args?: any) => Promise<any>) = (typeof window !== 'undefined')
            ? ( (window as any).api?.invoke || (window as any)?.electron?.ipcRenderer?.invoke )
            : undefined

        if (!invoker) { setError('IPC not available'); setLoading(false); return }

        invoker('api.product:read.image', { name })
            .then((b64: string) => {
                const mime = guessMime(name)
                setSrc(`data:${mime};base64,${b64}`)
                setLoading(false)
            })
            .catch((e: any) => {
                setError(e?.msg || 'Gagal memuat gambar')
                setSrc(null)
                setLoading(false)
            })
    }, [uploadPath])

    return { src, loading, error }
}
export type OverlayTone = 'success' | 'warning' | 'error' | null
// =============================================================
// IMG COMPONENT: Skeleton + fade-in, tanpa custom loader/replace
// =============================================================
export const ImgWithSkeleton: React.FC<{
    path?: string | null;
    alt: string;
    priority?: boolean;
    grayscale?: boolean;
    overlayTone?: OverlayTone;  // hijau/kuning/merah
    overlayGray?: boolean;      // untuk closed
}> = ({ path, alt, priority, grayscale, overlayTone, overlayGray }) => {
    const { src, loading, error } = useIpcImage(path)
    const shown = src ?? `https://placehold.co/600x400/png?text=${encodeURIComponent(error ? 'No Image' : alt)}`
    const [err, setErr] = React.useState(false)

    return (
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Image
                alt={alt}
                fill
                unoptimized
                sizes="(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 200px"
                onError={() => { setErr(true); }}
                src={shown}
                priority={priority}
                loading={priority ? 'eager' : 'lazy'}
                style={{ objectFit: 'cover', opacity: loading ? 0 : 1, transition: 'opacity .2s ease', filter: grayscale ? 'grayscale(1) saturate(0) brightness(0.9)' : 'none', }}
            />

            {/* Soft gradient shading */}
            <Box sx={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: (t) => `linear-gradient(to bottom, ${t.palette.action.hover}00 0%, ${t.palette.action.hover}40 70%, ${t.palette.action.hover}66 100%)`
            }} />

            {/* GRAY overlay khusus CLOSED */}
            {overlayGray && (
                <Box
                    sx={(t) => ({
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        backgroundColor: alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.38 : 0.28),
                    })}
                />
            )}

            {/* COLOR TINT overlay (jika bukan closed) — lebih tebal */}
            {!overlayGray && overlayTone && (
                <Box
                    sx={(t) => {
                        const col = (t.palette as any)[overlayTone].main
                        const a = t.palette.mode === 'dark'
                            ? (overlayTone === 'error' ? 0.46 : overlayTone === 'warning' ? 0.40 : 0.36)
                            : (overlayTone === 'error' ? 0.34 : overlayTone === 'warning' ? 0.30 : 0.26)
                        return {
                            position: 'absolute', inset: 0, pointerEvents: 'none',
                            backgroundColor: alpha(col, a),
                        }
                    }}
                />
            )}
        </Box>
    )
}