'use client'

import * as React from 'react'
import Swal from 'sweetalert2'
import SweetAlert2, { SweetAlert2Props } from 'react-sweetalert2'
import { IconButton, Tooltip } from '@mui/material'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'

type Props = {
    productId: string
    productName?: string
    onDeleted?: () => void
}

export default function DeleteProduct({ productId, productName, onDeleted }: Props) {
    const [swalProps, setSwalProps] = React.useState<SweetAlert2Props>({ show: false })

    const openConfirm = () =>
        setSwalProps({
            show: true,
            icon: 'warning',
            title: 'Hapus produk?',
            html: `Anda akan menghapus <b>${productName || 'produk ini'}</b>. Tindakan ini tidak dapat dibatalkan.`,
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            focusCancel: true,
            // react-sweetalert2 callbacks:
            onConfirm: () => doDelete(),         // klik "Ya, hapus"
            didClose: () => setSwalProps({ show: false }),
        })

    const doDelete = () => {
        // step 1: tampilkan modal loading (props)
        setSwalProps({
            show: true,
            title: 'Menghapus…',
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        })

        // step 2: jalankan IPC
        Promise.resolve()
            .then(() => {
                if (!window?.api?.invoke) throw new Error('IPC bridge tidak tersedia')
                return window.api.invoke('api.product:delete.one', { id: productId })
            })
            // step 3a: sukses → modal success (autoclose)
            .then(() =>
                setSwalProps({
                    show: true,
                    icon: 'success',
                    title: 'Terhapus',
                    text: 'Produk telah dihapus.',
                    timer: 3000,
                    showConfirmButton: false,
                    onResolve: () => {
                        onDeleted?.()
                    },
                }),
            )
            // step 3b: gagal → modal error
            .catch((err: any) =>
                setSwalProps({
                    show: true,
                    icon: 'error',
                    title: 'Gagal',
                    text: err?.msg || err?.message || 'Gagal menghapus produk',
                    confirmButtonText: 'Tutup'
                }),
            )
    }

    return (
        <>
            <Tooltip title="Hapus">
                <IconButton size="small" color="error" onClick={openConfirm}>
                    <DeleteOutlineRounded fontSize="small" />
                </IconButton>
            </Tooltip>
            <SweetAlert2 {...swalProps} />
        </>
    )
}
