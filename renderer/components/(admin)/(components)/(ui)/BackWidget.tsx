'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { IconButton, Tooltip } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'

type BackWidgetProps = {
    /** Tooltip text */
    title?: string
    /** Ukuran icon button */
    size?: 'small' | 'medium' | 'large'
    /** Dipanggil saat sukses navigate */
    onNavigate?: (to: string) => void
    /** Matikan pengecekan 404 (mis. skenario file:// atau custom protocol) */
    disableCheck?: boolean
}

const pathParent = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.length > 1 ? '/' + segments.slice(0, -1).join('/') : null
}

export default function BackWidget({
                                       title = 'Kembali',
                                       size = 'small',
                                       onNavigate,
                                       disableCheck,
                                   }: BackWidgetProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [visible, setVisible] = React.useState(false)
    const [target, setTarget] = React.useState<string | null>(null)

    React.useEffect(() => {
        const parent = pathParent(pathname)
        setTarget(parent)

        if (!parent) {
            setVisible(false)
            return
        }

        const isHttp = typeof window !== 'undefined' && (
            window.location.protocol === 'http:' || window.location.protocol === 'https:'
        )

        // fallback: kalau bukan http(s) (mis. electron file:// / custom scheme), kita tampilkan tombolnya
        // karena fetch ke HTML lokal bisa gagal. Kamu bisa set disableCheck=true kalau mau paksa tampil.
        if (disableCheck || !isHttp) {
            setVisible(true)
            return
        }

        const ac = new AbortController()
            // cek apakah parent route tidak 404
        ;(async () => {
            const res = await fetch(parent, { method: 'GET', cache: 'no-store', signal: ac.signal as any })
            setVisible(res.ok)
        })()

        return () => ac.abort()
    }, [pathname, disableCheck])

    if (!visible || !target) return null

    const handleClick = () => {
        router.push(target)
        onNavigate?.(target)
    }

    return (
        <Tooltip title={title}>
            <IconButton size={size} onClick={handleClick}>
                <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    )
}
