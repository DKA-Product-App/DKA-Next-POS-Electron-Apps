'use client'
import {
    Box,
    Skeleton,
    Paper,
} from '@mui/material'
import React from "react";

export default function ShimmerLoadingSelectMenu() {
    return (
        <>
            <Paper sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} elevation={0}>
                {/* Grid produk: kartu persegi (width == height) */}
                <Box sx={{ p: 2, overflow: 'auto' }}>
                    <Box
                        sx={{
                            display: 'grid',
                            // equal width, responsif, auto isi kolom
                            gridTemplateColumns: {
                                xs: 'repeat(auto-fill, minmax(140px, 1fr))',
                                sm: 'repeat(auto-fill, minmax(160px, 1fr))',
                                md: 'repeat(auto-fill, minmax(180px, 1fr))',
                                lg: 'repeat(auto-fill, minmax(200px, 1fr))',
                            },
                            gap: { xs: 2, sm: 2.5, md: 3 }, // jarak H+V
                            alignItems: 'stretch',
                        }}
                    >
                        <Paper
                            variant="outlined"
                            sx={{
                                // bikin square
                                aspectRatio: '6 / 10',
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'box-shadow .3s',
                                '&:hover': { boxShadow: 2 },

                                // layout isi
                                display: 'flex',
                                flexDirection: 'column',
                                // padding dalam supaya konten nggak mepet
                                p: 0,
                            }}
                        >
                            {/* Card / image */}
                            <Skeleton variant="rectangular" animation="wave" height={180} sx={{ borderRadius: 2 }} />
                            <Skeleton variant="text" animation="wave" width="60%" />
                            <Skeleton variant="text" animation="wave" width="90%" />
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                // bikin square
                                aspectRatio: '6 / 10',
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'box-shadow .3s',
                                '&:hover': { boxShadow: 2 },

                                // layout isi
                                display: 'flex',
                                flexDirection: 'column',
                                // padding dalam supaya konten nggak mepet
                                p: 0,
                            }}
                        >
                            {/* Card / image */}
                            <Skeleton variant="rectangular" animation="wave" height={180} sx={{ borderRadius: 2 }} />
                            <Skeleton variant="text" animation="wave" width="60%" />
                            <Skeleton variant="text" animation="wave" width="90%" />
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                // bikin square
                                aspectRatio: '6 / 10',
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'box-shadow .3s',
                                '&:hover': { boxShadow: 2 },

                                // layout isi
                                display: 'flex',
                                flexDirection: 'column',
                                // padding dalam supaya konten nggak mepet
                                p: 0,
                            }}
                        >
                            {/* Card / image */}
                            <Skeleton variant="rectangular" animation="wave" height={180} sx={{ borderRadius: 2 }} />
                            <Skeleton variant="text" animation="wave" width="60%" />
                            <Skeleton variant="text" animation="wave" width="90%" />
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                // bikin square
                                aspectRatio: '6 / 10',
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'box-shadow .3s',
                                '&:hover': { boxShadow: 2 },

                                // layout isi
                                display: 'flex',
                                flexDirection: 'column',
                                // padding dalam supaya konten nggak mepet
                                p: 0,
                            }}
                        >
                            {/* Card / image */}
                            <Skeleton variant="rectangular" animation="wave" height={180} sx={{ borderRadius: 2 }} />
                            <Skeleton variant="text" animation="wave" width="60%" />
                            <Skeleton variant="text" animation="wave" width="90%" />
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                // bikin square
                                aspectRatio: '6 / 10',
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'box-shadow .3s',
                                '&:hover': { boxShadow: 2 },

                                // layout isi
                                display: 'flex',
                                flexDirection: 'column',
                                // padding dalam supaya konten nggak mepet
                                p: 0,
                            }}
                        >
                            {/* Card / image */}
                            <Skeleton variant="rectangular" animation="wave" height={180} sx={{ borderRadius: 2 }} />
                            <Skeleton variant="text" animation="wave" width="60%" />
                            <Skeleton variant="text" animation="wave" width="90%" />
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                // bikin square
                                aspectRatio: '6 / 10',
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'box-shadow .3s',
                                '&:hover': { boxShadow: 2 },

                                // layout isi
                                display: 'flex',
                                flexDirection: 'column',
                                // padding dalam supaya konten nggak mepet
                                p: 0,
                            }}
                        >
                            {/* Card / image */}
                            <Skeleton variant="rectangular" animation="wave" height={180} sx={{ borderRadius: 2 }} />
                            <Skeleton variant="text" animation="wave" width="60%" />
                            <Skeleton variant="text" animation="wave" width="90%" />
                        </Paper>
                        <Paper
                            variant="outlined"
                            sx={{
                                // bikin square
                                aspectRatio: '6 / 10',
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'box-shadow .3s',
                                '&:hover': { boxShadow: 2 },

                                // layout isi
                                display: 'flex',
                                flexDirection: 'column',
                                // padding dalam supaya konten nggak mepet
                                p: 0,
                            }}
                        >
                            {/* Card / image */}
                            <Skeleton variant="rectangular" animation="wave" height={180} sx={{ borderRadius: 2 }} />
                            <Skeleton variant="text" animation="wave" width="60%" />
                            <Skeleton variant="text" animation="wave" width="90%" />
                        </Paper>
                    </Box>
                </Box>
            </Paper>
        </>
    )
}
