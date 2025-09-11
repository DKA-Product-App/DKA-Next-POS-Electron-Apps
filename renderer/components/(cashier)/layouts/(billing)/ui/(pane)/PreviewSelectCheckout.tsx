'use client';

import React from "react";
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    Typography,
    Tooltip,
    Fade,
    Grow,
    TextField,
    Popper,
    ClickAwayListener,
    Paper as MuiPaper,
} from "@mui/material";
import {
    Add,
    Block,
    Remove,
    Delete,
    NoteAltRounded,
    DeleteOutline,
} from "@mui/icons-material";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";

import { useCart, useCartActions, useCartMoney } from "../../context/CartContext";
import dynamic from "next/dynamic";

const DiningModeWidget = dynamic(() => import("./components/DiningModeWidget"), { ssr: false });
const PromoWidget = dynamic(() => import("./components/PromoWidget"), { ssr: false });

const GRADIENT_PURPLE = "linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)";
const DARK_BG = "linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)";

// ==== Mini qty
const Qty = React.memo<{ n: number }>(({ n }) => (
    <Box
        component="span"
        sx={{
            display: "inline-block",
            minWidth: 28,
            textAlign: "center",
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            animation: "qtyPop 150ms ease",
            "@keyframes qtyPop": {
                "0%": { transform: "scale(0.8)", opacity: 0.4 },
                "100%": { transform: "scale(1)", opacity: 1 },
            },
        }}
    >
        {n}
    </Box>
));

// ==== Item actions di list (kanan)
const Actions = React.memo<{
    k: string;
    qty: number;
    onInc: (k: string) => void;
    onDec: (k: string) => void;
    onRemove: (k: string) => void;
}>(({ k, qty, onInc, onDec, onRemove }) => (
    <Stack direction="row" alignItems="center" spacing={0.25} sx={{ justifyContent: "flex-end" }}>
        <Tooltip title="Kurangi">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDec(k); }}>
                <Remove fontSize="small" />
            </IconButton>
        </Tooltip>
        <Qty n={qty} />
        <Tooltip title="Tambah">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onInc(k); }}>
                <Add fontSize="small" />
            </IconButton>
        </Tooltip>
        <Tooltip title="Hapus item">
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onRemove(k); }}>
                <Delete fontSize="small" />
            </IconButton>
        </Tooltip>
    </Stack>
));

