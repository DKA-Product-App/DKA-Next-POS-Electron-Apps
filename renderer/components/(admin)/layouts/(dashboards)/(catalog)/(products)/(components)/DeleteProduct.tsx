'use client'

import * as React from 'react'
import Swal from 'sweetalert2'

export default function DeleteProduct({
                                          productId,
                                          productName,
                                          onDeleted,
                                          trigger,
                                      }: {
    productId: string
    productName?: string
    onDeleted?: () => void
    trigger: React.ReactNode
}) {
    const onClick = async () => {
        const res = await Swal.fire({
            title: 'Hapus produk?',
            html: `Anda akan menghapus <b>${productName || 'produk ini'}</b>. Tindakan ini tidak dapat dibatalkan.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            focusCancel: true,
        })

        if (!res.isConfirmed) return

        // show small loading while calling IPC
        await Swal.fire({
            title: 'Menghapus…',
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            },
        })

        try {
            if (!window?.api?.invoke) throw new Error('IPC bridge tidak tersedia')
            await window.api.invoke('api.product:delete.one', { id: productId })

            await Swal.fire({
                title: 'Terhapus',
                text: 'Produk telah dihapus.',
                icon: 'success',
                timer: 1200,
                showConfirmButton: false,
            })
            onDeleted?.()
        } catch (err: any) {
            await Swal.fire({
                title: 'Gagal',
                text: err?.msg || err?.message || 'Gagal menghapus produk',
                icon: 'error',
            })
        }
    }

    return <span onClick={onClick} style={{ display: 'inline-flex' }}>{trigger}</span>
}
