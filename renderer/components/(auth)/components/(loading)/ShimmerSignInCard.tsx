'use client';

import { Card as MuiCard, Skeleton, Stack, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Card biar konsisten sama SignInCard
const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2.5),
    borderRadius: theme.spacing(3),
    [theme.breakpoints.up('sm')]: { width: 450 },
}));

export default function ShimmerSignInCard() {
    return (
        <Card variant="outlined">
            {/* Header */}
            <Stack spacing={1} alignItems="center">
                <Skeleton variant="text" width="60%" height={32} animation="wave" />
                <Skeleton variant="text" width="80%" height={20} animation="wave" />
            </Stack>

            {/* Username field */}
            <Box>
                <Skeleton variant="text" width="30%" height={20} animation="wave" sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={56} animation="wave" sx={{ borderRadius: 2 }} />
            </Box>

            {/* Password field */}
            <Box>
                <Skeleton variant="text" width="30%" height={20} animation="wave" sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={56} animation="wave" sx={{ borderRadius: 2 }} />
            </Box>

            {/* Checkbox */}
            <Skeleton variant="text" width="40%" height={20} animation="wave" />

            {/* Submit button */}
            <Skeleton variant="rectangular" height={48} animation="wave" sx={{ borderRadius: 3 }} />
        </Card>
    );
}
