'use client';

import React, { FC, memo, useMemo } from "react";
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
import { Add, Block, Remove, Delete } from "@mui/icons-material";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";

import { useCart, useCartActions, useCartMoney } from "../../context/CartContext";
import dynamic from "next/dynamic";

const Qty = memo<{ n: number }>(
    ({ n }) => (
        <Box
            component="span"
            sx={{
                display: "inline-block",
                minWidth: 28,
                textAlign: "center",
                fontWeight: 700,
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
    ),
    (a, b) => a.n === b.n
);

const Actions = memo<{
    k: string;
    qty: number;
    onInc: (k: string) => void;
    onDec: (k: string) => void;
    onRemove: (k: string) => void;
}>(({ k, qty, onInc, onDec, onRemove }) => (
    <Stack direction="row" alignItems="center" spacing={0.2} sx={{ justifyContent: "flex-end" }}>
        <Tooltip title="Kurangi">
            <IconButton size="small" onClick={() => onDec(k)}><Remove fontSize="small" /></IconButton>
        </Tooltip>
        <Qty n={qty} />
        <Tooltip title="Tambah">
            <IconButton size="small" onClick={() => onInc(k)}><Add fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Hapus item">
            <IconButton size="small" color="error" onClick={() => onRemove(k)}><Delete fontSize="small" /></IconButton>
        </Tooltip>
    </Stack>
));

const HeaderBar: FC<{ count: number; onClear: () => void }> = ({ count, onClear }) => (
    <Box
        sx={{
            p: 1.5,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 2,
            backdropFilter: "saturate(140%) blur(6px)",
            bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)"),
            borderBottom: "1px solid",
            borderColor: "divider",
        }}
    >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={800}>Checkout</Typography>
                <Chip size="small" variant="outlined" label={`${count} item`} sx={{ fontWeight: 600 }} />
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
);


const DiningModeWidget = dynamic(() => import("./components/DiningModeWidget"), {
    loading: () => <></>,
    ssr : false,
})

const DiscountWidget = dynamic(() => import("./components/DiscountWidget"), {
    loading: () => <></>,
    ssr : false,
})


const PromoWidget = dynamic(() => import("./components/PromoWidget"), {
    loading: () => <></>,
    ssr : false,
})

const FooterBar: FC<{
    subtotal: number;
    tax: number;
    total: number;
    taxRatePct: number;
    rupiah: (n: number) => string;
    disabled: boolean;
}> = ({ subtotal, tax, total, taxRatePct, rupiah, disabled }) => (
    <Box
        sx={{
            p: 1.5,
            flexShrink: 0,
            position: "sticky",
            bottom: 0,
            zIndex: 2,
            backdropFilter: "saturate(140%) blur(6px)",
            bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)"),
            borderTop: "1px solid",
            borderColor: "divider",
        }}
    >
        <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between" sx={{ width : '100%'}}>
                <DiningModeWidget
                    onChange={()=> undefined}
                />
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ width : '100%'}}>
                <PromoWidget/>
            </Stack>
            {/*<Stack direction="row" justifyContent="space-between" sx={{ width : '100%'}}>
                <DiscountWidget/>
            </Stack>*/}
            <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{rupiah(subtotal)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Pajak ({taxRatePct}%)</Typography>
                <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{rupiah(tax)}</Typography>
            </Stack>
            <Divider sx={{ my: 0.5 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography variant="subtitle1" fontWeight={900}>Total</Typography>
                <Typography variant="h6" fontWeight={900} sx={{ fontVariantNumeric: "tabular-nums", letterSpacing: 0.3 }}>
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
                fontWeight: 800,
                borderRadius: 1.5,
                boxShadow: "none",
                py: 1.25,
                "&:hover": { boxShadow: 3, transform: "translateY(-1px)" },
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
);

const PreviewSelectCheckout: React.FC = () => {
    const { items } = useCart()
    const { inc, dec, remove, clear } = useCartActions()
    const { subtotal, tax, total, rupiah, taxRatePct } = useCartMoney()

    return (
        <Paper
            elevation={0}
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: (t) =>
                    t.palette.mode === "dark"
                        ? t.palette.background.paper
                        : `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`,
            }}
        >
            <HeaderBar count={items.length} onClear={clear} />

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <PerfectScrollbar style={{ height: "100%" }} options={{ suppressScrollX: true }}>
                    <List disablePadding>
                        {items.map((it, idx) => {
                            const lineTotal = it.unitPrice * it.qty
                            return (
                                <Fade in key={it.key} timeout={180}>
                                    <Box>
                                        <ListItem
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
                                                transition: "background-color 120ms",
                                                "&:hover": { bgcolor: "action.hover" },
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography
                                                            fontWeight={800}
                                                            lineHeight={1.2}
                                                            title={it.name}
                                                            sx={{
                                                                display: "-webkit-box",
                                                                WebkitLineClamp: 1,
                                                                WebkitBoxOrient: "vertical",
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            {it.name}
                                                        </Typography>
                                                        {it.variantLabel && (
                                                            <Chip size="small" label={it.variantLabel} variant="outlined" sx={{ borderRadius: 1 }} />
                                                        )}
                                                    </Stack>
                                                }
                                                secondary={
                                                    <Stack spacing={0.5}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                                                            <Typography variant="caption" color="text.secondary" component="span">
                                                                {rupiah(it.unitPrice)} × {it.qty} ={" "}
                                                                <Typography
                                                                    component="span"
                                                                    variant="body2"
                                                                    fontWeight={800}
                                                                    sx={{ fontVariantNumeric: "tabular-nums" }}
                                                                >
                                                                    {rupiah(lineTotal)}
                                                                </Typography>
                                                            </Typography>
                                                        </Stack>
                                                    </Stack>
                                                }
                                            />
                                        </ListItem>
                                        {idx < items.length - 1 && <Divider sx={{ mx: 1.5 }} />}
                                    </Box>
                                </Fade>
                            )
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
    )
}

export default PreviewSelectCheckout
