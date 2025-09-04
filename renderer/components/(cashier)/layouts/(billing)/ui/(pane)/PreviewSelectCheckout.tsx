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

export type CartItem = {
    key: string;
    productId: string;
    name: string;
    variantLabel?: string;
    unitPrice: number;
    qty: number;
    description?: string;
};

export interface PreviewSelectCheckoutProps {
    items: CartItem[];
    onInc: (key: string) => void;
    onDec: (key: string) => void;
    onRemove: (key: string) => void;
    onClear: () => void;
    taxRate?: number;
    onEditDescription?: (key: string, description: string) => void; // keep for future
}

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
          Bayar
        </Button>
      </span>
        </Tooltip>
    </Box>
);

export const PreviewSelectCheckout: FC<PreviewSelectCheckoutProps> = (props) => {

    const subtotal = useMemo(() => props.items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0), [props.items]);
    const rupiahFmt = useMemo(
        () => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }),
        []
    );
    const rupiah = (n: number) => rupiahFmt.format(n);
    const tax = Math.round(subtotal * (props.taxRate ?? 0.11));
    const total = subtotal + tax;

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
            <HeaderBar count={props.items.length} onClear={props.onClear} />

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <PerfectScrollbar style={{ height: "100%" }} options={{ suppressScrollX: true }}>
                    <List disablePadding>
                        {props.items.map((it, idx) => {
                            const lineTotal = it.unitPrice * it.qty;

                            return (
                                <Fade in key={it.key} timeout={180}>
                                    <Box>
                                        <ListItem
                                            secondaryAction={
                                                <Actions
                                                    k={it.key}
                                                    qty={it.qty}
                                                    onInc={props.onInc}
                                                    onDec={props.onDec}
                                                    onRemove={props.onRemove}
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
                                        {idx < props.items.length - 1 && <Divider sx={{ mx: 1.5 }} />}
                                    </Box>
                                </Fade>
                            );
                        })}

                        {props.items.length === 0 && (
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
                taxRatePct={Math.round((props.taxRate ?? 0.11) * 100)}
                rupiah={rupiah}
                disabled={props.items.length === 0}
            />
        </Paper>
    );
};

export default PreviewSelectCheckout;
