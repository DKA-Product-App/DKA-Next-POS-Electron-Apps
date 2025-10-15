import { DeleteOutlineRounded } from "@mui/icons-material";
import {IconButton, Tooltip } from "@mui/material";
import React, { useState } from "react";
import SweetAlert2, { SweetAlert2Props } from "react-sweetalert2";
import {useThemeCharger} from "../../../../../../../contexts/ThemeCharger";

export const DeleteModal = ({ id, name, onDeleted }: { id: string; name?: string; onDeleted?: () => void }) => {
    const [swalProps, setSwalProps] = useState<SweetAlert2Props>({ show: false });
    const { mode } = useThemeCharger()
    const openConfirm = React.useCallback(() => {
        setSwalProps({
            show: true,
            icon: 'warning',
            title: 'Hapus Data Lantai?',
            html: `Anda akan menghapus <b>${name || 'Lantai ini'}</b>. Tindakan ini tidak dapat dibatalkan.`,
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            theme: mode,
            focusCancel: true,
            onConfirm: () => {
                setSwalProps(prev => ({ ...prev, show: false }))
                window?.api?.invoke?.('api.config.data.floors:delete.one', { id })
                    .then((resolve) => {
                        console.log(resolve);
                        setSwalProps({
                            show: true,
                            icon: 'success',
                            title: 'Terhapus',
                            theme: mode,
                            timer: 2000,
                            text: `${name} telah dihapus.`,
                            showConfirmButton: false,
                            onResolve: () => onDeleted?.(),
                        })
                    })
                    .catch((err) => {
                        console.error(err)
                        onDeleted?.();
                        setSwalProps({
                            show: true,
                            icon: 'error',
                            title: 'Gagal',
                            theme: mode,
                            timer: 5000,
                            text: err?.msg || err?.message || 'Gagal menghapus Lantai',
                            confirmButtonText: 'Tutup',
                        })
                    });
            },
        });
    },[ mode ]);

    return (
        <>
            <Tooltip title="Hapus">
                <IconButton size="small" color="error" onClick={openConfirm}>
                    <DeleteOutlineRounded fontSize="small" />
                </IconButton>
            </Tooltip>
            <SweetAlert2 {...swalProps} didClose={() => setSwalProps(prev => ({ ...prev, show: false }))}  />
        </>
    );
};


export default DeleteModal;