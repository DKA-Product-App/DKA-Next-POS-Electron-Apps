import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Skeleton from '@mui/material/Skeleton'

export default function ShimmerContent() {
    // jumlah item skeleton sama kayak items asli (4)
    return (
        <Stack sx={{ flexDirection: 'column', alignSelf: 'center', gap: 4, maxWidth: 450 }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                {/* tempat logo skeleton */}
                <Skeleton variant="circular" width={40} height={40} />
            </Box>

            {[...Array(4)].map((_, index) => (
                <Stack key={index} direction="row" sx={{ gap: 2 }}>
                    {/* icon skeleton */}
                    <Skeleton variant="circular" width={32} height={32} />

                    {/* text skeleton */}
                    <Stack sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="70%" height={24} />
                        <Skeleton variant="text" width="90%" height={18} />
                    </Stack>
                </Stack>
            ))}
        </Stack>
    )
}
