'use client';

import * as React from 'react';
import {
    Box,
    Button,
    Card as MuiCard,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import type { Variants, Transition } from 'framer-motion';

import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {redirect, usePathname, useRouter} from "next/navigation";
import {useAuth} from "../../../contexts/AuthProviderContext";
import {useEffect} from "react";
import normalizeIpcError from "../../../helpers/electronMessageErrorEsctration";

// ============================
// Styled Card
// ============================
const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2.5),
    borderRadius: theme.spacing(3),
    background:
        theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, hsla(210, 100%, 16%, 0.6), hsl(220, 30%, 8%))'
            : 'linear-gradient(135deg, hsla(210, 100%, 97%, 0.9), hsl(0, 0%, 100%))',
    color: theme.palette.text.primary,
    backdropFilter: 'blur(8px)',
    border:
        theme.palette.mode === 'dark'
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.06)',
    boxShadow:
        theme.palette.mode === 'dark'
            ? 'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px'
            : 'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    [theme.breakpoints.up('sm')]: { width: 450 },
}));

// ============================
// Motion wrappers
// ============================
const MotionCard = motion(Card);
const MotionBox = motion(Box);

// ============================
// Motion settings (typed)
// ============================
const EASE_BEZIER = [0.22, 1, 0.36, 1] as const;

const CARD_TRANSITION: Transition = {
    duration: 0.5,
    ease: EASE_BEZIER,
    when: 'beforeChildren',
    staggerChildren: 0.08,
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: CARD_TRANSITION,
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 1.0, ease: 'easeOut' },
    },
};

const buttonTap = { scale: 0.98 };
const buttonHover = { y: -2 };

// ============================
// Component
// ============================
export default function SignInCard() {
    const [showPassword, setShowPassword] = React.useState(false);
    const [Alerter, setAlerter] = React.useState<React.JSX.Element>(<></>);
    const pathname = usePathname();
    const { Auth, setAuth } = useAuth();
    const router = useRouter();

    const [ buttonHandler, setButtonHandler ] = React.useState({ text : "Masuk", disabled : false })


    useEffect(() => {
        if (Auth?.token !== undefined){
            switch (Auth?.roles?.[0].code) {
                case "CSR":
                    return router.replace(`/cashier/`);
                case "ADM":
                    return router.replace(`/admin/`);
                case "DEV":
                    return router.replace(`/cashier/`);
                default:
                    setAuth({ token : undefined, roles: undefined })
                    return router.refresh();
            }
        }
    }, [Auth]);

    // Tipenya ikut Box (div). Kita cast ke HTMLFormElement buat FormData.
    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const formEl = event.currentTarget; // sudah HTMLFormElement, nggak perlu cast
        const data = new FormData(formEl);
        const jsonData = Object.fromEntries(data.entries());
        setButtonHandler({ text : "Sedang Menvalidasi", disabled: true }) ;
        window?.api?.invoke?.("api.auth:login", jsonData)
            .then(async (result : { data : { access_token : string; roles: Array<{ code : "CSR" | "ADM" | "DEV" | "CEO"; name : string }> }}) => {
                setButtonHandler((prevState) => {
                    return { ...prevState, text: "Berhasil Login. Harap Tunggu"}
                });
                setAuth((prevState) => {
                    return { ...prevState, token: result.data.access_token, roles: result.data.roles }
                });
            })
            .catch((error) => {
                setButtonHandler({ text : "Masuk", disabled: false }) ;
                const e = normalizeIpcError(error);
                console.error(e);
            });
    };

    return (
        <MotionCard
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            viewport={{ once: true }}
            sx={{ transform: 'translateZ(0)' }}
            variant="outlined"
        >
            <MotionBox variants={itemVariants} sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1, m: 0 }}>
                    DKA POS Application
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 15, opacity: 0.85, lineHeight: 1.1, m: 0 }}>
                    Management POS Caffe &amp; Resto
                </Typography>
            </MotionBox>

            <MotionBox variants={itemVariants}>{Alerter}</MotionBox>

            {/* Box sebagai <form> (bukan MotionBox) → typing aman, no TS error */}
            <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
            >
                {/* Username */}
                <MotionBox variants={itemVariants}>
                    <FormControl sx={{ width: '100%' }}>
                        <FormLabel htmlFor="username" sx={{ mb: 1 }}>
                            Username
                        </FormLabel>
                        <TextField
                            id="username"
                            name="username"
                            type="text"
                            placeholder="username"
                            autoFocus
                            autoComplete="username"
                            required
                            fullWidth
                            variant="outlined"
                            color="primary"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountCircleRoundedIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={(theme) => ({
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    background:
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.05)'
                                            : 'rgba(0, 0, 0, 0.02)',
                                    backdropFilter: 'blur(6px)',
                                    transition: 'all 0.25s ease',
                                    '& fieldset': { border: '1px solid transparent' },
                                    '&:hover fieldset': { borderColor: theme.palette.primary.main },
                                    '&.Mui-focused fieldset': {
                                        borderWidth: 2,
                                        borderColor: theme.palette.primary.main,
                                        boxShadow: `0 0 0 4px ${theme.palette.primary.main}22`,
                                    },
                                },
                            })}
                        />
                    </FormControl>
                </MotionBox>

                {/* Password */}
                <MotionBox variants={itemVariants}>
                    <FormControl sx={{ width: '100%' }}>
                        <FormLabel htmlFor="password" sx={{ mb: 1, pt: 1 }}>
                            Password
                        </FormLabel>
                        <TextField
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            fullWidth
                            variant="outlined"
                            color="primary"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockRoundedIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            component={motion.button as any}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ duration: 0.08 }}
                                            onClick={() => setShowPassword((p) => !p)}
                                            edge="end"
                                            aria-label="toggle password visibility"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={(theme) => ({
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    background:
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.05)'
                                            : 'rgba(0, 0, 0, 0.02)',
                                    backdropFilter: 'blur(6px)',
                                    transition: 'all 0.25s ease',
                                    '& fieldset': { border: '1px solid transparent' },
                                    '&:hover fieldset': { borderColor: theme.palette.primary.main },
                                    '&.Mui-focused fieldset': {
                                        borderWidth: 2,
                                        borderColor: theme.palette.primary.main,
                                        boxShadow: `0 0 0 4px ${theme.palette.primary.main}22`,
                                    },
                                },
                            })}
                        />
                    </FormControl>
                </MotionBox>

                {/* Remember me */}
                <MotionBox variants={itemVariants}>
                    <FormControlLabel control={<Checkbox name="remember" value="1" color="primary" />} label="Remember me" />
                </MotionBox>

                {/* Submit */}
                <MotionBox variants={itemVariants}>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={buttonHandler.disabled}
                        component={motion.button as any}
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        transition={{ type: 'tween', duration: 0.15 }}
                        sx={(theme) => ({
                            mt: 1,
                            borderRadius: 12,
                            textTransform: 'none',
                            fontWeight: 700,
                            py: 1.2,
                            boxShadow: 'none',
                            transition: 'all .2s ease',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow:
                                    theme.palette.mode === 'dark'
                                        ? `0 10px 20px -8px rgba(0,0,0,.6)`
                                        : `0 10px 20px -8px rgba(0,0,0,.2)`,
                            },
                        })}
                    >
                        { buttonHandler.text }
                    </Button>
                </MotionBox>
            </Box>
        </MotionCard>
    );
}
