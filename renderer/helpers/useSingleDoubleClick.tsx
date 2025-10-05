'use client';

import * as React from 'react'

type MouseFn = (e: React.MouseEvent<HTMLButtonElement>) => void

export function useSingleDoubleClick(single?: MouseFn, dbl?: MouseFn, delay = 220) {
    const timer = React.useRef<number | null>(null)

    const handler = (e : any) => {
        if (timer.current) {
            window.clearTimeout(timer.current)
            timer.current = null
            dbl?.(e) // terdeteksi klik kedua dalam window -> jalankan double
        } else {
            timer.current = window.setTimeout(() => {
                timer.current = null
                single?.(e) // tidak ada klik kedua -> jalankan single
            }, delay)
        }
    }

    React.useEffect(() => () => timer.current ? window.clearTimeout(timer.current) : null, [])

    return handler
}
