import { DeleteOutlineRounded } from "@mui/icons-material";
import {IconButton, Tooltip } from "@mui/material";
import React, { useState } from "react";
import SweetAlert2, { SweetAlert2Props } from "react-sweetalert2";
import Swal from "sweetalert2";

export const DeleteModal = ({ id, name, onDeleted }: { id: string; name?: string; onDeleted?: () => void }) => {
    const [swalProps, setSwalProps] = useState<SweetAlert2Props>({ show: false });

    const openConfirm = () =>
        setSwalProps({
            show: true,
            icon: 'warning',
            title: 'Hapus kategori?',
            html: `Anda akan menghapus <b>${name || 'kategori ini'}</b>. Tindakan ini tidak dapat dibatalkan.`,
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            focusCancel: true,
            onConfirm: () => doDelete(),
            didClose: () => setSwalProps({ show: false }),
        });

    const doDelete = () => {
        setSwalProps({
            show: true,
            title: 'Menghapus…',
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        Promise.resolve()
            .then(() => {
                if (!window?.api?.invoke) throw new Error('IPC bridge tidak tersedia');
                return window.api.invoke('api.product.category:delete.one', { id });
            })
            .then((resolve) => {
                console.log(resolve);
                setSwalProps({
                    show: true,
                    icon: 'success',
                    title: 'Terhapus',
                    text: 'Kategori telah dihapus.',
                    timer: 2000,
                    showConfirmButton: false,
                    onResolve: () => onDeleted?.(),
                })
            })
            .catch((err: any) =>
                setSwalProps({
                    show: true,
                    icon: 'error',
                    title: 'Gagal',
                    text: err?.msg || err?.message || 'Gagal menghapus kategori',
                    confirmButtonText: 'Tutup',
                }),
            );
    };

    return (
        <>
            <Tooltip title="Hapus">
                <IconButton size="small" color="error" onClick={openConfirm}>
                    <DeleteOutlineRounded fontSize="small" />
                </IconButton>
            </Tooltip>
            <SweetAlert2 {...swalProps} />
        </>
    );
};
