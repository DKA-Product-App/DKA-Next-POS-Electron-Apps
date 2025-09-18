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
} from "@mui/material";
import { Add, Block, Remove, Delete, NoteAltRounded } from "@mui/icons-material";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";

import { useCart, useCartActions, useCartMoney } from "../../context/CartContext";
import dynamic from "next/dynamic";

import DetailItem, { DetailItemHandle } from "./widgets/DetailItemWidget";

const DiningModeWidget = dynamic(() => import("./widgets/DiningModeWidget"), { ssr: false });
const PromoWidget = dynamic(() => import("./widgets/PromoWidget"), { ssr: false });

const GRADIENT_PURPLE = "linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)";
const DARK_BG = "linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)";
const BUS_EVENT = 'detailitem:close-all';

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

// ==== Item actions (kanan)
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
            <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                    e.stopPropagation();
                    // Tutup semua popup SEBELUM menghapus item
                    window.dispatchEvent(new CustomEvent(BUS_EVENT));
                    onRemove(k);
                }}
            >
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
                    onClick={() => {
                        // Close all sebelum clear
                        window.dispatchEvent(new CustomEvent(BUS_EVENT));
                        onClear();
                    }}
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
    subtotal: number;
    tax: number;
    total: number;
    taxRatePct: number;
    rupiah: (n: number) => string;
    disabled: boolean;
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
                <DiningModeWidget onChange={() => undefined}  />
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
const PreviewSelectCheckout: React.FC<{ diningModeDefault?: string}> = () => {
    const { items } = useCart();
    const { inc, dec, remove, clear } = useCartActions();
    const { subtotal, tax, total, rupiah, taxRatePct } = useCartMoney();

    const refMap = React.useRef<Record<string, DetailItemHandle | null>>({});

    const setDetailRef = (key: string) => (inst: DetailItemHandle | null) => {
        refMap.current[key] = inst;
    };

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
                <PerfectScrollbar
                    style={{ height: "100%" }}
                    options={{ suppressScrollX: true, wheelPropagation: false }}
                    onScrollY={() => {
                        window.dispatchEvent(new CustomEvent(BUS_EVENT));
                        Object.values(refMap.current).forEach((ref) => ref?.close());
                    }}
                >
                    <List disablePadding>
                        {items.map((it, idx) => {
                            const lineTotal = it.unitPrice * it.qty;
                            const hasNote = Boolean(it.description && it.description.length > 0);

                            return (
                                <Fade in key={it.key} timeout={180}>
                                    <Box>
                                        <ListItem
                                            onClick={(e) => {
                                                e.preventDefault();
                                                refMap.current[it.key]?.open(e.currentTarget as HTMLElement, it);
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
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 0.75,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <Typography
                                                            fontWeight={900}
                                                            lineHeight={1.2}
                                                            title={it.name}
                                                            sx={{
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
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

                                            <DetailItem ref={setDetailRef(it.key)} />
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
