'use client';

import { Typography, Button, Container } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
    return (
        <Container
            maxWidth={false}
            disableGutters
            sx={{
                height: '100%', // pakai 100% bukan vh
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center text-center"
                style={{ width: '100%', height: '100%' }}
            >
                <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 120 }}
                >
                    <InfoOutlinedIcon
                        className="mb-4"
                        color="error"
                        sx={{ fontSize: 64 }}
                    />
                </motion.div>

                <Typography
                    className="mb-4 text-xl lg:text-3xl"
                    color="error.main"
                >
                    Halaman Tidak Ada
                </Typography>

                <Typography className="mb-8" color="text.secondary">
                    {'An unexpected error occurred'}
                </Typography>

                <motion.div
                    className="flex gap-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                >
                    <Button
                        component={Link}
                        href="/"
                        variant="contained"
                        color="primary"
                        size="small"
                    >
                        Ke Halaman Utama
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => window.location.reload()}
                    >
                        Coba Lagi
                    </Button>
                </motion.div>
            </motion.div>
        </Container>
    );
}