// ==== Header
const HeaderBar: React.FC<{ count: number; onClear: () => void }> = ({ count, onClear }) => (
    <Box sx={{ position: "sticky", top: 0, zIndex: 2 }}>
        <Box sx={{ height: 4, background: GRADIENT_PURPLE }} />
        <Box
            sx={{
                p: 1.5,
                backdropFilter: "saturate(140%) blur(6px)",
                bgcolor: (t) =>
                    t.palette.mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)",
                borderBottom: "1px solid",
                borderColor: "divider",
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={900}>Checkout</Typography>
                    <Chip size="small" variant="outlined" label={`${count} item`} sx={{ fontWeight: 700 }} />
                </Stack>
                <Button
                    size="small"
                    color="error"
                    startIcon={<Block />}
                    onClick={onClear}
                    variant="outlined"
                    sx={{ borderRadius: 1.5, textTransform: "none" }}
                >
                    Kosongkan
                </Button>
            </Stack>
        </Box>
    </Box>
);

// ==== Footer
const FooterBar: React.FC<{
    subtotal: number; tax: number; total: number;
    taxRatePct: number; rupiah: (n: number) => string; disabled: boolean;
}> = ({ subtotal, tax, total, taxRatePct, rupiah, disabled }) => (
    <Box sx={{ position: "sticky", bottom: 0, zIndex: 2 }}>
        <Box
            sx={{
                p: 1.5,
                backdropFilter: "saturate(140%) blur(6px)",
                bgcolor: (t) =>
                    t.palette.mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)",
                borderTop: "1px solid",
                borderColor: "divider",
            }}
        >
            <Stack spacing={0.5}>
                <DiningModeWidget onChange={() => undefined} />
                <PromoWidget />

                <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{rupiah(subtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Pajak ({taxRatePct}%)</Typography>
                    <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{rupiah(tax)}</Typography>
                </Stack>

                <Divider sx={{ my: 0.75 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="subtitle1" fontWeight={900}>Total</Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {rupiah(total)}
                    </Typography>
                </Stack>
            </Stack>

            <Tooltip title={disabled ? "Tambahkan item dulu" : "Lanjut ke pembayaran"}>
        <span>
          <Button
              sx={{
                  mt: 1.25,
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: 1.5,
                  py: 1.25,
                  boxShadow: "none",
                  background: GRADIENT_PURPLE,
                  "&:hover": { boxShadow: "0 8px 20px rgba(139,92,246,0.35)", transform: "translateY(-1px)" },
                  transition: (t) =>
                      t.transitions.create(["box-shadow", "transform"], { duration: t.transitions.duration.shorter }),
              }}
              size="large"
              fullWidth
              variant="contained"
              disabled={disabled}
              onClick={() => alert(`Lanjut pembayaran: ${rupiah(total)}`)}
          >
            Order
          </Button>
        </span>
            </Tooltip>
        </Box>
        <Box sx={{ height: 4, background: GRADIENT_PURPLE }} />
    </Box>
);

// ==== Main
const PreviewSelectCheckout: React.FC = () => {
    const { items } = useCart();
    const { inc, dec, remove, clear, setDescription } = useCartActions();
    const { subtotal, tax, total, rupiah, taxRatePct } = useCartMoney();

    // Popper state (anchor + key + draft)
    const [popper, setPopper] = React.useState<{ key: string | null; anchor: HTMLElement | null; draft: string }>({
        key: null,
        anchor: null,
        draft: "",
    });

    const openEditor = (itemKey: string, anchor: HTMLElement | null, current: string | undefined) =>
        setPopper({ key: itemKey, anchor, draft: current ?? "" });

    const closeEditor = () => setPopper({ key: null, anchor: null, draft: "" });

    const handleSave = () => {
        if (!popper.key) return;
        setDescription(popper.key, popper.draft.trim());
        closeEditor();
    };

    const clearNote = () => {
        if (!popper.key) return;
        setDescription(popper.key, "");
        setPopper(s => ({ ...s, draft: "" })); // biar textbox kosong kalau masih kebuka
    };

    // Helper cari item aktif (buat qty & subtotal realtime di popup)
    const activeItem = popper.key ? items.find(i => i.key === popper.key) : undefined;
    const activeSubtotal = activeItem ? activeItem.unitPrice * activeItem.qty : 0;


    // 👉 Tambahin useEffect ini
    React.useEffect(() => {
        if (popper.key && !activeItem) {
            // item hilang (qty jadi 0 atau dihapus)
            closeEditor();
        }
    }, [activeItem, popper.key]);

    return (
        <Paper
            elevation={0}
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
                overflow: "hidden",
                background: (t) =>
                    t.palette.mode === "dark"
                        ? DARK_BG
                        : `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`,
            }}
        >
            <HeaderBar count={items.length} onClear={clear} />

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <PerfectScrollbar style={{ height: "100%" }} options={{ suppressScrollX: true }}>
                    <List disablePadding>
                        {items.map((it, idx) => {
                            const lineTotal = it.unitPrice * it.qty;
                            const hasNote = Boolean(it.description && it.description.length > 0);

                            return (
                                <Fade in key={it.key} timeout={180}>
                                    <Box>
                                        <ListItem
                                            // KLIK KANAN untuk buka editor Popper
                                            onClick={(e) => {
                                                e.preventDefault();
                                                openEditor(it.key, e.currentTarget as HTMLElement, it.description);
                                            }}
                                            secondaryAction={
                                                <Actions
                                                    k={it.key}
                                                    qty={it.qty}
                                                    onInc={inc}
                                                    onDec={dec}
                                                    onRemove={remove}
                                                />
                                            }
                                            sx={{
                                                px: 1.5,
                                                py: 1,
                                                borderRadius: 1,
                                                mx: 1,
                                                my: 0.5,
                                                transition: "all 140ms",
                                                cursor: "context-menu",
                                                "&:hover": {
                                                    boxShadow: "0 4px 12px rgba(139,92,246,0.18)",
                                                    borderLeft: "3px solid #8B5CF6",
                                                },
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.75,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <Typography
                                                            fontWeight={900}
                                                            lineHeight={1.2}
                                                            title={it.name}
                                                            sx={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                minWidth: 0,
                                                                flexShrink: 1,
                                                            }}
                                                        >
                                                            {it.name}
                                                        </Typography>

                                                        {it.variantLabel && (
                                                            <Chip
                                                                size="small"
                                                                label={it.variantLabel}
                                                                variant="outlined"
                                                                sx={{ borderRadius: 1, flexShrink: 0 }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        )}

                                                        {hasNote && (
                                                            <Tooltip title={`Ada catatan: ${it.description}`}>
                                                                <NoteAltRounded fontSize="small" color="action" style={{ flexShrink: 0 }} />
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary">
                                                        {rupiah(it.unitPrice)} × {it.qty} ={" "}
                                                        <Typography component="span" variant="body2" fontWeight={900}>
                                                            {rupiah(lineTotal)}
                                                        </Typography>
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>

                                        {idx < items.length - 1 && <Divider sx={{ mx: 1.5 }} />}
                                    </Box>
                                </Fade>
                            );
                        })}

                        {items.length === 0 && (
                            <Grow in timeout={200}>
                                <Box sx={{ p: 2, color: "text.secondary" }}>
                                    Keranjang masih kosong. Ayo jualan—biar mesin EDC nggak nganggur 😄
                                </Box>
                            </Grow>
                        )}
                    </List>
                </PerfectScrollbar>
            </Box>

            {/* === Popper Editor (anchored, scrollable) === */}
            <Popper
                open={Boolean(popper.key)}
                anchorEl={popper.anchor}
                placement="left-start"
                modifiers={[
                    { name: 'offset', options: { offset: [15, 0] } }, // geser dikit biar lega
                    { name: 'flip', options: { fallbackPlacements: ['right-start', 'bottom-start'] } },
                    { name: 'preventOverflow', options: { padding: 12, boundary: 'clippingParents' } },
                ]}
                sx={{ zIndex: (t) => t.zIndex.modal + 1 }}
            >
                <ClickAwayListener onClickAway={closeEditor}>
                    <MuiPaper
                        elevation={8}
                        sx={(t) => ({
                            width: 420,
                            maxWidth: '90vw',
                            [t.breakpoints.up('sm')]: { width: 480 },
                            [t.breakpoints.up('md')]: { width: 560 },

                            maxHeight: '72vh',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            background: t.palette.mode === 'dark'
                                ? `linear-gradient(180deg, rgba(23,23,35,1) 0%, rgba(15,15,25,1) 100%)`
                                : `linear-gradient(180deg, #fff 0%, #f9f9ff 100%)`,
                            boxShadow: '0 0 12px rgba(139,92,246,0.25)', // ungu halus
                        })}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* === Ornamen bar atas === */}
                        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)' }} />

                        <PerfectScrollbar style={{ maxHeight: 'calc(72vh - 8px)' }} options={{ suppressScrollX: true }}>
                            <Box sx={{ p: 3, pb: 1.25 }}>
                                {/* === Info Produk === */}
                                <Stack spacing={0.75}>
                                    <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.1 }}>
                                        {activeItem?.name ?? 'Produk'}
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        {activeItem?.variantLabel && (
                                            <Chip size="small" label={activeItem.variantLabel} variant="outlined" sx={{ borderRadius: 1 }} />
                                        )}
                                        <Typography variant="body2" color="text.secondary">
                                            Harga: <b>
                                            {activeItem
                                                ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
                                                    .format(activeItem.unitPrice)
                                                : '-'}
                                        </b>
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Divider sx={{ my: 1.25 }} />

                                {/* === Qty & Subtotal (sedikit lebih besar) === */}
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Stack direction="row" alignItems="center" spacing={0.75}>
                                        <Tooltip title="Kurangi">
                                            <IconButton size="medium" onClick={() => activeItem && dec(activeItem.key)}>
                                                <Remove />
                                            </IconButton>
                                        </Tooltip>
                                        <Typography
                                            fontWeight={900}
                                            sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'center', fontSize: 16 }}
                                        >
                                            {activeItem?.qty ?? 0}
                                        </Typography>
                                        <Tooltip title="Tambah">
                                            <IconButton size="medium" onClick={() => activeItem && inc(activeItem.key)}>
                                                <Add />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>

                                    <Stack direction="row" spacing={1} alignItems="baseline">
                                        <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                                        <Typography fontWeight={900}>
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
                                                .format(activeSubtotal)}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Divider sx={{ my: 1.25 }} />

                                {/* === Catatan === */}
                                <Stack spacing={0.75}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" fontWeight={800}>Catatan</Typography>
                                        <Tooltip title="Hapus catatan">
                <span>
                  <IconButton size="small" onClick={clearNote} disabled={!activeItem?.description}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </span>
                                        </Tooltip>
                                    </Stack>
                                    <TextField
                                        value={popper.draft}
                                        onChange={(e) => setPopper(s => ({ ...s, draft: e.target.value }))}
                                        size="medium"
                                        fullWidth
                                        placeholder="cth: hot / no onion / less ice"
                                        multiline
                                        minRows={3}
                                        maxRows={10}
                                        autoFocus
                                    />
                                    <Stack direction="row" justifyContent="flex-end">
                                        <Button
                                            variant="contained"
                                            size="medium"
                                            onClick={handleSave}
                                            sx={{ textTransform: 'none', fontWeight: 800 }}
                                        >
                                            Simpan
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Box>
                        </PerfectScrollbar>

                        {/* === Ornamen bar bawah === */}
                        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)' }} />
                    </MuiPaper>
                </ClickAwayListener>
            </Popper>


            <FooterBar
                subtotal={subtotal}
                tax={tax}
                total={total}
                taxRatePct={taxRatePct}
                rupiah={rupiah}
                disabled={items.length === 0}
            />
        </Paper>
    );
};

export default PreviewSelectCheckout;
